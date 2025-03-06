import fsp from 'fs/promises';
import parse from 'front-matter';
import { marked } from 'marked';
import pug from 'pug';
import path from 'path';
// 404.md also
const page_template = pug.compileFile('./source/templates/page.pug')
const not_found_file = './source/404.md'
const not_found = await fsp.readFile(not_found_file, 'utf8')
const { attributes: not_found_attributes, body: not_found_body } = parse(not_found)
const not_found_content = marked(not_found_body)
const not_found_html = page_template({ ...not_found_attributes, content: not_found_content })
await fsp.writeFile('./docs/404.html', not_found_html)
