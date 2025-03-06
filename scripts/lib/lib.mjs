import { exec } from 'child_process'
import fsp from 'fs/promises'
import zlib from 'zlib'
export async function execp(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            } else {
                resolve(stdout)
            }
        })
    })
}

export async function readFileList(filename, delimiter = '\n', dedupe = true) {
    return fsp.readFile(filename, 'utf-8')
        .then(content =>
            content.split(delimiter)
                .filter(id => id.trim() !== ''))
        .then(ids => dedupe ? [...new Set(ids)] : ids)
}

export async function downloadYoutubeVideoMetadata(video_id, subtitles_directory, db) {
    const transcript_path = `${subtitles_directory}/${video_id}.transcript.txt`
    const metadata_path = `${subtitles_directory}/${video_id}.metadata.json`
    const output_pattern = `${subtitles_directory}/%(id)s.%(ext)s`
    return execp(`yt-dlp --skip-download --write-info-json --write-sub --write-auto-sub --sub-lang en --sub-format vtt --sub-format srt --sub-format best --sub-lang en --sub-lang enUS --id https://www.youtube.com/watch?v=${video_id} --output '${output_pattern}'`)
        .then(() => fsp.readFile(`${subtitles_directory}/${video_id}.info.json`, 'utf-8'))
        .then(json => JSON.parse(json))
        .then(tidyYoutubeMetadata)
        .then(video_info => fsp.writeFile(metadata_path, JSON.stringify(video_info)))
        .then(async () => {
            const subtitle_filepath = await findSubtitleFile(subtitles_directory, video_id).catch(() => null)
            if (!subtitle_filepath) { console.log('No english subtitles found for', video_id); return }
            let subtitles = await fsp.readFile(subtitle_filepath, 'utf-8')
            let video_info = JSON.parse(await fsp.readFile(metadata_path, 'utf-8'))

            // &nbsp;
            subtitles = subtitles.replace(/&nbsp;/gmi, ' ')
            // appluase, music, song, laughter
            subtitles = subtitles.replace(/\[Applause\]/gmi, '')
            subtitles = subtitles.replace(/\[Music\]/gmi, '')
            subtitles = subtitles.replace(/\[Song\]/gmi, '')
            subtitles = subtitles.replace(/\[Laughter\]/gmi, '')


            subtitles = subtitles.split('\n').filter((line, index, lines) => {
                return (line.trim() !== '' && !/<c>/gm.test(line))
                    // && !/\[Music\]/gmi.test(line) && !/\[Applause\]/gmi.test(line) && !/\[Song\]/gmi.test(line)
                    && !/WEBVTT/gm.test(line) && !/Kind: captions/gm.test(line) && !/Language: en/gm.test(line)
                    && !/ --> /gm.test(line) && line !== lines[index - 1] && line !== lines[index - 2] && line !== lines[index - 3] && line !== lines[index - 4] && line !== lines[index - 5]
            }).join('\n')

            // await fsp.writeFile(transcript_path, subtitles)
            await fsp.unlink(`${subtitles_directory}/${video_id}.info.json`).catch(() => null)

            // compress the files and add them to the database (brotli)
            const compressed_transcript = zlib.brotliCompressSync(Buffer.from(subtitles))
            const compressed_metadata = zlib.brotliCompressSync(Buffer.from(JSON.stringify(video_info)))

            const statement = db.prepare('INSERT OR REPLACE INTO files (path, content) VALUES (?, ?)')
            await statement.run(`${video_id}.transcript.txt`, compressed_transcript)
            await statement.run(`${video_id}.metadata.json`, compressed_metadata)

            console.log('Downloaded and compressed', video_id)
        })
}

function tidyYoutubeMetadata(data) {
    delete data.formats
    delete data.thumbnails
    delete data.automatic_captions
    delete data._format_sort_fields
    delete data.subtitles
    delete data.format
    delete data.format_id
    delete data.ext
    delete data.protocol
    delete data.format_note
    delete data.filesize_approx
    delete data.tbr
    delete data.width
    delete data.height
    delete data.resolution
    delete data.fps
    delete data.dynamic_range
    delete data.vcodec
    delete data.vbr
    delete data.aspect_ratio
    delete data.acodec
    delete data.abr
    delete data.asr
    delete data.audio_channels
    delete data._type
    delete data._version
    return data
}

export async function fileExists(path) {
    return fsp.stat(path).then(() => path).catch(() => false)
}

export function findSubtitleFile(path, video_id) {
    return Promise.any([
        fileExists(`${path}/${video_id}.en.vtt`),
        fileExists(`${path}/${video_id}.enUS.vtt`),
        fileExists(`${path}/${video_id}.en.srt`),
        fileExists(`${path}/${video_id}.srt`)
    ])
}