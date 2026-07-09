# WEARETHEUNIVERSITY

We Are The University is a minimal, black-and-white static site built with Eleventy (11ty). The project publishes writing, archives, and small web-based games while centring a clear political mission: "We the students and staff are the beating heart of this institution." The site rejects the neoliberal university and asserts that education, research and service should be driven by the people who do the work.

## Three hosts

| Host | Role | Build |
|------|------|--------|
| [wearetheuniversity.org](https://wearetheuniversity.org/) | Organising hub (about, contact, tools, arcade) | `npm run build:www` → `docs/` |
| [blog.wearetheuniversity.org](https://blog.wearetheuniversity.org/) | Campaign writing | `npm run build:blog` → `dist/blog/` |
| [archive.wearetheuniversity.org](https://archive.wearetheuniversity.org/) | Research archive | `npm run build:archive` → `dist/archive/` |

Source for all three lives in this monorepo. Blog and archive deploy to separate GitHub repos (one Pages site per repo).

Old `/blog/*` and `/archive/*` paths on the apex domain redirect via `404.html` to the matching host.

## Commands

```bash
npm run build:www       # apex hub
npm run build:blog      # campaign blog
npm run build:archive   # research archive (large)
npm run build:all       # all three
npm run serve:www
npm run serve:blog
npm run serve:archive

# Archive automation
npm run archive:ingest -- --source=uoa-vc-updates path/to.eml
npm run archive:validate
npm run process:eml -- --scope=archive   # EML → markdown only
```

Shared stylesheet source of truth: `shared/style.css` (copied into every host build as `/style.css`).

Archive automation opportunities: `designs/archive-automation.md`.

## Directory overview

- `source/` — authoring source
  - `source/blog/` — posts (blog host)
  - `source/archive/` — research archive (archive host)
  - `source/arcade/` — games (www host)
  - `source/pages/` — hub pages (www host)
- `build/` — EML → markdown helpers
- `docs/` — generated **www** output (Pages: `main` / `docs`)
- `dist/blog/`, `dist/archive/` — generated subdomain sites (CI deploy; not committed)
- `eleventy.www.js` / `eleventy.blog.js` / `eleventy.archive.js`
- `designs/` — design notes
