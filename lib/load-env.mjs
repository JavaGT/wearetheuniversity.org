/**
 * Minimal .env loader (no dependency). Does not override existing process.env.
 * Looks for .env in project root.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export function loadEnv(root = process.cwd()) {
  const path = join(root, '.env');
  if (!existsSync(path)) return false;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
  return true;
}
