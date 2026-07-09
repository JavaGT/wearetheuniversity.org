#!/usr/bin/env node
/**
 * Drop-folder EML ingest (manual Outlook downloads — no IMAP).
 *
 *   npm run archive:ingest -- path/to.eml
 *   npm run archive:ingest -- --source=uoa-vc-updates ./inbox/*.eml
 *   npm run archive:ingest -- --dir=./inbox
 *   npm run archive:ingest -- --dir=./inbox --classify
 *
 * With --classify (default when --source omitted), routes by List-Id/From/Subject.
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { classifyEmlFile, KNOWN_SOURCES } from './classify.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ARCHIVE = path.join(ROOT, 'source', 'archive');

function parseArgs(argv) {
  let source = null;
  let dir = null;
  let classify = false;
  const files = [];
  for (const a of argv) {
    if (a.startsWith('--source=')) source = a.slice('--source='.length);
    else if (a.startsWith('--dir=')) dir = a.slice('--dir='.length);
    else if (a === '--classify') classify = true;
    else if (!a.startsWith('-')) files.push(a);
  }
  if (!source) classify = true;
  return { source, dir, files, classify };
}

async function listEmls(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.eml'))
    .map((e) => path.join(dir, e.name));
}

async function exists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
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
  const { source, dir, files, classify } = parseArgs(process.argv.slice(2));
  if (source && !KNOWN_SOURCES.includes(source)) {
    console.error('Unknown --source. Known:', KNOWN_SOURCES.join(', '));
    process.exit(1);
  }

  let inputs = [...files];
  if (dir) inputs = inputs.concat(await listEmls(path.resolve(dir)));
  inputs = inputs.filter((f) => f.toLowerCase().endsWith('.eml'));

  if (inputs.length === 0) {
    console.error('No .eml files. Export from Outlook manually, then:');
    console.error('  npm run archive:ingest -- --dir=./inbox');
    process.exit(1);
  }

  const copied = [];
  for (const src of inputs) {
    const abs = path.resolve(src);
    let destSource = source;
    if (classify || !destSource) {
      destSource = await classifyEmlFile(abs);
      console.log(`[classify] ${path.basename(abs)} → ${destSource}`);
    }
    const destDir = path.join(ARCHIVE, destSource);
    await fsp.mkdir(destDir, { recursive: true });
    const dest = await uniqueDest(destDir, path.basename(abs));
    await fsp.copyFile(abs, dest);
    copied.push(dest);
    console.log(`[copy] → ${path.relative(ROOT, dest)}`);
  }

  console.log(`[pipeline] EML→markdown with redaction (${copied.length} file(s))…`);
  await runPipeline();
  console.log('[done] Review git diff, then commit. Raw .eml stay local-only if you prefer (git-rm after md exists).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
