---
layout: layout.njk
title: Archive by year
permalink: /archive/years/index.html
---

# Archive by year

<p><a href="/">← Archive home</a></p>

<ul class="year-list">
{%- for y in collections.archiveYears -%}
  <li><a href="/archive/years/{{ y.year }}/">{{ y.year }}</a> — {{ y.count }} items</li>
{%- endfor -%}
</ul>
