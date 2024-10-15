// listen for posts to /article and save file

import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { join } from 'path'
import server from 'server'
import fsp from 'fs/promises'
const { get, post } = server.router;
const { render, status } = server.reply;



server({
    port: 8090, security: {
        csrf: false
    }
}, [
    post('/article', async ctx => {
        // body is string of markdown
        // filename is in pattern of
        // path: 1999/October/12/auckland-students-begin-occupation-of-university
        let body = ctx.data
        // path: 2024/05/1/peace-action-wellington-statement-on-student-occupations.md
        const regex = /path: (\d{4})\/([A-Za-z\d]+)\/(\d{1,2})\/([a-z0-9\-]+)\.?m?d?/g
        let [a, year, month, day, title] = regex.exec(body)
        day = day.padStart(2, '0')
        month = month.padStart(2, '0')
        const filePath = join('source', 'blog', year, month, day, `${title}.md`)
        // if file already exists, skip and log
        try {
            await readFile(filePath)
            return status(400, `File already exists (skipping): ${filePath}`)
        } catch (e) {
            // file does not exist, continue
        }
        // remove any line beginning with "date: "
        body = body.replace(/date: .*\n/, '')
        const content = body.replace(regex, `date: ${year}-${month}-${day}`)
        await fsp.mkdir(join('source', 'blog', year, month, day), { recursive: true })
        await fsp.writeFile(filePath, content)
        return status(200, `File saved: ${filePath}`)
    }),
    // options('/*', ctx => status(200))
])

// const server = createServer(async (req, res) => {
//     if (req.url === '/article') {
//         let body = ''
//         req.on('data', chunk => {
//             body += chunk.toString()
//         })
//         req.on('end', async () => {
//             // body is string of markdown
//             // filename is in pattern of 
//             // path: 1999/October/12/auckland-students-begin-occupation-of-university
//             console.log(body)
//             const regex = /path: (\d{4})\/([A-Za-z]+)\/(\d{1,2})\/([a-z0-9-]+)/
//             let [, year, month, day, title] = body.match(regex)
//             month = newMonths[months.indexOf(month)].padStart(2, '0')
//             day = day.padStart(2, '0')
//             const filePath = join('source', 'blog', year, month, day, `${title}.md`)
//             // if file already exists, skip and log
//             try {
//                 await readFile(filePath)
//                 res.writeHead(400)
//                 res.end(`File already exists (skipping): ${filePath}`)
//                 return
//             } catch (e) {
//                 // file does not exist, continue
//             }
//             const content = body.replace(regex, `date: ${year}-${month}-${day}`)
//             await fsp.mkdir(join('source', 'blog', year, month, day), { recursive: true })
//             await fsp.writeFile(filePath, content)
//             res.writeHead(200)
//             res.end(`File saved: ${filePath}`)
//         })
//     } else {
//         res.writeHead(404)
//         res.end('Not Found')
//     }
// })



// server.listen(8090, () => {
//     console.log('Server listening on port 8090')
// })