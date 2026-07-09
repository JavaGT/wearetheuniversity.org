/**
 * Personal-identifier redaction for WATU content pipelines.
 * Identifiers come ONLY from environment (never hard-coded in repo).
 *
 * Env:
 *   REDACT_IDENTIFIERS  — comma or newline separated phrases (case-insensitive)
 *   REDACT_REPLACEMENT  — default "[REDACTED]"
 *   REDACT_MIN_LENGTH   — ignore tokens shorter than this (default 3)
 */
import { loadEnv } from './load-env.mjs';

let cached = null;

export function getRedactionConfig(root = process.cwd()) {
  if (cached) return cached;
  loadEnv(root);

  const raw = process.env.REDACT_IDENTIFIERS || '';
  const replacement = process.env.REDACT_REPLACEMENT || '[REDACTED]';
  const minLen = Number(process.env.REDACT_MIN_LENGTH || 3);

  const identifiers = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= minLen)
    // longest first so "Java Grant" wins over "Java"
    .sort((a, b) => b.length - a.length);

  cached = { identifiers, replacement, minLen };
  return cached;
}

export function clearRedactionCache() {
  cached = null;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a safe matcher. Short tokens use word boundaries to reduce
 * false positives inside base64 or other languages.
 */
function patternFor(id) {
  const esc = escapeRegExp(id);
  // Emails / domains / paths: substring match
  if (/[@./_]/.test(id) || id.length >= 8) {
    return new RegExp(esc, 'gi');
  }
  // Short bare words: word boundary
  return new RegExp(`\\b${esc}\\b`, 'gi');
}

export function redactText(text, config) {
  if (text == null || text === '') return text;
  const cfg = config || getRedactionConfig();
  if (!cfg.identifiers.length) return String(text);

  let out = String(text);
  for (const id of cfg.identifiers) {
    out = out.replace(patternFor(id), cfg.replacement);
  }
  return out;
}

/** Redact all string values in a plain object (shallow + one level nested arrays of strings). */
export function redactObject(obj, config) {
  if (!obj || typeof obj !== 'object') return obj;
  const cfg = config || getRedactionConfig();
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[k] = redactText(v, cfg);
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === 'string' ? redactText(x, cfg) : x));
    else out[k] = v;
  }
  return out;
}

/**
 * Scan text for any remaining identifiers. Returns list of matched phrases.
 */
export function findLeaks(text, config) {
  const cfg = config || getRedactionConfig();
  if (!text || !cfg.identifiers.length) return [];
  const found = [];
  for (const id of cfg.identifiers) {
    if (patternFor(id).test(String(text))) found.push(id);
  }
  return found;
}

export function hasIdentifiersConfigured() {
  return getRedactionConfig().identifiers.length > 0;
}
