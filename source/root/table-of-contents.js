let currentScript = document.currentScript;
// wait for page to load
document.addEventListener('DOMContentLoaded', function () {
    // generate a table of contents
    var toc = document.createElement('div');
    toc.innerHTML = '<h2>Table of Contents</h2>';
    var ul = document.createElement(currentScript.getAttribute('list') || 'ul');
    ul.style.columnCount = currentScript.getAttribute('columns') || 3;
    var include = currentScript.getAttribute('include') || 'h1, h2, h3, h4, h5, h6';
    var exclude = currentScript.getAttribute('exclude');
    var headings = [...document.querySelectorAll(include)]
        .filter(heading => !exclude || !heading.matches(exclude));
    for (var i = 0; i < headings.length; i++) {
        var heading = headings[i];
        heading.id = 'heading-' + i;
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + heading.id;
        a.textContent = heading.textContent;
        li.appendChild(a);
        ul.appendChild(li);
    }
    toc.appendChild(ul);
    // place after this script element
    currentScript.insertAdjacentElement('afterend', toc);
});