import fsp from 'fs/promises'
import TurndownService from 'turndown'
import { execp } from '../scripts/lib/lib.mjs'
import { diffLines } from 'diff'
const turndownService = new TurndownService()



// remove all scripts and styles
const remove_scripts = html => html.replace(/<script.*?>.*?<\/script>/gs, '')
const remove_styles = html => html.replace(/<style.*?>.*?<\/style>/gs, '')
// remove images
const remove_images = html => html.replace(/<img.*?>/gs, '')
// remove empty a tags
const remove_empty_a_tags = html => html.replace(/<a.*?><\/a>/gs, '')
const remove_comments = html => html.replace(/<!--.*?-->/gs, '')
const remove_whitespace = html => html.replace(/\s+/gs, ' ')
// const remove_all = html => remove_empty_a_tags(remove_images(remove_comments(remove_scripts(remove_styles(html)))))
const remove_all = html => html;



let url = 'auckland.ac.nz/en/on-campus/facilities-and-services/sport-and-recreation/new-recreation-and-wellbeing-centre.html'
const delim = ` `;
const archive_url = `http://web.archive.org/cdx/search/cdx?url=${url}`


const req = await fetch(archive_url)
const text = await req.text()
const lines = text.split('\n').map(x => {
    const [urlkey, timestamp, original, mimetype, statuscode, digest, length] = x.split(delim)
    return { urlkey, timestamp, original, mimetype, statuscode, digest, length }
})
    .filter(x => x.statuscode === '200')
    .filter(x => x.mimetype === 'text/html')
    // .filter(x => matching_url_regex.test(x.original))
    .filter(x => x.original.includes(url))
    .sort((a, b) => a.timestamp - b.timestamp)

// makr data directory
await fsp.mkdir('./auto-archive-diff/data').catch(() => null)

// save all copies of the page
const results = await lines.reduce(async (prev, line, i) => {
    const accum = await prev
    const filename = `${line.original.replace(/[\/\:\\]/g, '-')}–${line.timestamp}`
    // if it already exists, skip
    if (await fsp.access(`./auto-archive-diff/data/${filename}.html`).then(() => true).catch(() => false)) {
        console.log('Exists, skipping', filename)
        return accum
    }
    const req = await fetch(`http://web.archive.org/web/${line.timestamp}/${line.original}`)
    let html = remove_all(await req.text())
    let markdown = turndownService.turndown(html)
    await fsp.writeFile(`./auto-archive-diff/data/${filename}.html`, html)
    await fsp.writeFile(`./auto-archive-diff/data/${filename}.md`, markdown)
    return [...accum, { html, markdown, timestamp: line.timestamp, url: line.original }]
}, Promise.resolve([]))


// create a diff highlighting the differences between first and last
const first = results[0]
const last = results[results.length - 1]
const difference = diffLines(first.html, last.html)
await fsp.mkdir('./auto-archive-diff/diff').catch(() => null)
await fsp.writeFile(`./auto-archive-diff/diff/${url.replace(/[\/\:\\]/g, '-')}.diff.html`, difference.map(x => {
    // if blank lines ignore
    if (x.value.trim() === '') return ''
    if (x.added) return `<ins>${x.value}</ins>\n`
    if (x.removed) return `<del>${x.value}</del>\n`
    return x.value
}).join(''))



// // save markdown
// await Promise.all(results.map(async (result, i) => {
//     await fsp.writeFile(`./ auto - archive - diff / ${ result.url }–${ result.timestamp }.md`, result.markdown)
// }))
