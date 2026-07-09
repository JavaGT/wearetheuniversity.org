/**
 * Auto-classify EML by List-Id / From / Subject headers (no IMAP).
 * Used by ingest-eml when --source is omitted.
 */
import { simpleParser } from 'mailparser';
import { readFileSync } from 'fs';

const RULES = [
  {
    source: 'uoa-vc-updates',
    test: (h) =>
      /vice-?chancellor/i.test(h.from + h.subject) ||
      /vc-update|vice.chancellor/i.test(h.listId) ||
      /from:.*freshwater|from:.*vice.chancellor/i.test(h.rawHeaders),
  },
  {
    source: 'teu-auckland-university-emails',
    test: (h) =>
      /\bteu\b/i.test(h.from + h.subject + h.listId) ||
      /tertiary education union/i.test(h.from + h.subject),
  },
  {
    source: 'uoa-staff-communications',
    test: (h) =>
      /all-staff|staff.communications|staff-notice/i.test(h.listId + h.subject + h.to) ||
      /all-staff@list\.auckland/i.test(h.to + h.rawHeaders),
  },
  {
    source: 'uoa-council',
    test: (h) => /council|senate/i.test(h.subject) && /auckland/i.test(h.from + h.subject),
  },
  {
    source: 'uoa-news-opinions-notices',
    test: (h) =>
      /@auckland\.ac\.nz/i.test(h.from) ||
      /university of auckland/i.test(h.from + h.subject),
  },
];

export async function classifyEmlBuffer(buf) {
  const parsed = await simpleParser(buf);
  const from = (parsed.from?.text || '') + ' ' + (parsed.from?.value?.[0]?.address || '');
  const to = parsed.to?.text || '';
  const subject = parsed.subject || '';
  const listId = parsed.headers?.get('list-id') || '';
  const rawHeaders = typeof parsed.headerLines === 'object'
    ? parsed.headerLines.map((h) => h.line).join('\n')
    : '';

  const h = { from, to, subject, listId: String(listId), rawHeaders };
  for (const rule of RULES) {
    if (rule.test(h)) return rule.source;
  }
  return 'direct';
}

export async function classifyEmlFile(filePath) {
  const buf = readFileSync(filePath);
  return classifyEmlBuffer(buf);
}

export const KNOWN_SOURCES = [
  'direct',
  'scoop',
  'teu-auckland-university-emails',
  'uoa-council',
  'uoa-news-opinions-notices',
  'uoa-staff-communications',
  'uoa-vc-updates',
];
