---
layout: layout.njk
title: Archive by source
permalink: /archive/sources/index.html
---

# Archive by source

<p><a href="/">← Archive home</a></p>

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
