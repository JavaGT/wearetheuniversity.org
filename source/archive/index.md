---
layout: layout.njk
title: Archive
permalink: /archive/index.html
slug: archive
---

# Archive

<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Title</th>
      <th>Excerpt</th>
    </tr>
  </thead>
  <tbody>
  {%- for post in collections.archive | reverse -%}
    {%- if not post.data.draft -%}
      <tr>
        <td><small>{{ post.date | date("yyyy-MM-dd") }}</small></td>
        <td><a href="{{ post.url }}">{{ post.data.title }}</a></td>
        <td>{{ post.data.excerpt or "(No excerpt available)" }}</td>
      </tr>
    {%- endif -%}
  {%- endfor -%}
  </tbody>
</table>

{% set drafts = collections.archive | selectattr('data.draft', 'equalto', true) | list %}
{% if drafts %}
  <h3>Drafts</h3>
  <table>
    <thead>
      <tr><th>Date</th><th>Title</th><th>Excerpt</th></tr>
    </thead>
    <tbody>
    {%- for post in drafts -%}
      <tr>
        <td><small>{{ post.date | date("yyyy-MM-dd") }}</small></td>
        <td><a href="{{ post.url }}">{{ post.data.title }}</a></td>
        <td>{{ post.data.excerpt or "(No excerpt available)" }}</td>
      </tr>
    {%- endfor -%}
    </tbody>
  </table>
{% endif %}
