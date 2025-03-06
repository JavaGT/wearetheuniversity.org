import fsp from 'fs/promises';
import parse from 'front-matter';
import { marked } from 'marked';
import pug from 'pug';
import path from 'path';

const index_file = './source/index.md'
const page_template = pug.compileFile('./source/templates/page.pug')

const index = await fsp.readFile(index_file, 'utf8')
const { attributes, body } = parse(index)
const content = marked(body)

const html = page_template({ ...attributes, content })

await fsp.writeFile('./docs/index.html', html)
