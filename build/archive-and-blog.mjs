#!/usr/bin/env node
import { promises as fsp } from 'fs';
import fs from 'fs';
import { createHash } from 'crypto';
import { join, dirname, basename, extname } from 'path';
import { simpleParser } from 'mailparser';
import yaml from 'js-yaml';
import { getRedactionConfig, redactText, hasIdentifiersConfigured } from '../lib/redaction.mjs';

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

// Load identifiers from .env (preferred) + optional legacy settings.json
async function loadSettings() {
  const cfg = getRedactionConfig(process.cwd());
  let fromSettings = [];
  try {
    const settingsPath = join(process.cwd(), 'settings.json');
    const settingsContent = await fsp.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(settingsContent);
    if (Array.isArray(settings.personalIdentifiers)) {
      fromSettings = settings.personalIdentifiers;
    } else if (settings.personalIdentifiers && typeof settings.personalIdentifiers === 'object') {
      fromSettings = Object.keys(settings.personalIdentifiers);
    }
  } catch {
    // settings.json optional / gitignored
  }
  // Merge (env first / longest handled in redactText via sort)
  const personalIdentifiers = [...cfg.identifiers, ...fromSettings.filter(Boolean)];
  if (!personalIdentifiers.length) {
    logger.warn('No REDACT_IDENTIFIERS in .env and no settings.json identifiers — content will not be redacted');
  } else {
    logger.info(`Redaction active: ${personalIdentifiers.length} pattern(s) from env/settings`);
  }
  return { personalIdentifiers, replacement: cfg.replacement };
}

// Stable, non-empty attachment filenames
async function saveAttachment(attachment, dateHint = '') {
  const attachmentDir = join(process.cwd(), EMAIL_ATTACHMENT_HOSTED_DIRECTORY);
  await fsp.mkdir(attachmentDir, { recursive: true });

  const content = attachment.content || Buffer.alloc(0);
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  const original = (attachment.filename || 'file').replace(/[^\w.\-()+ ]+/g, '_');
  let ext = extname(original);
  if (!ext && attachment.contentType) {
    const map = {
      'application/pdf': '.pdf',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'text/plain': '.txt',
    };
    ext = map[attachment.contentType] || '';
  }
  const base = basename(original, extname(original)) || 'attachment';
  const day = (dateHint || new Date().toISOString()).slice(0, 10);
  const filename = `${day}-${base}-${hash}${ext || ''}`.replace(/\s+/g, '-');
  const filePath = join(attachmentDir, filename);

  await fsp.writeFile(filePath, content);
  return { filename, filePath };
}

function filterIdentifiers(text, identifiers, replacement = '[REDACTED]') {
  // Prefer shared redaction module (word boundaries, longest-first)
  if (hasIdentifiersConfigured()) {
    return redactText(text);
  }
  if (!identifiers || !Array.isArray(identifiers)) return text;
  let filtered = String(text ?? '');
  const sorted = [...identifiers].filter(Boolean).sort((a, b) => b.length - a.length);
  for (const id of sorted) {
    const re = new RegExp(id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    filtered = filtered.replace(re, replacement);
  }
  return filtered;
}

// Process a single EML file
async function processEMLFile(emlFilePath, identifiers, permalinkTracker, cache, forceRebuild = false, replacement = '[REDACTED]') {
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
    
    // Date (ISO) first — used for attachment names
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

    // Title (redacted)
    let title = parsed.subject ? String(parsed.subject) : 'Untitled';
    title = filterIdentifiers(title, identifiers, replacement);
    
    // Build body
    let body = '';
    const attachments = (parsed.attachments || []).filter(a => a.contentType && !a.contentType.includes('image'));
    for (const attachment of attachments) {
      const { filename } = await saveAttachment(attachment, date);
      const label = filterIdentifiers(attachment.filename || filename, identifiers, replacement);
      body += `Attachment: [${label}](/${EMAIL_ATTACHMENT_HOSTED_DIRECTORY}/${filename})\n`;
    }
    
    body += parsed.text || '';
    
    const images = (parsed.attachments || []).filter(a => a.contentType && a.contentType.includes('image'));
    for (const image of images) {
      const { filename } = await saveAttachment(image, date);
      if (image.cid) {
        body = body.replace(`[cid:${image.cid}]`, `![](/${EMAIL_ATTACHMENT_HOSTED_DIRECTORY}/${filename})`);
      }
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
    
    body = filterIdentifiers(body, identifiers, replacement);
    
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
    
    // Author / to — always redacted (recipient headers often contain the archivist)
    let author = '';
    if (parsed.from && parsed.from.value && parsed.from.value.length > 0) {
      author = parsed.from.value.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ');
    }
    author = filterIdentifiers(author, identifiers, replacement);
    
    let to = '';
    if (parsed.to && parsed.to.value && parsed.to.value.length > 0) {
      to = parsed.to.value.map(a => a.name ? `${a.name} <${a.address}>` : a.address).join(', ');
    }
    // Prefer list addresses; redact personal recipients
    to = filterIdentifiers(to, identifiers, replacement);
    
    // Generate slug from redacted title
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item';
    
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

function parseScope(argv) {
  const arg = argv.find((a) => a.startsWith('--scope='));
  const scope = arg ? arg.slice('--scope='.length) : 'all';
  const allowed = new Set(['all', 'blog', 'archive', 'none']);
  if (!allowed.has(scope)) {
    logger.warn(`Unknown --scope=${scope}; using all`);
    return 'all';
  }
  return scope;
}

// Main processing function
async function main() {
  const forceRebuild = process.argv.includes('--force') || process.argv.includes('-f');
  const scope = parseScope(process.argv);
  const skipMdTrack = process.argv.includes('--skip-md-track');
  
  logger.info('Starting archive and blog processing...');
  logger.info(`Scope: ${scope}${skipMdTrack ? ' (skip markdown tracking)' : ''}`);
  if (forceRebuild) {
    logger.info('Force rebuild mode enabled - ignoring cache');
  }

  if (scope === 'none') {
    logger.info('Scope none — nothing to process');
    return;
  }
  
  try {
    const cache = forceRebuild ? { fileHashes: {}, lastBuild: null } : await loadCache();
    const settings = await loadSettings();
    
    let emlProcessedCount = 0;
    let emlSkippedCount = 0;
    let mdProcessedCount = 0;
    let mdSkippedCount = 0;

    const dirs = [];
    if (scope === 'all' || scope === 'blog') dirs.push(BLOG_DIR);
    if (scope === 'all' || scope === 'archive') dirs.push(ARCHIVE_DIR);
    
    // Process EML files
    let emlFiles = [];
    for (const dir of dirs) {
      emlFiles = emlFiles.concat(await findEMLFiles(dir));
    }
    
    logger.info(`Found ${emlFiles.length} EML files to process`);
    
    const permalinkTracker = new Map();
    
    for (const emlFile of emlFiles) {
      const result = await processEMLFile(
        emlFile,
        settings.personalIdentifiers || [],
        permalinkTracker,
        cache,
        forceRebuild,
        settings.replacement
      );
      if (result) {
        await saveMarkdown(emlFile, result.markdown_body);
        emlProcessedCount++;
        logger.success(`Processed EML: ${emlFile}`);
      } else {
        emlSkippedCount++;
      }
    }

    if (!skipMdTrack) {
      // Process existing markdown files for hash tracking
      let mdFiles = [];
      for (const dir of dirs) {
        mdFiles = mdFiles.concat(await findAllMarkdownFiles(dir));
      }
      
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
    } else {
      logger.info('Skipped markdown hash tracking');
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
