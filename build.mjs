import fsp from 'fs/promises';
import parse from 'front-matter';
import { marked } from 'marked';
import pug from 'pug';
import path from 'path';
// const postcss = require('postcss')
// const cssnano = require('cssnano')
// const htmlmin = require('html-minifier')
import postcss from 'postcss';
import cssnano from 'cssnano';
import htmlmin from 'html-minifier';
// npm install --save-dev postcss cssnano html-minifier

await clean()
await build()

async function clean() {
  await fsp.rmdir('./docs', { recursive: true }).catch(() => { })
  await fsp.mkdir('./docs', { recursive: true })
}

async function copyRootFiles() {
  const files = await fsp.glob('./source/root/**/**')
  for await (const file of files) {
    // filter out directories
    if ((await fsp.stat(file)).isDirectory()) continue
    console.log(`Copying ${file}, ./${file.replace('source/root/', 'docs/')}`)

    // if css minify using postcss
    if (file.endsWith('.css')) {
      const css = await fsp.readFile(file, 'utf8')
      const result = await postcss([cssnano]).process(css, { from: file })
      await fsp.mkdir('./docs/' + file.replace('source/root/', '').split('/').slice(0, -1).join('/'), { recursive: true })
      await fsp.writeFile(`./docs/${file.replace('source/root/', '')}`, result.css)
      continue
    }

    // if html minify using html-minifier
    if (file.endsWith('.html')) {
      const html = await fsp.readFile(file, 'utf8')
      const result = htmlmin.minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true
      })
      await fsp.mkdir('./docs/' + file.replace('source/root/', '').split('/').slice(0, -1).join('/'), { recursive: true })
      await fsp.writeFile(`./docs/${file.replace('source/root/', '')}`, result)
      continue
    }

    await fsp.mkdir('./docs/' + file.replace('source/root/', '').split('/').slice(0, -1).join('/'), { recursive: true })
    // await fsp.copyFile(file, `./docs/${file.replace(/^.*\//, '')}`)
    await fsp.copyFile(file, `./${file.replace('source/root/', 'docs/')}`)
  }
}

async function buildIndex({ blog_data }) {
  const template = pug.compileFile('./source/template/index.pug')
  let output = template({ blog_data })

  // minify the html using html-minifier
  output = htmlmin.minify(output, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true
  })

  await fsp.mkdir('./docs', { recursive: true })
  await fsp.writeFile('./docs/index.html', output)
}

async function build() {
  await copyRootFiles()
  const blog_data = await buildBlog()
  await buildIndex({ blog_data })
  await buildRss({ blog_data })
  await buildPages()
  await buildTranscripts()
  await buildEncyclopedia()
}

function cleanEncyclopediaFilename(filename) {
  return filename.replace(/ /g, '_').replace(/[^a-zA-Z0-9_\-]/g, '')
}

async function buildEncyclopedia() {

  let list_of_all_entries = []

  // get all the files in the wiki folder
  const files = await fsp.glob('./source/encyclopedia/**/*.md')
  // for each file, render it to html, processing the links with a function
  for await (const file of files) {
    const filename = path.basename(file, '.md')
    const cleanFilename = cleanEncyclopediaFilename(filename)
    console.log(`Building ${file}`)

    let content = await fsp.readFile(file, 'utf8')
    // look for links in the content with [[link|optional title]] and replace them with <a href="/wiki/link">optional title</a>
    content = content.replace(/\[\[([^|\]]+)\|?([^\]]+)?\]\]/g, (match, link, title) => {
      const cleanLink = cleanEncyclopediaFilename(link)
      return `<a href="/encyclopedia/${cleanLink}">${title || link}</a>`
    })


    const html = marked(content)
    // let output = html
    let output = pug.renderFile('./source/template/blog.pug', { attributes: { title: filename, encyclopedia: true }, body: html })
    // minify the html using html-minifier
    output = htmlmin.minify(output, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true
    })

    await fsp.mkdir(`./docs/encyclopedia/${cleanFilename}`, { recursive: true })
    await fsp.writeFile(`./docs/encyclopedia/${cleanFilename}/index.html`, output)

    list_of_all_entries.push({ title: filename, link: `/encyclopedia/${cleanFilename}` })
  }

  // render the index page
  let output = pug.renderFile('./source/template/blog.pug', { attributes: { title: 'Encyclopedia', encyclopedia: true }, body: list_of_all_entries.map(entry => `<a href="${entry.link}">${entry.title}</a><br>`).join('') })
  // minify the html using html-minifier
  output = htmlmin.minify(output, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true
  })
  await fsp.mkdir(`./docs/encyclopedia`, { recursive: true })
  await fsp.writeFile(`./docs/encyclopedia/index.html`, output)
}

