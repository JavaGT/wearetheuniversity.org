#!/usr/bin/env node
/**
 * Run Pagefind over dist/archive after Eleventy build.
 *
 *   npm run build:archive   # includes this step when pagefind is installed
 *   node scripts/archive/pagefind.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = path.join(ROOT, 'dist', 'archive');

if (!existsSync(SITE)) {
  console.error('dist/archive missing — run npm run build:archive first');
  process.exit(1);
}

const r = spawnSync(
  'npx',
  ['--yes', 'pagefind@1.3.0', '--site', SITE, '--output-subdir', 'pagefind'],
  { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' }
);
process.exit(r.status ?? 1);
