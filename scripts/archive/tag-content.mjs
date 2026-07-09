#!/usr/bin/env node
/**
 * Keyword → tags for archive/blog markdown (non-destructive when tags exist unless --force).
 *
 *   npm run archive:tag
 *   npm run archive:tag -- --force
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FORCE = process.argv.includes('--force');

const RULES = [
  { tag: 'course-cuts', re: /course cut|curriculum transformation|small course|under 60 enrol/i },
  { tag: 'merger', re: /facult(y|ies) merge|merger|combined faculty|law.*business/i },
  { tag: 'teu', re: /\bteu\b|tertiary education union|strike|bargaining/i },
  { tag: 'governance', re: /senate|council|vice-?chancellor|provost/i },
  { tag: 'marsden', re: /marsden/i },
  { tag: 'student-politics', re: /ausa|student association|open forum|rally/i },
  { tag: 'palestine', re: /palestine|gaza/i },
];

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
      if (e.name === 'scoop') continue; // skip bulk scoop by default
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
    const data = yaml.load(content.slice(4, end)) || {};
    return { data, body: content.slice(end + 4), end };
  } catch {
    return null;
  }
}

async function main() {
  const dirs = [
    path.join(ROOT, 'source', 'archive'),
    path.join(ROOT, 'source', 'blog'),
  ];
  let files = [];
  for (const d of dirs) files = files.concat(await walk(d));

  let updated = 0;
  for (const file of files) {
    const content = await fsp.readFile(file, 'utf8');
    const parsed = parseFm(content);
    if (!parsed) continue;
    const { data, body } = parsed;
    if (data.tags && !FORCE) continue;
    const hay = `${data.title || ''} ${data.excerpt || ''} ${body}`.slice(0, 20000);
    const tags = new Set(Array.isArray(data.tags) ? data.tags : []);
    for (const rule of RULES) {
      if (rule.re.test(hay)) tags.add(rule.tag);
    }
    // source folder as tag
    const rel = path.relative(path.join(ROOT, 'source', 'archive'), file);
    if (!rel.startsWith('..')) {
      const src = rel.split(path.sep)[0];
      if (src && src !== '_incoming') tags.add(src);
    }
    if (!tags.size) continue;
    data.tags = [...tags].sort();
    const next = `---\n${yaml.dump(data)}---${body.startsWith('\n') ? body : '\n' + body}`;
    if (next !== content) {
      await fsp.writeFile(file, next, 'utf8');
      updated++;
    }
  }
  console.log(`[tag] updated ${updated} file(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
