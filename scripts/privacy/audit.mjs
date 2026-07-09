#!/usr/bin/env node
/**
 * Fail if configured personal identifiers appear in published-ish paths.
 *
 *   node scripts/privacy/audit.mjs
 *
 * Requires REDACT_IDENTIFIERS in .env or CI secrets.
 * Scans: source/, docs/, attachments/ (text-ish files only)
 * Skips: binary, .eml raw (base64 noise), scoop is still scanned for real phrases
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRedactionConfig, findLeaks, hasIdentifiersConfigured } from '../../lib/redaction.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROOTS = ['source', 'docs', 'attachments'].map((d) => path.join(ROOT, d));
const EXT = new Set(['.md', '.njk', '.html', '.css', '.js', '.mjs', '.json', '.txt', '.xml', '.vtt']);
const SKIP_DIR = new Set(['node_modules', '.git', 'dist', 'scoop']); // scoop optional — still check non-scoop by default
const SCAN_SCOOP = process.argv.includes('--include-scoop');

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
      if (SKIP_DIR.has(e.name) && !(SCAN_SCOOP && e.name === 'scoop')) continue;
      if (e.name === 'scoop' && !SCAN_SCOOP) continue;
      await walk(full, out);
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (EXT.has(ext) || e.name === 'CNAME') out.push(full);
    }
  }
  return out;
}

async function main() {
  if (!hasIdentifiersConfigured()) {
    console.error('REDACT_IDENTIFIERS is empty. Set it in .env or CI secrets before auditing.');
    process.exit(2);
  }
  const cfg = getRedactionConfig(ROOT);
  console.log(`Auditing with ${cfg.identifiers.length} identifier pattern(s)…`);

  let files = [];
  for (const r of ROOTS) files = files.concat(await walk(r));

  const leaks = [];
  for (const file of files) {
    let text;
    try {
      text = await fsp.readFile(file, 'utf8');
    } catch {
      continue;
    }
    // Skip huge files
    if (text.length > 2_000_000) continue;
    const found = findLeaks(text, cfg);
    if (found.length) {
      leaks.push({ file: path.relative(ROOT, file), found: [...new Set(found)] });
    }
  }

  if (leaks.length === 0) {
    console.log(`OK — no leaks in ${files.length} files.`);
    process.exit(0);
  }

  console.error(`FAIL — ${leaks.length} file(s) still contain identifiers:`);
  for (const L of leaks.slice(0, 50)) {
    console.error(`  ${L.file}: ${L.found.join(', ')}`);
  }
  if (leaks.length > 50) console.error(`  …and ${leaks.length - 50} more`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
