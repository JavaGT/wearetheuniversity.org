#!/usr/bin/env node
import { promises as fsp } from 'fs';
import { join } from 'path';

const progress = {
  start: (message) => {
    console.log(`\n${message}`);
    console.log('─'.repeat(50));
  },
  step: (current, total, message) => {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total}) ${message}`);
  },
  complete: (stats) => {
    console.log('\n');
    console.log('─'.repeat(50));
    console.log(`Processed: ${stats.processed}, Modified: ${stats.modified}, Errors: ${stats.errors}, Time: ${stats.duration}ms`);
    console.log('─'.repeat(50));
  },
  error: (message) => console.error(`Error: ${message}`),
  warn: (message) => console.warn(`Warning: ${message}`)
};

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
    progress.warn(`Cannot read directory: ${dir}`);
  }
  return results;
}

async function ensureLayoutInMarkdown(mdPath) {
  try {
    let mdContent = await fsp.readFile(mdPath, 'utf8');
    if (/^---[\s\S]*---/.test(mdContent)) {
      if (!/^---[\s\S]*layout:\s*layout\.njk/m.test(mdContent)) {
        mdContent = mdContent.replace(/^(---[\s\S]*?)\n(---)/m, (m, p1, p2) => `${p1}\nlayout: layout.njk\n${p2}`);
        await fsp.writeFile(mdPath, mdContent, 'utf8');
        return { modified: true, error: false };
      }
      return { modified: false, error: false };
    } else {
      mdContent = `---\nlayout: layout.njk\n---\n` + mdContent;
      await fsp.writeFile(mdPath, mdContent, 'utf8');
      return { modified: true, error: false };
    }
  } catch (error) {
    progress.error(`Failed to process ${mdPath}: ${error.message}`);
    return { modified: false, error: true };
  }
}

async function main() {
  const startTime = Date.now();
  progress.start('Ensuring layout in Markdown files');

  const dirs = [
    join(process.cwd(), 'source', 'archive'),
    join(process.cwd(), 'source', 'blog')
  ];

  let allFiles = [];
  for (const dir of dirs) {
    const files = await findAllMarkdownFiles(dir);
    allFiles = allFiles.concat(files);
    console.log(`   Found ${files.length} files in ${dir.split('/').pop()}/`);
  }

  if (allFiles.length === 0) {
    console.log('No Markdown files found');
    return;
  }

  console.log(`\nProcessing ${allFiles.length} files total\n`);

  let stats = { processed: 0, modified: 0, errors: 0 };

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const filename = file.split('/').pop();
    progress.step(i + 1, allFiles.length, `Processing ${filename}`);

    const result = await ensureLayoutInMarkdown(file);
    stats.processed++;
    if (result.modified) stats.modified++;
    if (result.error) stats.errors++;
  }

  stats.duration = Date.now() - startTime;
  progress.complete(stats);
}

main().catch(error => {
  progress.error(`Script failed: ${error.message}`);
  process.exit(1);
});
