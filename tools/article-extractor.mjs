// RNZ
setTimeout(() => {
    navigator.clipboard.writeText(`---
title: "${document.querySelector('.c-story-header__headline').innerText}"
date: ${document.querySelector('.c-dateblock').innerText.slice(12)}
path: ${document.querySelector('.c-dateblock').innerText.slice(12).split(' ').reverse().join('/')}/${document.querySelector('.c-story-header__headline').innerText.toLowerCase().replace(/[^a-zA-Z1-9\-\s]/g, '').replace(/\s/g, '-')}
source: ${window.location.href}
source_name: RNZ
author: Unknown
---
${document.querySelector('.article__body').innerHTML.trim()}`)
}, 1000)javascript: (() => {
    let months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    let newMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    let authorname = document.querySelector('.byline b a')?.innerText || prompt('Author name?');
    let title = document.querySelector('.story-top h1, .entrytitle')?.innerText || prompt('Title?');
    let date = document.querySelector('.byline b, .entrymeta1')?.innerText || '';
    let month, day, year;
    let v1datepattern = /(\w+) (\d{1,2}), (\d{4})/;
    if (v1datepattern.test(date)) [, month, day, year] = date.match(v1datepattern);
    let v2datepattern = /(\w+), (\d{1,2}) (\w+) (\d{4}), (\d{1,2}:\d{2} [ap]m)/;
    if (v2datepattern.test(date)) [, , day, month, year] = date.match(v2datepattern);
    let v3datepattern = /(\d{1,2}) (\w+) (\d{4})/;
    if (v3datepattern.test(date)) [, day, month, year] = date.match(v3datepattern);
    let v4datepattern = /(\d{1,2})\/(\d{2})\/(\d{4})/;
    if (v4datepattern.test(date)) [, day, month, year] = date.match(v4datepattern);
    let v5datepattern = /(\d{4})-(\d{2})-(\d{2})/;
    if (v5datepattern.test(date)) [, year, month, day] = date.match(v5datepattern);
    month = month.toLowerCase();
    month = newMonths[months.indexOf(month) % 12] || newMonths[months.indexOf(month.toLowerCase()) % 12] || prompt('Date month in two digits?');
    let slug = title.toLowerCase().replace(/[^a-zA-Z1-9\-\s]/g, '').replace(/\s/g, '-').replace(/-+/, '-');
    const string = `---
\ntitle: "${title}"\nslug: ${slug}\ndate: ${year}-${month}-${day.padStart(2, '0')}\npath: ${year}/${month}/${day}/${slug}.md\nsource: ${window.location.href}\nsource-name: Scoop\nauthor: ${authorname}\nauthor-slug: ${authorname.toLowerCase().replace(/[^a-zA-Z1-9\-\s]/g, '').replace(/\s/g, '-')}\n---
\n${document.querySelector('#article, .entrybody').innerHTML.trim()}`;
    fetch('http://localhost:8090/article', {
        method: 'POST',
        body: string
    }).then(res => res.text()).then(console.log)
})();//)
// }, 1000)