import fsp from 'fs/promises'
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


// read all files in ./source/archive/youtube/ and compress them with brotli and store them in the database. do 100 at a time
const statement = db.prepare('INSERT OR REPLACE INTO files (path, content) VALUES (?, ?)')


let fnfn = ''
let i = 0;
let files = await fsp.glob('./source/archive/youtube/*')
for await (const file of files) {
    let filename = file.split('/').pop()
    let content = await fsp.readFile(file)

    // if the file is already in the database and the content is the same, skip
    let row = db.prepare('SELECT * FROM files WHERE path = ?').get(filename)
    if (row && zlib.brotliDecompressSync(row.content).toString() === content.toString()) {
        console.log('Skipping & deleting', filename)
        await fsp.unlink(file)
        continue
    }


    let compressed_content = zlib.brotliCompressSync(content, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } })
    await statement.run(filename, compressed_content)


    if (i++ % 100 === 0) {
        console.log('Processed', i)
    }

    await fsp.unlink(file).catch(console.error)
}
