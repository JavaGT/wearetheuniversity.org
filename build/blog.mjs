import fsp from 'fs/promises';
import parse from 'front-matter';
import { marked } from 'marked';
import pug from 'pug';
import path from 'path';

const blog_post_template = pug.compileFile('./source/templates/blog-post.pug')
const blog_markdown_files = await fsp.glob('./source/blog/**/*.md')

const blog_posts_metadata = []

const all_words = new Map()
const post_indexes = new Map()

const authors = new Set()

console.log(`Creating pages for blog posts...`)
for await (const file of blog_markdown_files) {
    try {
        const markdown = await fsp.readFile(file, 'utf-8')
        const { attributes, body } = parse(markdown)

        // if is doesn't have a source, list the url
        if (!attributes.source) {
            console.error(`No source found for ${file}`)
            continue
        }

        authors.add(attributes['author-slug'])

        const html = marked(body)
        const content = blog_post_template({ attributes, content: html, title: attributes.title })
        blog_posts_metadata.push(attributes)

        // new path is /year/month/day/slug/index.html
        const new_url = path.join(
            attributes.date.toISOString().split('T')[0].replaceAll('-', '/'),
            attributes.slug
        )
        const new_filepath = path.join('./docs/blog', new_url, 'index.html')

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
        break;
    }
}

// Author pages
let blog_authors = Array.from(authors)
await fsp.mkdir('./docs/authors/', { recursive: true })
for (const author of blog_authors) {
    const author_posts = blog_posts_metadata.filter(post => post['author-slug'] === author)

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
// await fsp.writeFile('./docs/authors/index.html', `<ul>${blog_authors.map(author => `<li><a href="/authors/${author}">${author}</a></li>`).join('')}</ul>`)
const authors_index_template = pug.compileFile('./source/templates/author-list.pug')
const authors_index_content = authors_index_template({ authors: blog_authors })
await fsp.writeFile('./docs/authors/index.html', authors_index_content)



// render the blog post index.html
await fsp.mkdir('./docs/blog', { recursive: true })
// await fsp.writeFile('./docs/blog/index.html', `<ul>${blog_posts_metadata.map(post => `<li><a href="/blog/${post.date.toISOString().split('T')[0].replaceAll('-', '/')}/${post.slug}">${post.title}</a></li>`).join('')}</ul>`)
const blog_index_template = pug.compileFile('./source/templates/blog-list.pug')
const blog_index_content = blog_index_template({ posts: blog_posts_metadata })
await fsp.writeFile('./docs/blog/index.html', blog_index_content)



// write index.json as an object with keys as paths and values as arrays of word indexes
await fsp.writeFile('./docs/search_index_blog.json', JSON.stringify({
    key: Object.fromEntries(all_words.entries()),
    indexes: Object.fromEntries(post_indexes.entries().map(([k, v]) => [k, Array.from(v)]))
}))


