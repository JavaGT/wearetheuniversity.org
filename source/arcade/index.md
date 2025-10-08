---
layout: layout.njk
title: Arcade
---

# Arcade

Browse and play our HTML games:

{% for game in collections.arcade %}
  <article>
    <h2><a href="{{ game.url }}">{{ game.fileSlug | title }}</a></h2>
  </article>
{% else %}
  <p>No games available yet.</p>
{% endfor %}
