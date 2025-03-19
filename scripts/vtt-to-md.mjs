// const fs = require('fs');
// const path = require('path');
// const { simpleParser } = require('mailparser');
// const sanitize = require('sanitize-filename');
import fs from 'fs';
import path from 'path';
import sanitize from 'sanitize-filename';
// file hashing
import crypto from 'crypto';


// Folder to store the markdown files
const markdownFolderPath = './source/archive/uoa-council/md';

// Ensure the output directory exists
if (!fs.existsSync(markdownFolderPath)) {
    fs.mkdirSync(markdownFolderPath, { recursive: true });
}

function createMD5(buffer) {
    return crypto.createHash('md5').
        update(buffer).
        digest('hex');
}

// Function to process VTT files
async function processVTTFile(vttFilePath) {
    const filename = path.basename(vttFilePath).replace('.vtt', '');
    // split \n\n
    const vttContent = fs.readFileSync(vttFilePath, 'utf-8');
    const vttLines = vttContent.split('\n\n');
    // filter out empty lines and the WebVTT header
    const vttLinesFiltered = vttLines.filter(line => line.trim().length > 0 && !line.startsWith('WEBVTT'));

    // Process each line

    // Initialize the markdown content
    let markdownContent = `---\nslug: uoa-council-meeting\ndate: ${filename}\nsource: youtube\n---\n# Transcript\nNote: transcription and dioarization are automated and may contain errors.\n\n`;
    for (let i = 0; i < vttLinesFiltered.length; i++) {
        const line = vttLinesFiltered[i];
        const lineParts = line.split('\n');
        const timestamp = lineParts[0];
        let improvedTimestamp = timestamp.split(' --> ').map((time) => {
            const [hours, minutes, seconds] = time.split('.')[0].split(':').map(padTime);
            return `${hours && hours != '00' ? hours + ':' : ''}${minutes}:${seconds}`;
        })[0]
        const text = lineParts.slice(1).join('\n').replace(/^(.+):/g, "*$1:*")
        // Add the line to the markdown content
        markdownContent += `_${improvedTimestamp}_\n${text}\n\n`;
    }

    // Create the markdown file
    const vttFileName = path.basename(vttFilePath);
    const mdFileName = sanitize(vttFileName.replace('.vtt', '.md'));
    const mdFilePath = path.join(markdownFolderPath, mdFileName);
    fs.writeFileSync(mdFilePath, markdownContent);
    console.log(`File written: ${mdFilePath}`);

}

// Process all VTT files in the directory
const vttFiles = fs.readdirSync('./source/archive/uoa-council/vtt');

vttFiles.forEach(vttFile => {
    processVTTFile(path.join('./source/archive/uoa-council/vtt', vttFile));
})


function padTime(time) {
    if (time.length === 1) {
        return `0${time}`;
    } else {
        return time;
    }
}