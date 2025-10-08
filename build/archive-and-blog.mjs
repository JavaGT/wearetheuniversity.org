#!/usr/bin/env node
import { promises as fsp } from 'fs';
import fs from 'fs';
import { join, dirname, basename, extname } from 'path';
import { simpleParser } from 'mailparser';
import yaml from 'js-yaml';

// Enhanced logger utility
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} ${msg}`),
  debug: (msg) => process.env.DEBUG && console.log(`[DEBUG] ${new Date().toISOString()} ${msg}`)
};

// Constants
const CACHE_FILE = join(process.cwd(), '.build-cache.json');
const BLOG_DIR = join(process.cwd(), 'source', 'blog');
const ARCHIVE_DIR = join(process.cwd(), 'source', 'archive');
const EMAIL_ATTACHMENT_HOSTED_DIRECTORY = 'attachments';

// Load build cache
async function loadCache() {
  try {
    const cacheData = await fsp.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(cacheData);
  } catch (error) {
    logger.debug('No existing cache found, starting fresh');
    return { fileHashes: {}, lastBuild: null };
  }
}

// Save build cache
async function saveCache(cache) {
  try {
    await fsp.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
    logger.debug('Build cache saved');
  } catch (error) {
    logger.warn(`Failed to save cache: ${error.message}`);
  }
}

// Calculate file hash
function getFileSignature(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return `${stats.size}-${stats.mtime.getTime()}`;
  } catch (error) {
    return null;
  }
}

// Check if file needs processing and return content if needed
async function needsProcessing(filePath, cache, forceRebuild = false) {
  if (forceRebuild) {
    const content = await fsp.readFile(filePath);
    const signature = getFileSignature(filePath);
    cache.fileHashes[filePath] = signature;
    return { needsUpdate: true, content };
  }
  
  const currentSignature = getFileSignature(filePath);
  if (!currentSignature) {
    return { needsUpdate: true, content: null }; // File doesn't exist
  }
  
  const needsUpdate = cache.fileHashes[filePath] !== currentSignature;
  
  if (needsUpdate) {
    const content = await fsp.readFile(filePath);
    cache.fileHashes[filePath] = currentSignature;
    return { needsUpdate: true, content };
  }
  
  return { needsUpdate: false, content: null };
}

// Load settings
async function loadSettings() {
  try {
    const settingsPath = join(process.cwd(), 'settings.json');
    const settingsContent = await fsp.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(settingsContent);
    
    // Ensure personalIdentifiers is always an array
    if (!settings.personalIdentifiers) {
      settings.personalIdentifiers = [];
    } else if (typeof settings.personalIdentifiers === 'object' && !Array.isArray(settings.personalIdentifiers)) {
      // Convert object format to array
      settings.personalIdentifiers = Object.keys(settings.personalIdentifiers);
    }
    
    return settings;
  } catch (error) {
    logger.warn('No settings.json found, using defaults');
    return { personalIdentifiers: [] };
  }
}

// Save attachment helper
async function saveAttachment(attachment) {
  const attachmentDir = join(process.cwd(), EMAIL_ATTACHMENT_HOSTED_DIRECTORY);
  await fsp.mkdir(attachmentDir, { recursive: true });
  
  const filename = attachment.filename || `attachment_${Date.now()}`;
  const filePath = join(attachmentDir, filename);
  
  await fsp.writeFile(filePath, attachment.content);
  return { filename, filePath };
}

// Filter out personal identifiers
function filterIdentifiers(text, identifiers) {
  if (!identifiers || !Array.isArray(identifiers)) {
    return text;
  }
  
  let filtered = text;
  for (const id of identifiers) {
    if (id && typeof id === 'string') {
      const re = new RegExp(id, 'gi');
      filtered = filtered.replace(re, '[REDACTED]');
    }
  }
  return filtered;
}

// Process a single EML file
async function processEMLFile(emlFilePath, identifiers, permalinkTracker, cache, forceRebuild = false) {
  const checkResult = await needsProcessing(emlFilePath, cache, forceRebuild);
  
  if (!checkResult.needsUpdate) {
    logger.debug(`Skipping unchanged EML file: ${emlFilePath}`);
    return null;
  }
  
  if (!checkResult.content) {
    logger.error(`Failed to read EML file: ${emlFilePath}`);
    return null;
  }
  
  logger.info(`Processing changed EML file: ${emlFilePath}`);
  
  try {
    const parsed = await simpleParser(checkResult.content);
    
    // Title
    const title = parsed.subject ? String(parsed.subject).replace(/"/g, '\\"') : 'Untitled';
    
    // Date (ISO)
    let date = '';
    if (parsed.date) {
      try {
        const d = new Date(parsed.date);
        if (!isNaN(d)) {
          date = d.toISOString();
        } else {
          date = String(parsed.date).replace(/"/g, '\\"');
        }
      } catch {
        date = String(parsed.date).replace(/"/g, '\\"');
      }
    }
    
    // Build body
    let body = '';
    const attachments = (parsed.attachments || []).filter(a => !a.contentType.includes('image'));
    for (const attachment of attachments) {
      const { filename } = await saveAttachment(attachment);
      body += `Attachment: [${attachment.filename}](/${EMAIL_ATTACHMENT_HOSTED_DIRECTORY}/${filename})\n`;
    }
    
    body += parsed.text || '';
    
    const images = (parsed.attachments || []).filter(a => a.contentType.includes('image'));
    for (const image of images) {
      const { filename } = await saveAttachment(image);
      body = body.replace(`[cid:${image.cid}]`, `![](/${EMAIL_ATTACHMENT_HOSTED_DIRECTORY}/${filename})`);
    }
    
    // Regexes for link, image, email
    const linkRegex = /(https?:\/\/\S+)/g;
    const imageRegex = /!\[\]\(([^)]+)\)/g;
    const emailRegex = /([\w.-]+@[\w.-]+)\b/g;
    
    body = body
      .replace(linkRegex, '[$1]($1)')
      .replace(imageRegex, '![]($1)')
      .replace(emailRegex, '[$1](mailto:$1)')
      .replace(/\n{4,}/g, '\n\n\n');
    
    body = filterIdentifiers(body, identifiers);
    
    // Excerpt: first 50 words of the processed body
    let excerpt = '';
    const words = body.split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      let excerptWords = words.slice(0, 50).join(' ');
      const needsEllipsis = words.length > 50;
      if (needsEllipsis) {
        excerptWords = excerptWords.replace(/[.?!,;:]*$/, '');
        excerptWords += '...';
      }
      const escapeYAML = str => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      excerpt = escapeYAML(excerptWords);
    }
    
    // Author details
    let author = '';
    if (parsed.from && parsed.from.value && parsed.from.value.length > 0) {
      author = parsed.from.value.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ');
    }
    
    let to = '';
    if (parsed.to && parsed.to.value && parsed.to.value.length > 0) {
      to = parsed.to.value.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ');
    }
    
    // Generate slug
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Parse date for permalink
    let y = '', m = '', d = '';
    if (date) {
      try {
        const dt = new Date(date);
        if (!isNaN(dt)) {
          y = String(dt.getUTCFullYear());
          m = String(dt.getUTCMonth() + 1).padStart(2, '0');
          d = String(dt.getUTCDate()).padStart(2, '0');
        }
      } catch {}
    }
    
    let permalink = '';
    if (y && m && d && slug) {
      const isBlog = emlFilePath.includes('/blog/');
      const base = isBlog ? 'blog' : 'archive';
      permalink = `/${base}/${y}/${m}/${d}/${slug}/index.html`;
    }
    
    // Compose frontmatter
    const fmData = {
      layout: 'layout.njk',
      title,
      date,
      excerpt,
      author,
      to,
      permalink
    };
    
    // Remove undefined/null keys
    Object.keys(fmData).forEach(k => (fmData[k] === undefined || fmData[k] === null) && delete fmData[k]);
    
    const frontmatter = `---\n${yaml.dump(fmData)}---\n`;
    
    return { markdown_body: frontmatter + body };
  } catch (error) {
    logger.error(`Error processing EML file ${emlFilePath}: ${error.message}`);
    return null;
  }
}

// Recursively find all .eml files in a directory
async function findEMLFiles(dir) {
  let results = [];
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(await findEMLFiles(fullPath));
      } else if (extname(entry.name).toLowerCase() === '.eml') {
        results.push(fullPath);
      }
    }
  } catch (error) {
    logger.warn(`Cannot read directory: ${dir}`);
  }
  return results;
}

// Recursively find all .md files in a directory
async function findAllMarkdownFiles(dir) {
  let results = [];
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(await findAllMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch (e) {
    logger.warn(`Cannot read directory: ${dir}`);
  }
  return results;
}

// Process markdown file for hash tracking
async function processMarkdownFile(mdPath, cache, forceRebuild) {
  const result = await needsProcessing(mdPath, cache, forceRebuild);
  
  if (result.needsUpdate) {
    logger.debug(`Markdown file content changed: ${mdPath}`);
    logger.debug(`Cache now has ${Object.keys(cache.fileHashes).length} entries`);
    return true; // File was updated in cache
  } else {
    logger.debug(`Markdown file unchanged: ${mdPath}`);
    return false; // File was skipped
  }
}

// Save processed markdown next to the .eml file
async function saveMarkdown(emlPath, markdown) {
  const mdPath = emlPath.replace(/\.eml$/i, '.md');
  await fsp.writeFile(mdPath, markdown, 'utf8');
}

// Main processing function
async function main() {
  const forceRebuild = process.argv.includes('--force') || process.argv.includes('-f');
  
  logger.info('Starting archive and blog processing...');
  if (forceRebuild) {
    logger.info('Force rebuild mode enabled - ignoring cache');
  }
  
  try {
    const cache = forceRebuild ? { fileHashes: {}, lastBuild: null } : await loadCache();
    const settings = await loadSettings();
    logger.info(`Loaded settings with ${settings.personalIdentifiers.length} personal identifiers`);
    
    let emlProcessedCount = 0;
    let emlSkippedCount = 0;
    let mdProcessedCount = 0;
    let mdSkippedCount = 0;
    
    // Process EML files
    const emlFiles = [
      ...(await findEMLFiles(BLOG_DIR)),
      ...(await findEMLFiles(ARCHIVE_DIR))
    ];
    
    logger.info(`Found ${emlFiles.length} EML files to process`);
    
    const permalinkTracker = new Map();
    
    for (const emlFile of emlFiles) {
      const result = await processEMLFile(emlFile, settings.personalIdentifiers || [], permalinkTracker, cache, forceRebuild);
      if (result) {
        await saveMarkdown(emlFile, result.markdown_body);
        emlProcessedCount++;
        logger.success(`Processed EML: ${emlFile}`);
      } else {
        emlSkippedCount++;
      }
    }
    
    // Process existing markdown files for hash tracking
    const mdFiles = [
      ...(await findAllMarkdownFiles(BLOG_DIR)),
      ...(await findAllMarkdownFiles(ARCHIVE_DIR))
    ];
    
    // Filter out EML-generated markdown files to avoid double processing
    const emlGeneratedPaths = new Set(emlFiles.map(f => f.replace(/\.eml$/i, '.md')));
    const existingMdFiles = mdFiles.filter(f => !emlGeneratedPaths.has(f));
    
    logger.info(`Found ${existingMdFiles.length} existing markdown files to track`);
    
    for (const mdFile of existingMdFiles) {
      const wasUpdated = await processMarkdownFile(mdFile, cache, forceRebuild);
      if (wasUpdated) {
        mdProcessedCount++;
        logger.debug(`Tracked changes in MD: ${mdFile}`);
      } else {
        mdSkippedCount++;
      }
    }
    
    // Save cache
    cache.lastBuild = new Date().toISOString();
    await saveCache(cache);
    
    logger.success(`Processing completed successfully`);
    logger.info(`EML files: ${emlProcessedCount} processed, ${emlSkippedCount} skipped`);
    logger.info(`MD files: ${mdProcessedCount} processed, ${mdSkippedCount} skipped (cached)`);
    
  } catch (error) {
    logger.error(`Processing failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
