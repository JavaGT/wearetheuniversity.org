import fsp from 'fs/promises'
const whitelist_terms = `university
academic
Massey
Victoria
Otago
Canterbury
Lincoln
Waikato
College
AUSA
OUSA
VUWSA
LUSA
NZUSA
universities
tertiary
student
higher education
tertiary education`.split('\n').map(s => s.trim().toLowerCase()).filter(s => s.length > 0)

const glob = await fsp.glob('./source/archive/scoop/**/*.md')
let c = 0
for await (const path of glob) {
    // for await (const path of ['./source/archive/scoop/act-new-zealand/2018-05-17_copy.md']) {
    const md = (await fsp.readFile(path, 'utf-8')).toLowerCase()
    const contains = whitelist_terms.some(term => md.includes(term) || path.includes(term))
    // log the matching word
    if (contains) {
        console.log(`✅ ${path}`)
        console.log(whitelist_terms.find(term => md.includes(term) || path.includes(term)))
    } else {
        console.log(`❌ ${path}`)
    }
    console.log(contains ? `✅ ${path}` : `❌ ${path}`)
    if (!contains) await fsp.unlink(path)
    // break
}

