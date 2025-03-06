import fsp from 'fs/promises'

// read all in archive 
for await (let path of await fsp.glob('./source/archive/**/*.md')) {
    // read file
    let file = await fsp.readFile(path, 'utf-8')
    console.log(path)
    let slug = path.split('_').pop().split('.md')[0]
    // check if it has slug in frontmatter
    if (file.split('\n').some(line => line.startsWith('slug:'))) {
        console.log(`Slug already exists in ${path}`)
        continue
    }
    // add slug to frontmatter
    let new_file = file.split('\n')
    // add before second line that is '---\s+'
    new_file.splice(1, 0, `slug: ${slug}`)
    await fsp.writeFile(path, new_file.join('\n'))
    console.log(path)
}