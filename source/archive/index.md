---
layout: layout.njk
title: Archive
permalink: /index.html
slug: archive-home
---

# WATU Research Archive

This host holds documents and mirrored material for research and accountability — press releases, institutional emails, council records, and a large Scoop.co.nz mirror. It is **not** the organising site.

**Campaign writing, actions, and contact live on** [wearetheuniversity.org](https://wearetheuniversity.org/).

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
