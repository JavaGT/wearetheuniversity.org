#!/usr/bin/env node
import { promises as fsp } from 'fs';
import { join } from 'path';
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
const ARCHIVE_DIR = join(process.cwd(), 'source', 'archive');
const BLOG_DIR = join(process.cwd(), 'source', 'blog');

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

// Parse frontmatter from markdown content
function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') {
    return { frontmatter: null, body: content };
  }
  
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    return { frontmatter: null, body: content };
  }
  
  const frontmatterText = lines.slice(1, endIndex).join('\n');
  const body = lines.slice(endIndex + 1).join('\n');
  
  try {
    const frontmatter = yaml.load(frontmatterText);
    return { frontmatter, body };
  } catch (error) {
    logger.error(`Failed to parse frontmatter: ${error.message}`);
    return { frontmatter: null, body: content };
  }
}

// Fix permalink in a markdown file
async function fixPermalink(filePath, pathType) {
  try {
    const content = await fsp.readFile(filePath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    
    if (!frontmatter || !frontmatter.permalink) {
      logger.debug(`No permalink found in: ${filePath}`);
      return false;
    }
    
    // Check if permalink is missing the correct prefix
    const currentPermalink = frontmatter.permalink;
    const expectedPrefix = `/${pathType}/`;
    
    if (currentPermalink.startsWith(expectedPrefix)) {
      logger.debug(`Permalink already correct in: ${filePath}`);
      return false;
    }
    
    // Check if it's a date-based permalink that needs fixing
    const datePermalinkPattern = /^\/(\d{4})\/(\d{2})\/(\d{2})\//;
    const match = currentPermalink.match(datePermalinkPattern);
    
    if (!match) {
      logger.debug(`Permalink doesn't match date pattern in: ${filePath}`);
      return false;
    }
    
    // Fix the permalink by adding the correct prefix
    const fixedPermalink = `/${pathType}${currentPermalink}`;
    frontmatter.permalink = fixedPermalink;
    
    // Rebuild the file content
    const newFrontmatter = `---\n${yaml.dump(frontmatter)}---\n`;
    const newContent = newFrontmatter + body;
    
    await fsp.writeFile(filePath, newContent, 'utf8');
    
    logger.success(`Fixed permalink in: ${filePath}`);
    logger.info(`  Old: ${currentPermalink}`);
    logger.info(`  New: ${fixedPermalink}`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to process ${filePath}: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  logger.info('Starting permalink fix for archive and blog files...');
  
  let totalFixedArchive = 0;
  let totalFixedBlog = 0;
  
  // Process archive files
  logger.info('Processing archive files...');
  const archiveFiles = await findAllMarkdownFiles(ARCHIVE_DIR);
  logger.info(`Found ${archiveFiles.length} archive markdown files`);
  
  for (const file of archiveFiles) {
    const fixed = await fixPermalink(file, 'archive');
    if (fixed) totalFixedArchive++;
  }
  
  // Process blog files
  logger.info('Processing blog files...');
  const blogFiles = await findAllMarkdownFiles(BLOG_DIR);
  logger.info(`Found ${blogFiles.length} blog markdown files`);
  
  for (const file of blogFiles) {
    const fixed = await fixPermalink(file, 'blog');
    if (fixed) totalFixedBlog++;
  }
  
  logger.success(`Fix complete!`);
  logger.info(`Archive files fixed: ${totalFixedArchive}`);
  logger.info(`Blog files fixed: ${totalFixedBlog}`);
  logger.info(`Total files fixed: ${totalFixedArchive + totalFixedBlog}`);
}

main().catch(error => {
  logger.error('Script failed:', error);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}