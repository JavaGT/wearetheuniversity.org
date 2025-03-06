import path from 'path';
import fsp from 'fs/promises';
// copy from source/root-files to docs
const root_files = await fsp.glob('./source/root-files/**/*')
for await (const file of root_files) {
    const new_filepath = file.replace('source/root-files/', 'docs/')
    await fsp.mkdir(path.dirname(new_filepath), { recursive: true })
    console.log(`Copying ${file} to ${new_filepath}`)
    // if a file, use copyFile
    if ((await fsp.lstat(file)).isFile()) {
        await fsp.copyFile(file, new_filepath)
    } else if ((await fsp.lstat(file)).isDirectory()) {
        await fsp.mkdir(new_filepath, { recursive: true })
    }
}