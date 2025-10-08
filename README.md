# WEARETHEUNIVERSITY

A black and white themed static site for wearetheuniversity.org, built with Eleventy (11ty).

## Features
- Blog (Markdown)
- Arcade (HTML games)
- Archive (Markdown, .eml, mirrored HTML)
- Root-level Markdown pages
- Black and white minimal theme
- Output to `./docs` for GitHub Pages

## Local Development

```sh
npm install
npx eleventy --serve
```

## Build for GitHub Pages

```sh
npx eleventy
```

The site will be output to the `docs/` directory.

## Directory Structure

- `source/arcade/` — HTML games (copied as-is)
- `source/blog/` — Blog posts in Markdown
- `source/archive/` — Archive content (.md, .eml, mirrored HTML)
- `source/*.md` — Root-level pages

## Deployment

Configure GitHub Pages to serve from the `/docs` folder.

---

© 2025 WEARETHEUNIVERSITY
