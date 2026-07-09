#!/usr/bin/env node
/**
 * Public page change detection.
 *
 *   npm run archive:page-watch
 *
 * Hashes PAGE_WATCH_URLS from .env; writes change notes under
 * source/archive/direct/_page-watch/ when content hash changes.
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { loadEnv } from '../../lib/load-env.mjs';
import { redactText } from '../../lib/redaction.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE = path.join(ROOT, '.data', 'page-watch-state.json');
const OUT = path.join(ROOT, 'source', 'archive', 'direct', '_page-watch');

loadEnv(ROOT);

function urls() {
  return (process.env.PAGE_WATCH_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function loadState() {
  try {
    return JSON.parse(await fsp.readFile(STATE, 'utf8'));
  } catch {
    return { pages: {} };
  }
}

async function saveState(s) {
  await fsp.mkdir(path.dirname(STATE), { recursive: true });
  await fsp.writeFile(STATE, JSON.stringify(s, null, 2));
}

async function main() {
  const list = urls();
  if (!list.length) {
    console.error('Set PAGE_WATCH_URLS in .env');
    process.exit(1);
  }
  const state = await loadState();
  await fsp.mkdir(OUT, { recursive: true });
  let changes = 0;

  for (const url of list) {
    console.log(`[watch] ${url}`);
    let html = '';
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'WATU-archive-bot/1.0 (+https://wearetheuniversity.org)' },
      });
      if (!res.ok) {
        console.warn(`  HTTP ${res.status}`);
        continue;
      }
      html = await res.text();
    } catch (e) {
      console.warn(`  ${e.message}`);
      continue;
    }
    // Normalize: strip scripts/styles/noise
    const norm = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const hash = createHash('sha256').update(norm).digest('hex');
    const prev = state.pages[url];
    if (prev && prev.hash === hash) {
      console.log('  unchanged');
      continue;
    }
    const day = new Date().toISOString().slice(0, 10);
    const host = new URL(url).hostname.replace(/\W+/g, '-');
    const title = redactText(
      prev ? `Page change detected: ${host}` : `Page watch baseline: ${host}`
    );
    const slug = `page-watch-${host}-${day}`;
    const md = `---
layout: layout.njk
title: ${JSON.stringify(title)}
date: ${JSON.stringify(day + 'T00:00:00.000Z')}
draft: true
tags:
  - page-watch
source-url: ${JSON.stringify(url)}
permalink: /archive/${day.slice(0, 4)}/${day.slice(5, 7)}/${day.slice(8, 10)}/${slug}/index.html
excerpt: "Public page hash changed — review manually."
---

# ${title}

URL: [${url}](${url})

- Previous hash: \`${prev?.hash || 'none'}\`
- Current hash: \`${hash}\`
- Detected: ${new Date().toISOString()}

This is a **draft** change notice. Inspect the live page and decide whether to archive a snapshot.
`;
    const file = path.join(OUT, `${day}_${slug}.md`);
    await fsp.writeFile(file, md, 'utf8');
    state.pages[url] = { hash, at: new Date().toISOString(), file: path.relative(ROOT, file) };
    changes++;
    console.log(`  CHANGE → ${path.relative(ROOT, file)}`);
  }
  await saveState(state);
  console.log(`[watch] ${changes} change note(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
