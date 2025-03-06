import fsp from 'fs/promises';
import TurndownService from 'turndown';
var turndownService = new TurndownService()
// ../wearetheuniversity.org/source/blog/**/*.md
// read date & slug from yaml frontmatter
// make a copy for the file at./ source / blog / ${ date }–${ slug }.md

// var markdown = turndownService.turndown('<h1>Hello world!</h1>')

const files = await fsp.glob('../wearetheuniversity.org/source/blog/**/*.md');

const every_frontmatter_key = new Set();

for await (const file of files) {
    console.log(file);
    console.log(file);
    console.log(file);
    let content = await fsp.readFile(file, 'utf8');
    content = content.replaceAll('author_url', 'author-url');
    content = content.replaceAll('source_name', 'source-name');
    content = content.replace(/^path: .*\n/gm, '');
    // remove # source
    content = content.replace(/# source:/gm, '');
    content = content.replace(/# date:/gm, '');
    let [_, frontmatter, ...body] = content.split('---\n');
    body = body.join('---\n');
    const slug = frontmatter.match(/^slug: (.*)/gm)[0].slice(6);
    const date = frontmatter.match(/^date: (.*)/gm)[0].slice(6);

    const all_frontmatter_keys = frontmatter.match(/^([^\n:]*):/gm).map(key => key.slice(0, -1))
    all_frontmatter_keys.forEach(key => every_frontmatter_key.add(key));

    if (all_frontmatter_keys.includes('mirrored')) {
        console.log('mirrored');
        break;
    }

    // if is html, convert to markdown
    if (body.match(/<.*>/gm)?.length > 6) {
        body = turndownService.turndown(body);
    }
    await fsp.writeFile(`./source/blog/${date}_${slug}.md`, `---\n${frontmatter}---\n${body}`);
    // await fsp.writeFile(`./source/blog/${date}_${slug}.md`, `---\n${frontmatter}---\n${turndownService.turndown(body)}`);
}

console.log([...every_frontmatter_key]);

