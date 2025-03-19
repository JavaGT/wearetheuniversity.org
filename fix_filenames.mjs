import fsp from 'fs/promises';

// any .md file with a ` character in the name
const files = fsp.glob('./**/*.md');

for await (const file of files) {

    if (file.includes('`')) {
        console.log('Fixing file:', file);
        const newFile = file.replace(/`/g, '');
        await fsp.rename(file, newFile);
    }

}