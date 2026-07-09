#!/usr/bin/env node
/**
 * Drop-folder EML ingest for the research archive.
 *
 * Usage:
 *   node scripts/archive/ingest-eml.mjs --source=uoa-vc-updates path/to/file.eml
 *   node scripts/archive/ingest-eml.mjs --source=teu-auckland-university-emails ./inbox/*.eml
 *   node scripts/archive/ingest-eml.mjs --source=uoa-staff-communications --dir=./dropbox
 *
 * Copies .eml into source/archive/<source>/ then runs the EML→markdown pipeline
 * scoped to archive only.
 *
 * Known --source values (folders under source/archive/):
 *   direct, scoop, teu-auckland-university-emails, uoa-council,
 *   uoa-news-opinions-notices, uoa-staff-communications, uoa-vc-updates
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ARCHIVE = path.join(ROOT, 'source', 'archive');

const KNOWN_SOURCES = new Set([
  'direct',
  'scoop',
  'teu-auckland-university-emails',
  'uoa-council',
  'uoa-news-opinions-notices',
  'uoa-staff-communications',
  'uoa-vc-updates',
]);

function parseArgs(argv) {
  let source = null;
  let dir = null;
  const files = [];
  for (const a of argv) {
    if (a.startsWith('--source=')) source = a.slice('--source='.length);
    else if (a.startsWith('--dir=')) dir = a.slice('--dir='.length);
    else if (!a.startsWith('-')) files.push(a);
  }
  return { source, dir, files };
}

async function listEmls(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.eml'))
    .map((e) => path.join(dir, e.name));
}

async function uniqueDest(destDir, filename) {
  let dest = path.join(destDir, filename);
  if (!(await exists(dest))) return dest;
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let i = 2;
  while (await exists(path.join(destDir, `${base} (${i})${ext}`))) i++;
  return path.join(destDir, `${base} (${i})${ext}`);
}

async function exists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

function runPipeline() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(ROOT, 'build', 'archive-and-blog.mjs'), '--scope=archive', '--skip-md-track'],
      { cwd: ROOT, stdio: 'inherit' }
    );
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`pipeline exit ${code}`))));
  });
}

async function main() {
  const { source, dir, files } = parseArgs(process.argv.slice(2));
  if (!source || !KNOWN_SOURCES.has(source)) {
    console.error('Usage: node scripts/archive/ingest-eml.mjs --source=<folder> <files…| --dir=path>');
    console.error('Known sources:', [...KNOWN_SOURCES].join(', '));
    process.exit(1);
  }

  let inputs = [...files];
  if (dir) inputs = inputs.concat(await listEmls(path.resolve(dir)));
  inputs = inputs.filter((f) => f.toLowerCase().endsWith('.eml'));

  if (inputs.length === 0) {
    console.error('No .eml files given.');
    process.exit(1);
  }

  const destDir = path.join(ARCHIVE, source);
  await fsp.mkdir(destDir, { recursive: true });

  const copied = [];
  for (const src of inputs) {
    const abs = path.resolve(src);
    const dest = await uniqueDest(destDir, path.basename(abs));
    await fsp.copyFile(abs, dest);
    copied.push(dest);
    console.log(`[copy] ${abs} → ${dest}`);
  }

  console.log(`[pipeline] converting ${copied.length} new EML(s)…`);
  await runPipeline();
  console.log('[done] Place markdown is next to each .eml; commit source/ when ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
