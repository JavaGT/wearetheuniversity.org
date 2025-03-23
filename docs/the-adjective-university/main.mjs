// load data.json
const data = await fetch('./data.json').then(res => res.json());
console.log(data);
// create an element for each term
const root = document.body;

const linkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width=18 viewBox="0 0 640 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path fill="currentcolor" d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"/></svg>`;

for (const term of data.terms) {
    console.log('rendering term', term.term);

    const page = document.createElement('div');
    page.classList.add('page');

    page.style.backgroundColor = term.background_color;
    page.style.color = term.text_color;

    const h1 = document.createElement('h1');
    h1.textContent = term.term;
    page.appendChild(h1);

    const ul = document.createElement('ul');
    for (const text_id of term.texts) {
        console.log('rendering text', term.term, text_id);
        const li = document.createElement('li');
        const text = data.texts.find(t => t.id === text_id);
        li.innerHTML = `
           <a href="${text.link}">${linkIcon}</a><em>${text.title}</em> (${text.year}) by ${text.authors.join(', ')} in <em>${text.journal}</em> ${text.volume}(${text.issue}): ${text.pages}
        `;
        ul.appendChild(li);
    }
    page.appendChild(ul);

    root.appendChild(page);
}