#!/usr/bin/env node
/**
 * Convert WebVTT transcripts to readable markdown (council meetings).
 *
 *   npm run archive:vtt
 *   npm run archive:vtt -- source/archive/uoa-council/vtt/2025-03-17.vtt
 *
 * Writes/updates sibling .md under uoa-council/md/ with layout + redaction.
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { redactText } from '../../lib/redaction.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_DIR = path.join(ROOT, 'source', 'archive', 'uoa-council', 'vtt');
const OUT_DIR = path.join(ROOT, 'source', 'archive', 'uoa-council', 'md');

function vttToText(vtt) {
  const lines = vtt.split(/\r?\n/);
  const out = [];
  let last = '';
  for (const line of lines) {
    const t = line.trim();
    if (!t || t === 'WEBVTT' || t.startsWith('NOTE') || t.includes('-->') || /^\d+$/.test(t)) continue;
    // drop cue settings
    if (t.startsWith('STYLE') || t.startsWith('REGION')) continue;
    if (t === last) continue;
    last = t;
    out.push(t);
  }
  // join short caption fragments into paragraphs
  return out.join(' ').replace(/\s+/g, ' ').replace(/ ([.?!])/g, '$1');
}

async function processOne(vttPath) {
  const base = path.basename(vttPath, '.vtt');
  const raw = await fsp.readFile(vttPath, 'utf8');
  let text = vttToText(raw);
  text = redactText(text);
  const date = /^\d{4}-\d{2}-\d{2}/.test(base) ? `${base}T00:00:00.000Z` : new Date().toISOString();
  const title = `University of Auckland Council Meeting ${base}`;
  const slug = `uoa-council-meeting-${base}`;
  const y = base.slice(0, 4);
  const m = base.slice(5, 7);
  const d = base.slice(8, 10);
  const permalink =
    y && m && d
      ? `/archive/${y}/${m}/${d}/${slug}/index.html`
      : `/archive/uoa-council/${slug}/index.html`;

  const md = `---
layout: layout.njk
title: ${JSON.stringify(title)}
date: ${JSON.stringify(date)}
slug: ${slug}
permalink: ${permalink}
tags:
  - council
  - transcript
source: uoa-council
excerpt: ${JSON.stringify(text.slice(0, 280) + (text.length > 280 ? '…' : ''))}
---

# ${title}

*Auto-generated from WebVTT transcript. Review for accuracy.*

${text}
`;
  await fsp.mkdir(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${base}.md`);
  await fsp.writeFile(outPath, md, 'utf8');
  console.log(`[vtt] ${path.relative(ROOT, vttPath)} → ${path.relative(ROOT, outPath)}`);
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  let files = args;
  if (!files.length) {
    const entries = await fsp.readdir(DEFAULT_DIR);
    files = entries.filter((f) => f.endsWith('.vtt')).map((f) => path.join(DEFAULT_DIR, f));
  }
  for (const f of files) await processOne(path.resolve(f));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
