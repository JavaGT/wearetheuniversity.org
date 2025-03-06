import fsp from 'fs/promises'
export async function getArchiveLinksForDomain(domain) {
    // https://web.archive.org/web/timemap/json?url=www.auckland.ac.nz/&fl=timestamp:4,original,urlkey&matchType=prefix&filter=statuscode:200&filter=mimetype:text/html&collapse=urlkey&collapse=timestamp:4&limit=100000
    const url = `https://web.archive.org/web/timemap/json?url=${domain}/&fl=timestamp:4,original,urlkey&matchType=prefix&filter=statuscode:200&filter=mimetype:text/html&collapse=urlkey&collapse=timestamp:4&limit=100000`
    const response = await fetch(url)
    const json = await response.json()
    // is a 2d array with [timestamp, original, urlkey]

    return json.slice(1) // 0th row are the keys
        .reduce((acc, [timestamp, url]) => {
            if (!acc[url]) acc[url] = []
            acc[url].push(timestamp)
            return acc
        }, {})
}
// ['www.auckland.ac.nz', 'www.teu.ac.nz']
// [
//     'https://www.wgtn.ac.nz/',
//     'https://www.aut.ac.nz/',
//     'https://www.canterbury.ac.nz/',
//     'https://www.waikato.ac.nz/',
//     'https://www.massey.ac.nz/',
//     'https://www.lincoln.ac.nz/',
//     'https://www.otago.ac.nz/',
// ]
// ['http://www.aus.ac.nz']
// [
//     'https://universitywithoutconditions.ac.nz/',
//     'http://www.criticandconscience.org.nz/',
//     'http://www.95bfm.co.nz',
//     'www.demandabetterfuture.org.nz',
//     'http://www.students.org.nz/',
//     'www.universitywithoutconditions.ac.nz',
//     'www.fu.ac.nz',
// ]
// ['https://www.ousa.org.nz/',
// 'https://www.nzusa.org.nz/',
// 'https://www.lusa.org.nz/',
// 'https://www.ausa.org.nz/',
// 'https://www.vuwsa.org.nz/',
// 'https://ucsa.org.nz/',
// 'https://www.tetiraahupae.ac.nz/',
//     'https://www.autsa.org.nz/'] 
// ['https://www.theram.org.nz/',
//     'https://www.craccum.co.nz/',
//     'https://www.critic.co.nz/'
// ]
['https://sfr.org.nz/']
    .reduce(async (acc, domain) => {
        await acc

        // if domain ends in /, remove it
        if (domain[domain.length - 1] === '/') domain = domain.slice(0, -1)
        // if domain starts with http, remove it
        if (domain.startsWith('http://')) domain = domain.slice(7)
        // if domain starts with https, remove it
        if (domain.startsWith('https://')) domain = domain.slice(8)

        console.log('Getting archive links for', domain)
        const archive_links = await getArchiveLinksForDomain(domain)
        await fsp.mkdir('./source/archive-domain-maps', { recursive: true }).catch(() => null)
        await fsp.writeFile(`./source/archive-domain-maps/${domain}.json`, JSON.stringify(archive_links, null, 2))
    }, Promise.resolve())






// get all links on page matching https://auckland.campuslabs.com/engage/organization/* 
const links = [...document.querySelectorAll('a[href^="https://auckland.campuslabs.com/engage/organization/"]')].map(a => a.href)
// open a new tab and navigate to each link, grabbing all the links on that page
const tab = window.open()
const all_links = await links.reduce(async (acc, link) => {
    const all_links = await acc
    tab.location = link
    await new Promise(resolve => setTimeout(resolve, 1000))
    await new Promise(resolve => tab.onload = resolve)
    await new Promise(resolve => setTimeout(resolve, 1000))
    const new_links = [...tab.document.querySelectorAll('a')].map(a => a.href)
    all_links.push(...new_links)
    return all_links
}, Promise.resolve([]))

console.log(all_links)
