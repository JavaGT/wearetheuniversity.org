---
layout: layout.njk
title: Archive
permalink: /index.html
slug: archive-home
---

# Research archive

This host holds documents and mirrored material for research and accountability — press releases, institutional emails, council records, and a large Scoop.co.nz mirror. It is **not** the organising site.

**Writing, actions, and contact live on** [wearetheuniversity.org](https://wearetheuniversity.org/).

## Search

<link href="/pagefind/pagefind-ui.css" rel="stylesheet">
<script src="/pagefind/pagefind-ui.js"></script>
<div id="search"></div>
<script>
  window.addEventListener('DOMContentLoaded', function () {
    if (window.PagefindUI) {
      new PagefindUI({ element: '#search', showSubResults: true });
    }
  });
</script>
<p><small>Full-text search (Pagefind). Also: <a href="/feed.xml">RSS feed</a>.</small></p>

## Browse

| Browse by | |
|-----------|--|
| [Year](/archive/years/) | Indexes by publication year |
| [Source](/archive/sources/) | Scoop, UoA news, VC updates, TEU, Council, etc. |

## Sources at a glance

<table>
  <thead>
    <tr>
      <th>Source</th>
      <th>Items</th>
    </tr>
  </thead>
  <tbody>
  {%- for src in collections.archiveSources -%}
    <tr>
      <td><a href="/archive/sources/{{ src.source }}/">{{ src.label }}</a></td>
      <td>{{ src.count }}</td>
    </tr>
  {%- endfor -%}
  </tbody>
</table>

## Years

<ul class="year-list">
{%- for y in collections.archiveYears -%}
  <li><a href="/archive/years/{{ y.year }}/">{{ y.year }}</a> <small>({{ y.count }})</small></li>
{%- endfor -%}
</ul>
