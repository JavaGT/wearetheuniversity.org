Decision: Split into wearetheuniversity.org (organising site) and archive.wearetheuniversity.org (research archive). Reason: A single Eleventy site mixed campaign content with ~34k Scoop pages, producing an unusable 8MB archive index and burying the mission; GitHub Pages allows one site per repo so the archive needs its own repo and subdomain.
Decision: Keep archive item permalinks under /archive/... on the archive host. Reason: Existing links only need a host swap; main-site 404 can redirect /archive/* to the subdomain without rewriting paths.
Decision: Deploy archive as a separate public GitHub repo (force-orphan gh-pages). Reason: Built HTML must not bloat the monorepo; source markdown stays in wearetheuniversity.org.
Decision: Split blog to blog.wearetheuniversity.org (third host). Reason: Same Pages-one-site-per-repo constraint and clearer product boundary — apex hub vs campaign writing vs research dump; post permalinks stay under /blog/... for host-only redirects.
Decision: Single shared stylesheet at shared/style.css for all three hosts. Reason: One design system avoids drift; each build passthrough-copies locally so hosts stay offline-safe without cross-origin CSS dependency.
Decision: Scope EML pipeline with --scope and --skip-md-track. Reason: Walking ~34k archive markdown files on every www/blog build was pure overhead after the host split.

