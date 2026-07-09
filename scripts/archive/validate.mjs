#!/usr/bin/env node
/**
 * Lightweight archive health checks (no full Eleventy build).
 *
 *   node scripts/archive/validate.mjs
 *
 * Checks:
 *  - duplicate permalinks
 *  - missing layout / title / date front matter
 *  - empty title
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ARCHIVE = path.join(ROOT, 'source', 'archive');

const SKIP = new Set(['index.md']);
const SKIP_DIRS = new Set(['years', 'sources']);

async function walk(dir, out = []) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('_')) continue;
      await walk(full, out);
    } else if (e.isFile() && e.name.endsWith('.md') && !SKIP.has(e.name)) {
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
    return { __parseError: true };
  }
}

async function main() {
  const files = await walk(ARCHIVE);
  const permalinks = new Map();
  let missingLayout = 0;
  let missingTitle = 0;
  let missingDate = 0;
  let parseErrors = 0;
  let missingPermalink = 0;

  for (const file of files) {
    const content = await fsp.readFile(file, 'utf8');
    const fm = parseFm(content);
    if (!fm) {
      parseErrors++;
      continue;
    }
    if (fm.__parseError) {
      parseErrors++;
      console.warn(`[yaml] ${file}`);
      continue;
    }
    if (!fm.layout) missingLayout++;
    if (!fm.title) missingTitle++;
    if (!fm.date) missingDate++;
    if (!fm.permalink) missingPermalink++;
    else {
      const list = permalinks.get(fm.permalink) || [];
      list.push(file);
      permalinks.set(fm.permalink, list);
    }
  }

  const dupes = [...permalinks.entries()].filter(([, v]) => v.length > 1);
  console.log(`Scanned ${files.length} archive markdown files`);
  console.log(`  missing layout:    ${missingLayout}`);
  console.log(`  missing title:     ${missingTitle}`);
  console.log(`  missing date:      ${missingDate}`);
  console.log(`  missing permalink: ${missingPermalink}`);
  console.log(`  frontmatter errors:${parseErrors}`);
  console.log(`  duplicate permalinks: ${dupes.length}`);
  for (const [p, filesFor] of dupes.slice(0, 20)) {
    console.log(`    ${p}`);
    for (const f of filesFor) console.log(`      - ${path.relative(ROOT, f)}`);
  }
  if (dupes.length > 20) console.log(`    …and ${dupes.length - 20} more`);

  const bad = missingLayout + parseErrors + dupes.length;
  process.exit(bad > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
