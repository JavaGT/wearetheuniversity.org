#!/usr/bin/env node
/**
 * OIA / FYI.org.nz watchlist — creates draft stubs for human review (no auto-publish claim).
 *
 *   npm run archive:oia
 *
 * Uses FYI search HTML (best-effort). Writes to source/archive/direct/_oia-watch/
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from '../../lib/load-env.mjs';
import { redactText } from '../../lib/redaction.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'source', 'archive', 'direct', '_oia-watch');
const STATE = path.join(ROOT, '.data', 'oia-state.json');

loadEnv(ROOT);

function keywords() {
  return (process.env.OIA_KEYWORDS || 'University of Auckland')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function loadState() {
  try {
    return JSON.parse(await fsp.readFile(STATE, 'utf8'));
  } catch {
    return { seen: {} };
  }
}

async function saveState(s) {
  await fsp.mkdir(path.dirname(STATE), { recursive: true });
  await fsp.writeFile(STATE, JSON.stringify(s, null, 2));
}

async function searchFyi(q) {
  const url = `https://fyi.org.nz/search/${encodeURIComponent(q)}/all`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WATU-archive-bot/1.0 (+https://wearetheuniversity.org)' },
  });
  if (!res.ok) throw new Error(`FYI HTTP ${res.status}`);
  const html = await res.text();
  const links = [];
  const re = /href="(\/request\/[^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    links.push(`https://fyi.org.nz${m[1].split('#')[0]}`);
  }
  return [...new Set(links)].slice(0, 20);
}

async function main() {
  const state = await loadState();
  await fsp.mkdir(OUT, { recursive: true });
  let n = 0;
  for (const kw of keywords()) {
    console.log(`[oia] search FYI: ${kw}`);
    let links = [];
    try {
      links = await searchFyi(kw);
    } catch (e) {
      console.warn(e.message);
      continue;
    }
    for (const link of links) {
      if (state.seen[link]) continue;
      const day = new Date().toISOString().slice(0, 10);
      const slug = link.split('/').pop().slice(0, 80) || `oia-${Date.now()}`;
      const title = redactText(`OIA watch: ${slug.replace(/-/g, ' ')}`);
      const md = `---
layout: layout.njk
title: ${JSON.stringify(title)}
date: ${JSON.stringify(day + 'T00:00:00.000Z')}
draft: true
tags:
  - oia
  - watchlist
source-url: ${JSON.stringify(link)}
permalink: /archive/${day.slice(0, 4)}/${day.slice(5, 7)}/${day.slice(8, 10)}/oia-${slug}/index.html
excerpt: "Draft OIA/FYI stub — review before un-drafting."
---

# ${title}

Source (FYI.org.nz): [${link}](${link})

This is an **auto-generated draft** from the OIA watchlist. Confirm relevance and accuracy before publishing (\`draft: false\`).
`;
      const file = path.join(OUT, `${day}_${slug}.md`);
      await fsp.writeFile(file, md, 'utf8');
      state.seen[link] = { at: new Date().toISOString() };
      n++;
      console.log(`[oia] + ${link}`);
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  await saveState(state);
  console.log(`[oia] ${n} new draft stub(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
