# Design: Three-host split (www + blog + archive)

## Reframe

**Asked:** Improve the site; separate research dump; then also split the blog.

**Needed:** Clear product boundaries among organising hub, campaign writing, and research archive.

| Host | Role |
|------|------|
| `wearetheuniversity.org` | Hub: manifesto, about, contact, leak, tools, arcade |
| `blog.wearetheuniversity.org` | Campaign writing: posts, open letters, notes |
| `archive.wearetheuniversity.org` | Research archive: Scoop, UoA news, VC updates, TEU, council, direct |

## Premises

- Primary job of the apex domain is organising, not hosting 34k news scrapes or the full post archive.
- Blog and research archive are both content-heavy but serve different readers — separate hosts.
- Path compatibility: keep `/blog/...` and `/archive/...` so apex 404 redirects are host-only (blog index maps `/blog` → `/`).
- One GitHub Pages site per repo → monorepo source, three deploy targets.

## Approach

Chosen: monorepo triple Eleventy configs + external public repos for blog and archive Pages.

| Piece | Location |
|-------|----------|
| Source of truth | `JavaGT/wearetheuniversity.org` (`source/`) |
| www build | `eleventy.www.js` → `docs/` |
| blog build | `eleventy.blog.js` → `dist/blog/` |
| archive build | `eleventy.archive.js` → `dist/archive/` |
| blog deploy | `JavaGT/blog.wearetheuniversity.org` (gh-pages) |
| archive deploy | `JavaGT/archive.wearetheuniversity.org` (gh-pages) |
| DNS | Porkbun `blog` / `archive` CNAME → `JavaGT.github.io` |

## Core capabilities

1. **www ignores blog + archive source** — small apex hub.
2. **blog builds only `source/blog/**`** — index at `/`, posts keep `/blog/yyyy/...`.
3. **archive builds only archive content** — year + source indexes.
4. **www portals** at `/blog/` and `/archive/` + 404 redirects for deep links.
5. **Cross-links** across all three hosts in layout chrome.

## Out of scope (for now)

- Full-text search (Pagefind later)
- Migrating historical Git history of `docs/blog/` / `docs/archive/`
- Deleting Scoop source from the monorepo

## Risks

| Risk | Mitigation |
|------|------------|
| Deep links break until 404 redirect ships | Ship redirects with www deploy |
| Archive CI OOM/time on 34k pages | Year indexes; monitor CI |
| `GITHUB_TOKEN` cannot push external repos | PAT secret `ARCHIVE_DEPLOY_TOKEN` (covers blog + archive) |
| Cert stuck on new subdomain | Porkbun CNAME first, then Pages clear/re-add dance |