async function buildRss({ blog_data }) {
  console.log('Building RSS feed')
  const items = blog_data.sort((a, b) => new Date(b.date) - new Date(a.date));
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0">
        <channel>
          <title>We Are The University</title>
          <link>https://wearetheuniversity.org</link>
          <description>Reclaiming our universities</description>
          <language>en-us</language>
          <pubDate>${items[0].date}</pubDate>
          <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
          <docs>http://blogs.law.harvard.edu/tech/rss</docs>
          <generator>JavaScript ES6</generator>
          ${items.map(item => `
          <item>
            <title><![CDATA[${item.title}]]></title>
            <link>${item.link}</link>
            <description><![CDATA[${item.description || "No description provided"}]]></description>
            <pubDate>${item.date}</pubDate>
            <guid isPermaLink="true">${item.link}</guid>
          </item>`).join('')}
        </channel>
      </rss>`;
  await fsp.mkdir('./docs', { recursive: true })
  await fsp.writeFile('./docs/rss.xml', xml)
}

async function buildBlog() {
  let blog_data = []
  const files = await fsp.glob('./source/blog/**/*.md')
  for await (const file of files) {
    console.log(`Building ${file}`)
    const content = await fsp.readFile(file, 'utf8')
    const { attributes, body } = parse(content)
    // if attributes.hidden is true, skip this file
    if (attributes.hidden) continue
    if (attributes.completion && attributes.completion < 0.4) continue
    const html = marked(body)
    let output = pug.renderFile('./source/template/blog.pug', { attributes, body: html })
    // minify the html using html-minifier
    output = htmlmin.minify(output, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true
    })
    let datestring = attributes.date.toISOString().replace(/\..+/, '').slice(0, 10).replace(/-/g, '/')
    await fsp.mkdir(`./docs/${datestring}/${attributes.slug}`, { recursive: true })
    await fsp.writeFile(`./docs/${datestring}/${attributes.slug}/index.html`, output)
    blog_data.push({ title: attributes.title, date: datestring, slug: attributes.slug, link: `/${datestring}/${attributes.slug}`, author: attributes.author })
  }
  return blog_data.sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function buildPages() {
  const files = await fsp.glob('./source/pages/**/*.md')
  for await (const file of files) {
    console.log(`Building ${file}`)
    const content = await fsp.readFile(file, 'utf8')
    const { attributes, body } = parse(content)
    // if attributes.hidden is true, skip this file
    if (attributes.hidden) continue
    if (attributes.completion && attributes.completion < 0.4) continue
    const html = marked(body)
    let output = pug.renderFile('./source/template/page.pug', { attributes, body: html })
    // minify the html using html-minifier
    output = htmlmin.minify(output, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true
    })
    await fsp.mkdir(`./docs/${attributes.slug}`, { recursive: true })
    await fsp.writeFile(`./docs/${attributes.slug}/index.html`, output)
  }
}

async function buildTranscripts() {
  const folders = await fsp.glob('./source/transcripts/*')
  // for each folder open index.json
  for await (const folder of folders) {
    const index = JSON.parse(await fsp.readFile(`${folder}/index.json`, 'utf8'))
    // for each item in index.json
    for (const item of index.items) {
      // render the transcript.pug file
      // transcript is contained in a json file in the same folder named after the guid
      // console.log((await fsp.readFile(`${folder}/${item.guid}.json`, 'utf8')))
      console.log(`Building transcript for ${item.guid}`)
      let output = pug.renderFile('./source/template/transcript.pug', {
        attributes: {
          title: item.title,
          author: item.author,
          date: new Date(item.pubDate)
        },
        body: `<audio src="${item.enclosure.link}" controls></audio><br> ${item.content}<br><table border="1"><thead><tr><th>Timestamp</th><th>Caption</th></tr></thead><tbody>${JSON.parse((await fsp.readFile(`${folder}/${item.guid}.json`, 'utf8'))).map(x => `<tr><td class="timestamp" data-value="${x[1]}"><button>${Math.floor(x[0] / 1000)}s</button></td><td class="caption">${x[2]}</td></tr>`).join('')}</tbody></table><script>document.body.addEventListener('click', e => { if (e.target.classList.contains('timestamp') || e.target.parentElement.classList.contains('timestamp')) { const timestamp = e.target.closest('td').dataset.value || e.target.closest('td').parentElement.dataset.value; document.querySelector('audio').currentTime = timestamp / 1000; } })</script>`
        // 
      })
      // minify the html using html-minifier
      // output = htmlmin.minify(output, {
      //   collapseWhitespace: true,
      //   removeComments: true,
      //   minifyCSS: true,
      //   minifyJS: true
      // })
      // write the transcript to the docs folder
      await fsp.mkdir(`./docs/${folder.replace('source/', '')}`, { recursive: true })
      await fsp.writeFile(`./docs/${folder.replace('source/', '')}/${item.guid}.html`, output)
    }
    const output = pug.renderFile('./source/template/transcript.pug', {
      attributes: {
        title: index.feed.title,
        author: index.feed.author,
      },
      body: index.items.map(item => `<a href="${item.guid}.html">${item.title}</a><br>`).join('')
    })
    // write the index page to the docs folder
    await fsp.mkdir(`./docs/${folder.replace('source/', '')}`, { recursive: true })
    await fsp.writeFile(`./docs/${folder.replace('source/', '')}/index.html`, output)
  }
}

