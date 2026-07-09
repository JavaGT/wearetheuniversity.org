# Privacy + automation

## Policy

- **No IMAP** — university Outlook disabled it; staff/students export `.eml` manually and use drop-folder ingest.
- **Identifiers never live in git.** Configure `REDACT_IDENTIFIERS` in local `.env` (see `.env.example`) and as GitHub secret `REDACT_IDENTIFIERS` for CI.
- **All pipelines** (EML→md, VTT, PDF, Scoop, OIA stubs, page-watch, site builds) run content through `lib/redaction.mjs`.
- **CI gate:** `.github/workflows/privacy-audit.yml` fails if secrets are set and leaks remain in `source/` / `docs/` / text attachments.

## Audit findings (initial)

| Pattern | Found in repo (pre-redact) |
|---------|----------------------------|
| `Java Grant` | 5 blog posts (`author:`) |
| `javagrant.com` | 1 blog `author-url`, `leak copy.md` |
| `jgra818` | none in text content |
| `java.grant` | none |
| Bare `Java` | not scanned as sole token (too many false positives: programming language, names) |

**Fixed:** authors → `WATU`; removed personal URLs; deleted `leak copy.md`; `author-slug` removed.

**Not redacted (infrastructure):** GitHub org/user `JavaGT` in deploy docs/workflows — required for public Pages deploys and already public. Do not put personal student IDs there.

## Commands

```bash
cp .env.example .env   # fill REDACT_IDENTIFIERS
npm run privacy:redact # rewrite source/docs text
npm run privacy:audit  # fail if leaks remain

# Manual email path (no IMAP)
npm run archive:ingest -- --dir=./inbox

npm run archive:vtt
npm run archive:pdf -- --source=uoa-council file.pdf
npm run archive:tag
npm run archive:rss
npm run archive:scoop
npm run archive:oia
npm run archive:page-watch
npm run build:archive  # includes Pagefind + RSS
```

## Automation inventory

| Item | Status |
|------|--------|
| Env-based redaction | Done |
| Privacy audit CI | Done |
| EML drop ingest + auto-classify | Done |
| Attachment stable names | Done |
| Council VTT → md | Done |
| PDF drop → md + attachments | Done (needs `pdftotext`) |
| Pagefind search | Done (archive build) |
| RSS feeds | Done |
| Tag taxonomy | Done |
| Scoop incremental fetch | Done (keyword-filtered) |
| OIA/FYI watch stubs | Done |
| Public page change watch | Done |
| IMAP | **Won't implement** (disabled) |
| Delta deploy | force-orphan kept for clean gh-pages; source stays in monorepo — real rsync/R2 deferred |

## CI secrets to set

| Secret | Purpose |
|--------|---------|
| `REDACT_IDENTIFIERS` | Same list as local `.env` |
| `REDACT_REPLACEMENT` | optional, default `[REDACTED]` |
| `ARCHIVE_DEPLOY_TOKEN` | deploy blog + archive repos |
