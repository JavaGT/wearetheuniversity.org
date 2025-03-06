import { parse } from 'node-html-parser'
import TurndownService from 'turndown'
import fsp from 'fs/promises'
const turndownService = new TurndownService()
const html2md = html => turndownService.turndown(html)

async function getSoopArticles(author_code, page = 1) {
    const url = `https://info.scoop.co.nz/${author_code}/${page}`
    const request = await fetch(url)
    if (request.redirected) return []

    const response = await request.text()
    const root = parse(response)
    const articles = [...root.querySelectorAll('.article-sections')].map(article => {
        return {
            release: article.querySelector('.release').text.split(',')[1].trim(),
            title: article.querySelector('h3').text.trim(),
            link: article.querySelector('a').getAttribute('href').trim()
        }
    })
    return articles
}

async function markdownScoopArticle(url) {
    // fetch article
    const request = await fetch(url)
    const response = await request.text()
    const root = parse(response)
    // get article content
    const article = root.querySelector('#article')
    // convert to markdown
    const md = html2md(article?.innerHTML || '')
    // save to file

    return md
}

// get all pages until no more articles
async function getAllScoopArticles(author_code, start_page = 1) {
    let page = start_page
    let articles = []
    while (true) {
        console.log(`fetching page ${page}`)
        const new_articles = await getSoopArticles(author_code, page)
        if (new_articles.length === 0) break
        articles = articles.concat(new_articles)
        page++
    }
    return articles
}

// run for Tertiary Education Union, saving articles to 
// ./source/archive/scoop/tertiary-education-union/year-month-day_title.md


// downloadAllPostsByAuthor('Tertiary_Education_Union')



// not done yet:
// https://info.scoop.co.nz/Unknown
// https://info.scoop.co.nz/EveningReport.nz


// todo: act new zealand 8,516 done already.
`ACT_New_Zealand`
// `National_Maori_Students'_Association
// Te_Mana_Akonga`


// `Young_New_Zealand_First
// New_Zealand_National_Party
// New_Zealand_Labour_Party
// New_Zealand_Young_Nationals
// Young_Labour
// Te_Pati_Maori
// New_Zealand_First_Party
// Free_Speech_Union
// New_Zealand_Initiative
// New_Zealand_Business_Roundtable
// Motu_Research_and_Education_Foundation
// New_Zealand_Institute_of_Economic_Research
// NZIER
// MOTU
// McGuinness_Institute
// Maxim_Institute
// University_Of_The_South_Pacific
// ACT_On_Campus
// New_Zealand_Council_of_Trade_Unions`

// `Waipapa_Taumata_Rau
// Academic_Quality_Agency_for_NZ_Universities
// Aotearoa_Student_Press_Association
// Associate_Professor_Peter_O%27Connor
// Association_of_Staff_in_Tertiary_Education
// Auckland_Student_Movement
// Auckland_University
// Auckland_University_Press
// AUSA
// AUT_Maori_Students'_Association
// AUT_Student_Association
// AUT_University
// Choose_Kids
// Dougal_McNeill
// Free_Fares_NZ
// Free_Speech_Coalition
// Independent_Media_Institute
// Lincoln_University
// Lincoln_University_Students_Association
// LUSA_-_Lincoln_University_Students
// March_For_Our_Lives
// Massey_University
// Massey_University_Students_Association
// Massey_University_Students'_Association_Federation
// Matthew_Thomas
// National_Union_of_Student_Associations
// New_Zealand_International_Students'_Association
// New_Zealand_Law_Students_Association
// New_Zealand_Medical_Students'_Association_-_NZMSA
// New_Zealand_University_Student's_Association
// NZ_University_Games
// NZEI
// NZISA
// NZUSA_-_New_Zealand_Union_of_Students'_Associations
// NZVCC
// Otago_Students_for_Justice_in_Palestine
// Otago_University_Medical_Students'_Association
// Otago_University_Students_Association
// Otago_University_Students'_Association
// OUSA
// Palestine_Solidarity_Network_Aotearoa
// Peace_Action_Wellington
// Prebble's_Rebels
// Reclaim_UOA
// Ryan_Bridge
// Salient
// Student_Choice
// Student_Justice_for_Palestine_Poneke
// Student_Volunteer_Army
// Tania_Lim
// Tertiary_Institutes_Allied_Staff_Association
// The_Times_Higher_Education
// UNITEC_Student_Union
// Universities_New_Zealand_-_Te_Pokai_Tara
// University_of_Auckland_Business_School
// University_of_Canterbury
// University_of_Canterbury_Students_Association
// University_of_Otago
// University_of_Waikato
// USU._Student_Association_at_Unitec
// Vice_Chancellors'_Committee
// Victoria_University_Law_Student's_Society
// Victoria_University_of_Wellington
// Victoria_University_Press
// Victoria_University_Students_Association
// Victoria_University_Young_Nationals
// VUWSA
// Waikato_University
// We_are_the_University
// Workers_Party_of_New_Zealand
// You_Are_UC`
.split('\n').reduce((p, c) => p.then(() => downloadAllPostsByAuthor(c)), Promise.resolve())

async function downloadAllPostsByAuthor(author_code) {
    console.log(`downloading articles for ${author_code}`)
    const articles = await getAllScoopArticles(author_code)
    const new_author_code = author_code.replace(/[\s\-\_\'\"]+/g, '-').toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '')
    console.log(`found ${articles.length} articles for ${author_code}`)
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    await fsp.mkdir('./source/archive/scoop/' + new_author_code, { recursive: true })
    for (const article of articles) {
        console.log(`saving article ${article.title} from ${article.link}`)
        let [day, month, year] = article.release.split(' ')
        month = (months.indexOf(month) + 1).toString().padStart(2, '0')
        day = day.padStart(2, '0')
        const title = article.title.toLowerCase().replace(/[\,\‘\’\'\"\?\”\“\™]/g, '').replace(/[\s\\\/\[\]\:\.\'\"]+/g, '-').replace(/[^a-zA-Z0-9à-üÀ-Ü]]/g, '-').replace(/[-–]+/g, '-').replace(/^-|-$/g, '')
        const md = (await markdownScoopArticle(article.link)).replace(/^@media.*$/gm, '').replace(/^googletag.*$/gm, '')
        await fsp.writeFile(`./source/archive/scoop/${new_author_code}/${year}-${month}-${day}_${title}.md`,
            `---
title: "${article.title}"
date: ${year}-${month}-${day}
source-url: ${article.link}
author: ${new_author_code}
---
${md}`)
    }
}
