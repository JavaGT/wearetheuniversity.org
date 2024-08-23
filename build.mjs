import fsp from 'fs/promises';
import parse from 'front-matter';
// use npm module marked
import { marked } from 'marked';
import pug from 'pug';
import { url } from 'inspector';
// or const { marked } = require('marked');

const html = marked.parse('# Marked in Node.js\n\nRendered by **marked**.');

await clean()
await build()

async function clean() {
    await fsp.rmdir('./public', { recursive: true })
}

async function copyRootFiles() {
    const files = await fsp.glob('./source/root/**.*')
    for await (const file of files) {
        await fsp.mkdir('./public/' + file.replace(/^.*\//, '').split('/').slice(0, -1).join('/'), { recursive: true })
        await fsp.copyFile(file, `./public/${file.replace(/^.*\//, '')}`)
    }
}

async function buildIndex({ blog_data }) {
    const template = pug.compileFile('./source/template/index.pug')
    const html = template({ blog_data })
    await fsp.mkdir('./public', { recursive: true })
    await fsp.writeFile('./public/index.html', html)
}

async function build() {
    await copyRootFiles()
    const blog_data = await buildBlog()
    await buildIndex({ blog_data })
}

async function buildBlog() {
    let blog_data = []
    const files = await fsp.glob('./source/blog/**/*.md')
    for await (const file of files) {
        console.log(`Building ${file}`)
        const content = await fsp.readFile(file, 'utf8')
        const { attributes, body } = parse(content)
        const html = marked(body)
        const output = pug.renderFile('./source/template/blog.pug', { attributes, body: html })
        let datestring = attributes.date.toISOString().replace(/\..+/, '').slice(0, 10).replace(/-/g, '/')
        await fsp.mkdir(`./public/${datestring}/${attributes.slug}`, { recursive: true })
        await fsp.writeFile(`./public/${datestring}/${attributes.slug}/index.html`, output)
        blog_data.push({ title: attributes.title, date: datestring, slug: attributes.slug, link: `/${datestring}/${attributes.slug}` })
    }
    return blog_data
}
