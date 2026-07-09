#!/usr/bin/env node
/**
 * Generate RSS for recent archive + blog items (after build or from source).
 *
 *   npm run archive:rss
 *
 * Writes:
 *   dist/archive/feed.xml  (if dist exists)
 *   source/archive/feed.xml (template copy for archive host passthrough)
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIMIT = 50;

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['years', 'sources', 'scoop'].includes(e.name)) continue;
      await walk(full, out);
    } else if (e.isFile() && e.name.endsWith('.md') && e.name !== 'index.md') {
      out.push(full);
    }
  }
  return out;
}

function parseFm(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return null;
  try {
    return yaml.load(content.slice(4, end));
  } catch {
    return null;
  }
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function collect(dir, host, basePath) {
  const files = await walk(dir);
  const items = [];
  for (const file of files) {
    const content = await fsp.readFile(file, 'utf8');
    const fm = parseFm(content);
    if (!fm || fm.draft) continue;
    const date = fm.date ? new Date(fm.date) : null;
    if (!date || isNaN(date)) continue;
    let link = fm.permalink
      ? host + String(fm.permalink).replace(/index\.html$/, '')
      : host + basePath;
    items.push({
      title: fm.title || path.basename(file),
      link,
      date,
      description: fm.excerpt || '',
    });
  }
  return items;
}

function buildFeed(title, link, items) {
  const sorted = items.sort((a, b) => b.date - a.date).slice(0, LIMIT);
  const itemsXml = sorted
    .map(
      (i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <guid>${esc(i.link)}</guid>
      <pubDate>${i.date.toUTCString()}</pubDate>
      <description>${esc(i.description)}</description>
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(title)}</title>
    <link>${esc(link)}</link>
    <description>${esc(title)}</description>
    <language>en-nz</language>
${itemsXml}
  </channel>
</rss>
`;
}

async function main() {
  const archiveItems = await collect(
    path.join(ROOT, 'source', 'archive'),
    'https://archive.wearetheuniversity.org',
    '/'
  );
  const blogItems = await collect(
    path.join(ROOT, 'source', 'blog'),
    'https://blog.wearetheuniversity.org',
    '/'
  );

  const archiveFeed = buildFeed(
    'WATU Research Archive',
    'https://archive.wearetheuniversity.org/',
    archiveItems
  );
  const blogFeed = buildFeed('WATU Blog', 'https://blog.wearetheuniversity.org/', blogItems);

  for (const [distDir, feed] of [
    [path.join(ROOT, 'dist', 'archive'), archiveFeed],
    [path.join(ROOT, 'dist', 'blog'), blogFeed],
  ]) {
    await fsp.mkdir(distDir, { recursive: true });
    await fsp.writeFile(path.join(distDir, 'feed.xml'), feed);
  }
  console.log(
    `[rss] archive items considered=${archiveItems.length}, blog=${blogItems.length} → dist/*/feed.xml`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
