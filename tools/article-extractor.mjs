// RNZ
setTimeout(()=>{navigator.clipboard.writeText(`---
title: "${document.querySelector('.c-story-header__headline').innerText}"
date: ${document.querySelector('.c-dateblock').innerText.slice(12)}
path: ${document.querySelector('.c-dateblock').innerText.slice(12).split(' ').reverse().join('/')}/${document.querySelector('.c-story-header__headline').innerText.toLowerCase().replace(/[^a-zA-Z1-9\-\s]/g, '').replace(/\s/g, '-')}
source: ${window.location.href}
source_name: RNZ
author: Unknown
---
${document.querySelector('.article__body').innerHTML.trim()}`)}, 1000)



// Scoop
setTimeout(()=>{navigator.clipboard.writeText(`---
title: "${document.querySelector('.story-top h1').innerText}"
date: ${document.querySelector('.byline b').innerText.split(',')[1]}
path: ${document.querySelector('.byline b').innerText.split(',')[1].split(' ').reverse().join('/')}${document.querySelector('.story-top h1').innerText.toLowerCase().replace(/[^a-zA-Z1-9\-\s]/g, '').replace(/\s/g, '-')}
source: ${window.location.href}
source_name: Scoop
author: ${document.querySelector('.byline b a').innerText}
---
${document.querySelector('#article').innerHTML.trim()}`)}, 1000)