#!/usr/bin/env node
/**
 * Rewrite source/docs/attachments text files to strip identifiers from .env.
 *
 *   node scripts/privacy/redact-repo.mjs
 *   node scripts/privacy/redact-repo.mjs --dry-run
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRedactionConfig, redactText, hasIdentifiersConfigured, findLeaks } from '../../lib/redaction.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DRY = process.argv.includes('--dry-run');
const ROOTS = ['source', 'docs', 'attachments'].map((d) => path.join(ROOT, d));
const EXT = new Set(['.md', '.njk', '.html', '.css', '.txt', '.xml', '.vtt', '.json']);
const SKIP_DIR = new Set(['node_modules', '.git', 'dist']);

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
      if (SKIP_DIR.has(e.name)) continue;
      await walk(full, out);
    } else if (e.isFile() && EXT.has(path.extname(e.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  if (!hasIdentifiersConfigured()) {
    console.error('REDACT_IDENTIFIERS empty — nothing to do. Configure .env first.');
    process.exit(2);
  }
  const cfg = getRedactionConfig(ROOT);
  let files = [];
  for (const r of ROOTS) files = files.concat(await walk(r));

  let changed = 0;
  for (const file of files) {
    let text;
    try {
      text = await fsp.readFile(file, 'utf8');
    } catch {
      continue;
    }
    if (text.length > 5_000_000) continue;
    if (!findLeaks(text, cfg).length) continue;
    let next = redactText(text, cfg);
    // Prefer collective byline over bare redaction token in author fields
    next = next.replace(
      /^author:\s*\[REDACTED\]\s*$/gim,
      'author: WATU'
    );
    next = next.replace(
      /^author-url:\s*\[REDACTED\]\s*$/gim,
      ''
    );
    if (next === text) continue;
    changed++;
    console.log(`${DRY ? '[dry] ' : '[redact] '}${path.relative(ROOT, file)}`);
    if (!DRY) await fsp.writeFile(file, next, 'utf8');
  }
  console.log(`${DRY ? 'Would change' : 'Changed'} ${changed} file(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
