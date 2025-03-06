import fsp from 'fs/promises';
import parse from 'front-matter';
import { marked } from 'marked';
import pug from 'pug';
import path from 'path';

const video_post_template = pug.compileFile('./source/templates/video.pug')
// const blog_markdown_files = await fsp.glob('./source/blog/**/*.md')
const video_metadata_files = await fsp.glob('./source/archive/videos/**/*.metadata.json')

// const blog_posts_metadata = []
const video_posts_metadata = []

const all_words = new Map()
const post_indexes = new Map()

console.log(`Creating pages for videos...`)
// for await (const file of blog_markdown_files) {

const all_videos = []

for await (const file of video_metadata_files) {
    try {
        const metadata = await fsp.readFile(file, 'utf-8').then(JSON.parse)
        let transcript = await fsp.readFile(file.replace('.metadata.json', '.transcript.txt'), 'utf-8').catch(() => '')
        // if transcript.length < 100, it's probably an error so set it to an empty string

        const slug = metadata.title.toLowerCase().replace(/[\s—:]+/g, '-').replace(/[^a-z0-9à-ž-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
        const year = metadata.upload_date.slice(0, 4)
        const month = metadata.upload_date.slice(4, 6)
        const day = metadata.upload_date.slice(6, 8)

        //render video page
        // console.log({ metadata, info, transcript })
        const content = video_post_template({ metadata, transcript })
        video_posts_metadata.push(metadata)

        // filepath is /videos/${metadata.id}/index.html
        const url_path = path.join('videos', year, month, day, slug)
        const new_filepath = path.join('./docs', url_path)
        const new_filename = path.join(new_filepath, 'index.html')

        await fsp.mkdir(new_filepath, { recursive: true })
        await fsp.writeFile(new_filename, content)

        all_videos.push({ href: url_path, title: metadata.title, date: metadata.upload_date })

    } catch (error) {
        console.error(`Error processing ${file}: ${error.message}`)
    }
}

// render the video index.html
await fsp.mkdir('./docs/videos', { recursive: true })
// await fsp.writeFile('./docs/videos/index.html', `<ul>${all_videos
//     .sort((a, b) => b.date - a.date)
//     .map(video => `<li><a href="/${video.href}">${video.date}: ${video.title}</a></li>`).join('')}</ul>`)

const video_list_template = pug.compileFile('./source/templates/video-list.pug')
await fsp.writeFile('./docs/videos/index.html', video_list_template({ videos: all_videos }))


//     try {
//         const markdown = await fsp.readFile(file, 'utf-8')
//         const { attributes, body } = parse(markdown)
//         const html = marked(body)
//         const content = blog_post_template({ attributes, content: html, title: attributes.title })
//         blog_posts_metadata.push(attributes)

//         // new path is /year/month/day/slug/index.html
//         const new_url = path.join(
//             attributes.date.toISOString().split('T')[0].replaceAll('-', '/'),
//             attributes.slug
//         )
//         const new_filepath = path.join('./docs', new_url, 'index.html')

//         const post_index = new Set()
//         // add words to post_index

//         // add words to all_words
//         const words = content.split(/\s+/)
//         for (const word of words) {
//             if (word.length > 2) {
//                 if (!all_words.has(word)) all_words.set(word, all_words.size)
//                 post_index.add(all_words.get(word))
//             }
//         }

//         post_indexes.set(new_url, post_index)

//         await fsp.mkdir(path.dirname(new_filepath), { recursive: true })
//         await fsp.writeFile(new_filepath, content)
//     } catch (error) {
//         console.error(`Error processing ${file}: ${error.message}`)
//         break;
//     }
// }

// // render the blog post index.html
// await fsp.mkdir('./docs/blog', { recursive: true })
// await fsp.writeFile('./docs/blog/index.html', `<ul>${blog_posts_metadata.map(post => `<li><a href="/${post.date.toISOString().split('T')[0].replaceAll('-', '/')}/${post.slug}">${post.title}</a></li>`).join('')}</ul>`)


// // write index.json as an object with keys as paths and values as arrays of word indexes
// await fsp.writeFile('./docs/search_index_blog.json', JSON.stringify({
//     key: Object.fromEntries(all_words.entries()),
//     indexes: Object.fromEntries(post_indexes.entries().map(([k, v]) => [k, Array.from(v)]))
// }))


