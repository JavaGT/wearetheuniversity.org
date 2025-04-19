---
slug: 'tools'
title: 'Tools'
---

# Open Athens Bookmarklet (University of Auckland)
Drag this link to your bookmarks bar [UoA 🔑](javascript:(()=>{location=`https://go.openathens.net/redirector/auckland.ac.nz?url=${encodeURI(location.href)}`})()) and click that bookmark to access texts via the University of Auckland library. This will redirect you to the University of Auckland's Open Athens login page, where you can log in with your student or staff credentials to access the text.

###### How it works
It redirects you to a utility provided by the University of Auckland library that allows you to access texts through their Open Athens authentication system. 

# Annas Archive Bookmarklet
Drag this link to your bookmarks bar [Annas 🔑](javascript:(()=>{location=`https://annas-archive.org/scidb/${`${location.href}\n${document.body.innerText}`.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi)[0]}`})()) and click that bookmark to access texts via Anna's Archive Sci-Hub backup. This will redirect you to Anna's Archive, where you can access the text.

###### How it works
It looks for a DOI in the current page's URL or content and redirects you to Anna's Archive copy of that doi if they have it. Because it looks at the whole page, it may find DOIs for other texts on the page.