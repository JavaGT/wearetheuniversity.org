#!/usr/bin/env node
/**
 * PDF drop pipeline for council / direct docs.
 *
 *   npm run archive:pdf -- --source=uoa-council path/to.pdf
 *   npm run archive:pdf -- --dir=source/archive/uoa-council/incoming
 *
 * Requires `pdftotext` (poppler) on PATH. Copies PDF to attachments/ with stable name,
 * writes markdown stub with excerpt + link.
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { redactText } from '../../lib/redaction.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ATT = path.join(ROOT, 'attachments');

function parseArgs(argv) {
  let source = 'direct';
  let dir = null;
  const files = [];
  for (const a of argv) {
    if (a.startsWith('--source=')) source = a.slice('--source='.length);
    else if (a.startsWith('--dir=')) dir = a.slice('--dir='.length);
    else if (!a.startsWith('-')) files.push(a);
  }
  return { source, dir, files };
}

function pdftotext(file) {
  const r = spawnSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (r.error) throw new Error('pdftotext not available — install poppler (brew install poppler)');
  if (r.status !== 0) throw new Error(r.stderr || 'pdftotext failed');
  return r.stdout || '';
}

async function listPdfs(dir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.pdf')).map((e) => path.join(dir, e.name));
}

async function processOne(pdfPath, source) {
  const buf = await fsp.readFile(pdfPath);
  const hash = createHash('sha256').update(buf).digest('hex').slice(0, 12);
  const day = new Date().toISOString().slice(0, 10);
  const base = path.basename(pdfPath, '.pdf').replace(/[^\w.\-]+/g, '-').slice(0, 80);
  const attName = `${day}-${base}-${hash}.pdf`;
  await fsp.mkdir(ATT, { recursive: true });
  await fsp.writeFile(path.join(ATT, attName), buf);

  let text = '';
  try {
    text = pdftotext(pdfPath);
  } catch (e) {
    console.warn(`[pdf] text extract skipped: ${e.message}`);
  }
  text = redactText(text || '');
  const title = redactText(base.replace(/[-_]+/g, ' '));
  const slug = `${base}-${hash}`.toLowerCase();
  const permalink = `/archive/${day.slice(0, 4)}/${day.slice(5, 7)}/${day.slice(8, 10)}/${slug}/index.html`;
  const outDir = path.join(ROOT, 'source', 'archive', source);
  await fsp.mkdir(outDir, { recursive: true });
  const mdPath = path.join(outDir, `${day}_${slug}.md`);
  const excerpt = text.split(/\s+/).slice(0, 50).join(' ');
  const md = `---
layout: layout.njk
title: ${JSON.stringify(title)}
date: ${JSON.stringify(day + 'T00:00:00.000Z')}
permalink: ${permalink}
tags:
  - pdf
  - ${source}
source: ${source}
excerpt: ${JSON.stringify(excerpt)}
---

# ${title}

Attachment: [${attName}](/attachments/${attName})

${text ? text.slice(0, 50000) : '*No text extracted — see PDF attachment.*'}
`;
  await fsp.writeFile(mdPath, md, 'utf8');
  console.log(`[pdf] ${path.basename(pdfPath)} → ${path.relative(ROOT, mdPath)}`);
}

async function main() {
  const { source, dir, files } = parseArgs(process.argv.slice(2));
  let inputs = files.map((f) => path.resolve(f));
  if (dir) inputs = inputs.concat(await listPdfs(path.resolve(dir)));
  inputs = inputs.filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (!inputs.length) {
    console.error('Usage: npm run archive:pdf -- [--source=uoa-council] file.pdf');
    process.exit(1);
  }
  for (const f of inputs) await processOne(f, source);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
