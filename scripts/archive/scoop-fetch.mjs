#!/usr/bin/env node
/**
 * Scoop incremental fetch (keyword-filtered — not a full dump grow).
 *
 *   npm run archive:scoop
 *
 * Uses Scoop search RSS/HTML lightly. Stores state in .data/scoop-state.json.
 * Manual review recommended before commit.
 *
 * Note: Respect Scoop.co.nz terms; this is best-effort for research mirroring.
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from '../../lib/load-env.mjs';
import { redactText } from '../../lib/redaction.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE = path.join(ROOT, '.data', 'scoop-state.json');
const OUT = path.join(ROOT, 'source', 'archive', 'scoop', '_incoming');

loadEnv(ROOT);

function keywords() {
  return (process.env.SCOOP_KEYWORDS || 'University of Auckland,TEU')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function loadState() {
  try {
    return JSON.parse(await fsp.readFile(STATE, 'utf8'));
  } catch {
    return { seen: {}, lastRun: null };
  }
}

async function saveState(state) {
  await fsp.mkdir(path.dirname(STATE), { recursive: true });
  await fsp.writeFile(STATE, JSON.stringify(state, null, 2));
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function searchScoop(q) {
  // Scoop search endpoint (HTML). Best-effort parse of story links.
  const url = `https://www.scoop.co.nz/stories/search?s=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WATU-archive-bot/1.0 (+https://wearetheuniversity.org; research mirror)' },
  });
  if (!res.ok) throw new Error(`Scoop search HTTP ${res.status} for ${q}`);
  const html = await res.text();
  const links = [];
  const re = /href="(\/stories\/[A-Z]{2}\d{4}\/S\d+\/[^"]+\.htm)"/gi;
  let m;
  while ((m = re.exec(html))) {
    links.push(`https://www.scoop.co.nz${m[1]}`);
  }
  return [...new Set(links)].slice(0, 25);
}

async function fetchStory(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WATU-archive-bot/1.0 (+https://wearetheuniversity.org; research mirror)' },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const titleM = html.match(/<title>([^<]+)<\/title>/i);
  const title = (titleM?.[1] || url).replace(/\s*[-|].*scoop.*/i, '').trim();
  // crude body: strip tags from article-ish region
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20000);
  return { title, body, url };
}

async function main() {
  const state = await loadState();
  const kws = keywords();
  let added = 0;
  await fsp.mkdir(OUT, { recursive: true });

  for (const kw of kws) {
    console.log(`[scoop] search: ${kw}`);
    let links = [];
    try {
      links = await searchScoop(kw);
    } catch (e) {
      console.warn(`[scoop] ${e.message}`);
      continue;
    }
    for (const link of links) {
      if (state.seen[link]) continue;
      const story = await fetchStory(link);
      if (!story) continue;
      const day = new Date().toISOString().slice(0, 10);
      const slug = slugify(story.title) || 'scoop-item';
      const title = redactText(story.title);
      const body = redactText(story.body);
      const md = `---
layout: layout.njk
title: ${JSON.stringify(title)}
date: ${JSON.stringify(day + 'T00:00:00.000Z')}
source-url: ${JSON.stringify(story.url)}
source: scoop
tags:
  - scoop
  - auto-fetch
permalink: /archive/${day.slice(0, 4)}/${day.slice(5, 7)}/${day.slice(8, 10)}/${slug}/index.html
excerpt: ${JSON.stringify(body.split(/\s+/).slice(0, 40).join(' '))}
---

# ${title}

Source: [${story.url}](${story.url})

${body}
`;
      const file = path.join(OUT, `${day}_${slug}.md`);
      await fsp.writeFile(file, md, 'utf8');
      state.seen[link] = { at: new Date().toISOString(), file: path.relative(ROOT, file) };
      added++;
      console.log(`[scoop] + ${title.slice(0, 60)}`);
      // be polite
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  state.lastRun = new Date().toISOString();
  await saveState(state);
  console.log(`[scoop] done — ${added} new item(s) in source/archive/scoop/_incoming/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
