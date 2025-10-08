---
layout: layout.njk
title: Blog
excerpt: "Blog {% for post in collections.blog %} {% if not post.data.draft %} <article <h2<a href=\"{{ post.url }}\"{{ post.data.title }}</a</h2 <p<small{{ post.date date\"yyyyMMdd\" }}</small</p <p{{ post.data.excerpt or \"No excerpt available\" }}</p </article {% endif %} {% endfor %} {% set drafts = collections.blog selectattr'data.draft', 'equalto', true list %} {% if drafts..."
permalink: /blog/index.html
---

# Blog

<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Title</th>
      <th>Excerpt</th>
    </tr>
  </thead>
  <tbody>
  {%- for post in collections.blog | reverse -%}
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

{% set drafts = collections.blog | selectattr('data.draft', 'equalto', true) | list %}
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
