# Archive automation — opportunities

The research archive is large (~34k items) and multi-source. Below is a prioritised map of what is **implemented**, what is **next**, and longer-term ideas.

## Implemented (this pass)

| Automation | How |
|------------|-----|
| **EML → markdown** | `build/archive-and-blog.mjs` (existing) |
| **Scoped pipeline** | `--scope=blog\|archive\|all` and `--skip-md-track` so www/blog builds do not walk 34k files |
| **Drop-folder ingest** | `npm run archive:ingest -- --source=uoa-vc-updates file.eml` |
| **Front-matter validate** | `npm run archive:validate` (dup permalinks, missing fields) |
| **Scheduled rebuild** | `.github/workflows/archive-scheduled.yml` (weekly + manual) |
| **Three-host deploy CI** | `.github/workflows/gh-pages.yml` |

## High-value next (recommended order)

### 1. Mailbox / IMAP pull for official UoA streams
**Problem:** VC updates, staff notices, TEU mail arrive as manual `.eml` drops.  
**Idea:** Nightly GitHub Action (or local cron) with IMAP credentials in secrets → fetch unseen messages from label folders → write into `source/archive/uoa-vc-updates/` etc. → open PR or commit + rebuild.  
**Risk:** credentials, privacy — keep personalIdentifiers redaction on.  
**Impact:** High for “institutional memory” freshness.

### 2. Auto-classify EML by From/List-Id
**Problem:** Ingest requires `--source=…`.  
**Idea:** Map `List-Id` / From domains to folders (`all-staff@` → staff, `vice-chancellor` → vc-updates, TEU patterns → teu).  
**Impact:** Medium — fewer misfiles.

### 3. Scoop incremental fetch (optional)
**Problem:** Scoop dump is static bulk; no ongoing sync.  
**Idea:** Script keyed by Scoop story ID + last-seen date; only pull new tertiary/UoA-tagged stories.  
**Impact:** Low–medium for mission; high volume/noise. Prefer filters (keywords: University of Auckland, TEU, Marsden).  
**Risk:** ToS / load; store only metadata + source-url if fulltext is optional.

### 4. OIA / FYI.org.nz watchlist
**Problem:** Public accountability docs appear off-site.  
**Idea:** RSS/API poll for keywords; create draft archive stubs with source URL for human review.  
**Impact:** High for organising value, low volume.

### 5. Council / Senate document pipeline
**Problem:** PDFs and VTT live in ad-hoc folders.  
**Idea:** Drop PDFs into `source/archive/uoa-council/incoming/`; script extracts text (pdftotext), builds md + attaches PDF under `attachments/`.  
**Impact:** High for few high-value docs.

### 6. Attachment hosting reliability
**Problem:** EML pipeline writes `/attachments/…` but some filenames are `undefined`.  
**Idea:** Always name attachments `{date}-{slug}-{n}.{ext}`; fail build if attachment missing.  
**Impact:** Medium quality.

### 7. Pagefind (or similar) static search on archive host
**Problem:** Year/source browse still hard for 34k docs.  
**Idea:** Post-build `npx pagefind --site dist/archive` and ship search UI.  
**Impact:** High UX; pure automation after build.

### 8. Dedup + permalink collision fixer
**Problem:** Validate reports dups; fix is manual.  
**Idea:** Extend `validate.mjs` with `--fix` to append `-2` to slugs.  
**Impact:** Medium hygiene.

### 9. Content-addressed deploy (don’t force-orphan whole tree)
**Problem:** 300MB archive push every deploy is slow.  
**Idea:** rsync/delta deploy to object storage or keep gh-pages history with sparse updates; or Cloudflare R2 + Pages.  
**Impact:** CI time/cost.

### 10. Leak-safe redaction CI
**Problem:** Personal identifiers depend on local `settings.json` (gitignored).  
**Idea:** CI secret list of patterns; fail if email/phone patterns slip into published archive.  
**Impact:** High safety.

## Medium / later

| Idea | Notes |
|------|--------|
| **Transcript pipeline** | VTT → cleaned md chapters for council meetings |
| **Tag taxonomy** | course-cuts, mergers, TEU, governance — auto from keywords |
| **Change detection** | Diff UoA public pages (strategy, rankings claims) weekly |
| **RSS out** | Generate feed of last 50 archive items by source |
| **Mirror checksums** | `source-url` + hash for integrity of scraped Scoop items |
| **Split Scoop cold storage** | Keep Scoop off hot deploy path; load on demand |

## Suggested owner workflows

**Weekly (human):** Drop new VC/TEU emails → `npm run archive:ingest -- --source=…` → commit → push (CI deploys).  
**Weekly (bot):** Scheduled rebuild catches anything already committed.  
**Monthly:** Run `archive:validate`, fix dups, review attachment failures.  
**Quarterly:** Decide Scoop grow/freeze; consider Pagefind.

## Secrets required for full automation

| Secret | Used for |
|--------|----------|
| `ARCHIVE_DEPLOY_TOKEN` | Push to `blog.*` and `archive.*` repos from Actions |
| (future) `IMAP_*` | Mailbox pull |
| (future) `REDACTION_PATTERNS` | CI redaction gate |
