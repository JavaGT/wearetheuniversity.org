import fsp from 'fs/promises';
import path from 'path';
import { simpleParser } from 'mailparser';
import sanitize from 'sanitize-filename';
import crypto from 'crypto';
import winston from 'winston';
import { marked } from 'marked';
import pug from 'pug';
import parse from 'front-matter';
import { AUTHOR_DATA_FILE, EMAIL_ATTACHMENT_HOSTED_DIRECTORY, EMAIL_ATTACHMENT_OUTPUT_DIRECTORY } from '../config.mjs';

// Configure logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    transports: [new winston.transports.Console()],
});

// Precompile Pug templates
const archivePostTemplate = pug.compileFile('./source/templates/archive-post.pug');
const authorTemplate = pug.compileFile('./source/templates/author.pug');
const archiveIndexTemplate = pug.compileFile('./source/templates/archive-list.pug');

// Precompile regular expressions for better performance
const linkRegex = /\(([^\)]+)\)<([^>]+)>/g;
const imageRegex = /\[cid:(.+) @.+\]/g;
const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})<mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g;

// Helper function to create an MD5 hash
function createMD5(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
}

// Helper function to slugify a string
function slugify(subject) {
    return subject
        .toLowerCase()
        .replace(/ |–/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
}

// Helper function to save attachments or images
async function saveAttachment(attachment) {
    const hash = createMD5(attachment.content);
    const extension = attachment.contentType.split('/')[1];
    const filename = `${hash}.${extension}`;
    const filePath = path.join(EMAIL_ATTACHMENT_OUTPUT_DIRECTORY, filename);

    await fsp.mkdir(EMAIL_ATTACHMENT_OUTPUT_DIRECTORY, { recursive: true });
    await fsp.writeFile(filePath, attachment.content, { encoding: 'base64' });
    return { filename, filePath };
}

// Helper function to extract and format email headers
function formatHeaders(parsed) {
    const headers = ['subject', 'date', 'from', 'to', 'cc', 'bcc', 'replyTo', 'inReplyTo', 'references', 'messageId', 'priority'];

    return headers
        .map(header => {
            const value = parsed[header]?.text || parsed[header] || '';
            return [header, value];
        })
        .filter(([header, value]) => value) // Remove empty values
        .map(([header, value]) => {
            if (header === 'date') {
                return [header, value.toISOString().split('T')[0]]; // Format date as YYYY-MM-DD
            }
            return [header, value];
        })
        .map(([header, value]) => {
            // Clean up the value by removing newlines and double quotes
            const cleanedValue = ('' + value).replace(/\n/g, ' ').replaceAll(`"`, '');
            return `${header}: ${cleanedValue}`;
        })
        .join('\n'); // Join headers into a single string
}

// Helper function to extract the author's name and slug
function extractAuthor(from) {
    if (!from) return { author: '', authorSlug: '' };

    // Extract the name from the "from" field (e.g., "John Doe <john@example.com>" -> "John Doe")
    const nameMatch = from.text.match(/^(.*?)<.*?>$/) || from.text.match(/^(.*)$/);
    const author = nameMatch ? nameMatch[1].trim() : '';

    // Generate a slug for the author
    const authorSlug = slugify(author);

    return { author, authorSlug };
}

// Add email headers and frontmatter to the body
function addFrontmatter(parsed) {
    const headers = formatHeaders(parsed);
    const { author, authorSlug } = extractAuthor(parsed.from);

    return `---
${headers}
slug: ${slugify(parsed.subject)}
title: ${parsed.subject}
author: ${author}
author-slug: ${authorSlug}
---\n`;
}

// Function to process EML files
async function processEMLFile(emlFilePath) {
    try {
        // Read the EML file asynchronously
        const emlContent = await fsp.readFile(emlFilePath);
        const parsed = await simpleParser(emlContent);

        // Extract subject and body
        const subject = parsed.subject || 'Untitled';
        let body = addFrontmatter(parsed);

        // Process non-image attachments
        const attachments = parsed.attachments.filter(attachment => !attachment.contentType.includes('image'));
        for (const attachment of attachments) {
            const { filename, filePath } = await saveAttachment(attachment);
            body += `Attachment: [${attachment.filename}](/${EMAIL_ATTACHMENT_HOSTED_DIRECTORY}/${filename})\n`;
        }

        body += parsed.text || '';

        // Process image attachments
        const images = parsed.attachments.filter(attachment => attachment.contentType.includes('image'));
        for (const image of images) {
            const { filename } = await saveAttachment(image);
            body = body.replace(`[cid:${image.cid}]`, `![](/${EMAIL_ATTACHMENT_HOSTED_DIRECTORY}/${filename})`);
        }

        // Fix links, images, and emails in the body
        body = body
            .replace(linkRegex, '[$1]($2)')
            .replace(imageRegex, '![]($1)')
            .replace(emailRegex, '[$1](mailto:$2)')
            .replace(/\n{4,}/g, '\n\n\n'); // Normalize newlines

        return { markdown_body: body };
    } catch (error) {
        if (error.code === 'ENOENT') {
            logger.error(`File not found: ${emlFilePath}`);
        } else if (error instanceof SyntaxError) {
            logger.error(`Parsing error in file ${emlFilePath}:`, error);
        } else {
            logger.error(`Unexpected error processing ${emlFilePath}:`, error);
        }
        throw error; // Re-throw to handle in the calling function
    }
}

// Main function to process all files
async function main() {
    try {
        const authorData = await loadAuthorData();

        // mk archive directory
        await fsp.mkdir('./docs/archive', { recursive: true });
        await fsp.mkdir('./docs/blog', { recursive: true });
        const archiveFilesFiles = await fsp.glob('./source/{archive,blog}/**/*.{md,eml}');
        // const archiveEmailFiles = await fsp.glob('./source/archive/**/*.eml');

        const archivePostsMetadata = [];
        const authorSet = new Set();

        // Process email files
        for await (const file of archiveFilesFiles) {
            logger.info(`Processing file: ${file}`);
            // if eml file, process it
            let markdown_body;
            if (file.endsWith('.eml')) {
                markdown_body = await processEMLFile(file).then(res => res.markdown_body);
            } else if (file.endsWith('.md')) {
                markdown_body = await fsp.readFile(file, 'utf-8');
            }
            let { attributes, html } = markdownToHtml(markdown_body);
            html = archivePostTemplate({ attributes, content: html, title: attributes.title });

            authorSet.add(attributes['author-slug']);

            let newUrl;
            if (attributes.date && attributes.date.toISOString) {
                newUrl = path.join(
                    attributes.date.toISOString().split('T')[0].replaceAll('-', '/'),
                    attributes.slug
                );
            }
            else {
                logger.warn(`Invalid date format in file ${file}`);
                newUrl = path.join(
                    new Date(0).toISOString().split('T')[0].replaceAll('-', '/'),
                    attributes.slug
                );
            }

            let newFilePath;

            if (file.includes('source/archive')) {
                attributes['post-type'] = 'archive';
                newFilePath = path.join('./docs/archive', newUrl, 'index.html');
            } else if (file.includes('source/blog')) {
                attributes['post-type'] = 'blog';
                newFilePath = path.join('./docs/blog', newUrl, 'index.html');
            } else {
                logger.warn(`File ${file} is not in the archive or blog directory`);
                continue;
            }

            await fsp.mkdir(path.dirname(newFilePath), { recursive: true });
            await fsp.writeFile(newFilePath, html);

            archivePostsMetadata.push(attributes);
        }

        // Generate author pages
        const archiveAuthors = [...new Set(authorData.values())];
        await fsp.mkdir('./docs/authors/', { recursive: true });

        for (const author of archiveAuthors) {
            console.log(`Checking author ${author.name} with slugs ${author.slugs.join(', ')}`);
            const authorPosts = archivePostsMetadata.filter(post => author.slugs.includes(post['author-slug']));
            console.log(`Author ${author.name} has ${authorPosts.length} posts`);
            if (authorPosts.length === 0) {
                continue;
            }

            const authorInfoContent = author.bio ? author.bio : '';
            let html = marked(authorInfoContent);
            html = authorTemplate({ posts: authorPosts, authorInfoContent: html, author  });

            await fsp.mkdir(`./docs/authors/${author.slugs[0]}`, { recursive: true });
            await fsp.writeFile(`./docs/authors/${author.slugs[0]}/index.html`, html);
            
            // create redirects for other slugs
            for (const slug of author.slugs.slice(1)) {
                const html = `<meta http-equiv="refresh" content="0; url=/authors/${author.slugs[0]}">`;
                await fsp.mkdir(`./docs/authors/${slug}`, { recursive: true });
                await fsp.writeFile(`./docs/authors/${slug}/index.html`, html);
            }
        }

        // Generate archive index page
        const archiveIndexContent = archiveIndexTemplate({ posts: archivePostsMetadata.filter(post => post['post-type'] === 'archive') });
        await fsp.writeFile('./docs/archive/index.html', archiveIndexContent);

        // Generate blog index page
        const blogIndexContent = archiveIndexTemplate({ posts: archivePostsMetadata.filter(post => post['post-type'] === 'blog') });
        await fsp.writeFile('./docs/blog/index.html', blogIndexContent);

        logger.info('Processing completed successfully.');
    } catch (error) {
        logger.error('An unexpected error occurred:', error);
    }
}

// Run the script
main();

function markdownToHtml(markdown) {
    const { attributes, body } = parse(markdown);
    const html = marked(body);
    return { attributes, html };
}

async function loadAuthorData() {
    const authorDataFile = JSON.parse(await fsp.readFile(AUTHOR_DATA_FILE, 'utf-8'));
    // is a list of objects with keys: name, slugs, bio, website
    // create a map of slugs to author objects
    const authorData = new Map();
    authorDataFile.forEach(author => {
        author.slugs.forEach(slug => {
            authorData.set(slug, author);
        });
    });
    return authorData;
}