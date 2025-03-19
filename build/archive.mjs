import fsp from 'fs/promises';
import parse from 'front-matter';
import { marked } from 'marked';
import pug from 'pug';
import path from 'path';

const archive_post_template = pug.compileFile('./source/templates/archive-post.pug')
const archive_markdown_files = await fsp.glob('./source/archive/**/*.md')

const archive_posts_metadata = []

const all_words = new Map()
const post_indexes = new Map()

const authors = new Set()

console.log(`Creating pages for archive posts...`)
for await (const file of archive_markdown_files) {
    try {
        const markdown = await fsp.readFile(file, 'utf-8')
        const { attributes, body } = parse(markdown)

        // if is doesn't have a source, list the url
        if (!attributes.source && attributes['source-url']) {
            attributes.source = attributes['source-url']
        } else if (!attributes.source) {
            // console.log(`No source for ${file}`)
        }

        authors.add(attributes['author-slug'])

        const html = marked(body)
        const content = archive_post_template({ attributes, content: html, title: attributes.title })
        archive_posts_metadata.push(attributes)

        // new path is /year/month/day/slug/index.html
        const new_url = path.join(
            attributes.date.toISOString().split('T')[0].replaceAll('-', '/'),
            attributes.slug
        )
        const new_filepath = path.join('./docs/archive', new_url, 'index.html')
        // console.log(`Processing ${file} -> ${new_filepath}`)

        const post_index = new Set()
        // add words to post_index

        // add words to all_words
        const words = content.split(/\s+/)
        for (const word of words) {
            if (word.length > 2) {
                if (!all_words.has(word)) all_words.set(word, all_words.size)
                post_index.add(all_words.get(word))
            }
        }

        post_indexes.set(new_url, post_index)

        await fsp.mkdir(path.dirname(new_filepath), { recursive: true })
        await fsp.writeFile(new_filepath, content)
    } catch (error) {
        console.error(`Error processing ${file}: ${error.message}`)
        continue
    }
}

// Author pages
let archive_authors = Array.from(authors)
await fsp.mkdir('./docs/authors/', { recursive: true })
for (const author of archive_authors) {
    const author_posts = archive_posts_metadata.filter(post => post['author-slug'] === author)

    let author_content = ''
    // check for author info in ./source/authors/slug.md
    const author_info_file = `./source/authors/${author}.md`
    let author_info = await fsp.readFile(author_info_file, 'utf-8').catch(() => {
        console.log(`Author data page does not exist: ${author_info_file}`)
        return ''
    })
    let { attributes, body } = parse(author_info)
    let author_info_content = marked(body)
    author_content = pug.renderFile('./source/templates/author.pug', { attributes, posts: author_posts, author_info_content })

    await fsp.mkdir(`./docs/authors/${author}`, { recursive: true })
    await fsp.writeFile(`./docs/authors/${author}/index.html`, author_content)
}
// make an index of authors
// const authors_index_template = pug.compileFile('./source/templates/author-list.pug')
// const authors_index_content = authors_index_template({ authors: archive_authors })
// await fsp.writeFile('./docs/authors/index.html', authors_index_content)




// render the archive post index.html
await fsp.mkdir('./docs/archive', { recursive: true })
// await fsp.writeFile('./docs/archive/index.html', `<ul>${archive_posts_metadata.map(post => `<li><a href="/archive/${post.date.toISOString().split('T')[0].replaceAll('-', '/')}/${post.slug}">${post.title}</a></li>`).join('')}</ul>`)
const archive_index_template = pug.compileFile('./source/templates/archive-list.pug')
const archive_index_content = archive_index_template({ posts: archive_posts_metadata })
await fsp.writeFile('./docs/archive/index.html', archive_index_content)



await fsp.writeFile('./docs/search_index_archive.json', JSON.stringify({
    key: Object.fromEntries(all_words.entries()),
    indexes: Object.fromEntries(post_indexes.entries().map(([k, v]) => [k, Array.from(v)]))
}))


