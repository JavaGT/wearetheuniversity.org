import fsp from 'fs/promises'
import { execp, readFileList, downloadYoutubeVideoMetadata, fileExists, findSubtitleFile } from '../lib/lib.mjs'
import sqlite3 from 'better-sqlite3'
import zlib from 'zlib'

// create/open the database
const db_path = './source/archive/youtube.sqlite'
const db = sqlite3(db_path)

// create the table if it doesn't exist (holds brotli compressed files based on a path)
db.exec(`CREATE TABLE IF NOT EXISTS files (
    path TEXT PRIMARY KEY,
    content BLOB
)`)

const statement = db.prepare('INSERT OR REPLACE INTO files (path, content) VALUES (?, ?)')

const config = {
    video_ids_file: './scripts/youtube-to-archive/video_ids.txt',
}

// let video_ids = (await readFileList(config.video_ids_file)).filter(x => x[0] !== '#')
// read all .txt files in ../youtube-channel-videos/ and concatenate them
let video_ids = []
for await (const file of fsp.glob('./scripts/youtube-channel-videos/*.txt')) {
    video_ids = video_ids.concat(await readFileList(file))
}

console.log('Processing', video_ids.length, 'video ids')

video_ids.reduce(async (prev, video_id) => {
    await prev

    console.log('Processing', `https://www.youtube.com/watch?v=${video_id}`)

    const subtitles_directory = `./source/youtube/` // derived from the output pattern
    const transcript_path = `${subtitles_directory}/${video_id}.transcript.txt`
    const metadata_path = `${subtitles_directory}/${video_id}.metadata.json`

    // check if the files already exist, skip
    // if (await fileExists(transcript_path) && await fileExists(metadata_path)) {
    //     console.log('Exists, skipping', video_id)
    //     return
    // }

    // check if the files already exist in the database, skip
    let row = db.prepare('SELECT * FROM files WHERE path = ?').get(`${video_id}.metadata.json`)
    if (row) {
        console.log('Exists in database, skipping', video_id)
        return
    }

    await downloadYoutubeVideoMetadata(video_id, subtitles_directory, db).catch(console.error)
    // await download_youtube_video(`https://www.youtube.com/watch?v=${video_id}`).catch(console.error)
})
