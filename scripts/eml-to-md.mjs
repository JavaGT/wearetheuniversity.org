// const fs = require('fs');
// const path = require('path');
// const { simpleParser } = require('mailparser');
// const sanitize = require('sanitize-filename');
import fs from 'fs';
import path from 'path';
import { simpleParser } from 'mailparser';
import sanitize from 'sanitize-filename';
// file hashing
import crypto from 'crypto';


// Folder to store the markdown files
const markdownFolderPath = './source/archive/teu-auckland-university-emails/md';

// Ensure the output directory exists
if (!fs.existsSync(markdownFolderPath)) {
    fs.mkdirSync(markdownFolderPath, { recursive: true });
}

function createMD5(buffer) {
    return crypto.createHash('md5').
        update(buffer).
        digest('hex');
}

// Function to process EML files
async function processEMLFile(emlFilePath) {
    try {
        // Read the EML file
        const emlContent = fs.readFileSync(emlFilePath);

        // Parse the EML content
        const parsed = await simpleParser(emlContent);

        // Extract subject and body
        const subject = parsed.subject || 'Untitled';
        let body = ''
        // add email headers
        body +=
            `---\n${['subject', 'date', 'from', 'to', 'cc', 'bcc', 'replyTo', 'inReplyTo', 'references', 'messageId', 'priority']
                .map(header => [header, (parsed[header]?.text || parsed[header] || '')])
                .filter(([header, value]) => value)
                .map(([header, value]) => {
                    if (header === 'date') {
                        return [header, value.toISOString().split('T')[0]]
                    }
                    return [header, value]
                })
                .map(([header, value]) => `${header}: ${('' + value).replace(/\n/g, ' ').replaceAll(`"`, '')}`)
                .join('\n')}\nslug: ${slugify(parsed.subject)}\ntitle: ${parsed['subject']}\n---\n`

        // extract any attachments, save with name as file hash and replace the src in the body
        const attachments = parsed.attachments.filter(attachment => !attachment.contentType.includes('image'));
        attachments.forEach(attachment => {
            const attachmentHash = createMD5(attachment.content);
            const attachmentExtension = attachment.contentType.split('/')[1];
            const attachmentFilename = `${attachmentHash}.${attachmentExtension}`;
            const attachmentPath = path.join(markdownFolderPath, attachmentFilename);
            fs.writeFileSync(attachmentPath, attachment.content, { encoding: 'base64' });
            // create list of attachments at start of the body
            body += `Attachment: [${attachment.filename}](${attachmentFilename})\n`;
            // body = body.replace(attachment.filename, attachmentFilename);
        })

        body += parsed.text || '';

        // extract any images, save with name as file hash and replace the src in the body
        const images = parsed.attachments.filter(attachment => attachment.contentType.includes('image'));
        images.forEach(image => {
            const imageHash = createMD5(image.content);
            const imageExtension = image.contentType.split('/')[1];
            const imageFilename = `${imageHash}.${imageExtension} `;
            const imagePath = path.join(markdownFolderPath, imageFilename);
            fs.writeFileSync(imagePath, image.content, { encoding: 'base64' });
            body = body.replace(image.filename, imageFilename);
        })


        // fix links to markdown format
        // plan to merger (see Law News article)<https://lawnews.nz/administrative-public/university-senate-rejects-plan-to-merge-law-and-business-faculties/?fbclid=IwY2xjawI3MJtleHRuA2FlbQIxMAABHW2DljK8CAa-E7FEDXbSBejF6zOLLD901-HIMfl2tW7lBN2H3TloEReFgg_aem_K0B494OpaskAatngpF302Q#msdynmkt_trackingcontext=e4f9a297-3b95-42e2-b1f8-8631688a9f71&msdynmkt_prefill=mktprf214a4158a8c043ad95f1e5809887dd18eoprf>.  Gi

        // Replace links in the body
        body = body.replace(/\(([^\)]+)\)<([^>]+)>/g, '[$1]($2)');

        // fix images in the body
        //? Let me know.
        //[cid:ba80fae0a094855120f99d012a918061.jpeg @01DB8F81.C99C79F0]
        body = body.replace(/\[cid:(.+) @.+\]/g, '![]($1)');


        // fix emails
        // e fund, email strikefund@teu.ac.nz<mailto:strikefund@teu.ac.nz> and
        body = body.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})<mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g, '[$1](mailto:$2)');

        // anything longer than three newlines can be reduced to three
        body = body.replace(/\n{4,}/g, '\n\n\n');


        // Sanitize the subject to use as a filename
        const filename = sanitize(subject) + '.md';
        const markdownFilePath = path.join(markdownFolderPath, filename);

        // Write to markdown file
        fs.writeFileSync(markdownFilePath, body, { encoding: 'utf-8' });

        console.log(`Processed: ${emlFilePath} -> ${markdownFilePath} `);
    } catch (error) {
        console.error(`Error processing ${emlFilePath}: `, error);
    }
}

// Function to process all EML files in a directory
async function processEMLFilesInDirectory(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath);

        for (const file of files) {
            if (path.extname(file).toLowerCase() === '.eml') {
                const emlFilePath = path.join(directoryPath, file);
                await processEMLFile(emlFilePath);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${directoryPath}: `, error);
    }
}

// Example usage
const stickyNotesFolderPath = './source/archive/teu-auckland-university-emails/eml';
processEMLFilesInDirectory(stickyNotesFolderPath);

function slugify(subject) {
    return subject.toLowerCase().replace(/ |–/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}