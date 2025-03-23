let currentScript = document.currentScript;
// wait for page to load
document.addEventListener('DOMContentLoaded', function () {
    // generate a table of contents
    var tocElementWrapper = document.createElement('div');
    tocElementWrapper.id = 'table-of-contents';
    tocElementWrapper.innerHTML = '<h2>Table of Contents</h2>'; var include = currentScript.getAttribute('include') || 'h1, h2, h3, h4, h5, h6';
    var exclude = currentScript.getAttribute('exclude') || '.banner *';
    var listOfAllHeadings = [...document.querySelectorAll(include)]
        .filter(heading => !exclude || !heading.matches(exclude));

    // create a list element
    var listKind = currentScript.getAttribute('list') || 'ul';
    var rootListElement = document.createElement(listKind);
    rootListElement.style.columnCount = currentScript.getAttribute('columns') || 3;
    tocElementWrapper.appendChild(rootListElement);

    var currentDepth = 1;
    var currentListElement = rootListElement;

    listOfAllHeadings.forEach((heading, i) => {
        var level = parseInt(heading.tagName.slice(1));
        while (level > currentDepth) {
            // var newLi = document.createElement('li');
            var newList = document.createElement(listKind);
            (currentListElement.lastChild ? currentListElement.lastChild : currentListElement).appendChild(newList);
            // newLi.appendChild(newList);
            currentListElement = newList;
            currentDepth++;
        }
        while (level < currentDepth) {
            currentListElement = currentListElement.parentElement.parentElement;
            currentDepth--;
        }

        heading.id = heading.id || 'heading-' + i;

        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + heading.id;
        a.textContent = heading.textContent;
        li.appendChild(a);
        currentListElement.appendChild(li);
    });

    // var ul = document.createElement(currentScript.getAttribute('list') || 'ul');
    // ul.style.columnCount = currentScript.getAttribute('columns') || 3;
    // var tocLevels = {};
    // headings.forEach(heading => {
    //     var level = heading.tagName.toLowerCase();
    //     if (!tocLevels[level]) {
    //         tocLevels[level] = [];
    //     }
    //     tocLevels[level].push(heading);
    // });
    // Object.keys(tocLevels).forEach(level => {
    //     var li = document.createElement('li');
    //     var heading = tocLevels[level][0];
    //     heading.id = 'heading-' + level;
    //     var a = document.createElement('a');
    //     a.href = '#' + heading.id;
    //     a.textContent = heading.textContent;
    //     li.appendChild(a);
    //     var sublist = document.createElement('ul');
    //     tocLevels[level].slice(1).forEach(subheading => {
    //         var subli = document.createElement('li');
    //         var suba = document.createElement('a');
    //         suba.href = '#' + subheading.id;
    //         suba.textContent = subheading.textContent;
    //         subli.appendChild(suba);
    //         sublist.appendChild(subli);
    //     });
    //     li.appendChild(sublist);
    //     ul.appendChild(li);
    // });

    tocElementWrapper.appendChild(rootListElement);

    // place after this script element
    currentScript.insertAdjacentElement('afterend', tocElementWrapper);
});