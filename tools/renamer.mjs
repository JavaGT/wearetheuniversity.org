import fsp from 'fs/promises'
const list = []
// fill list with every file in ../blog and starts with a number. Only files, not directories
for await (const file of await fsp.opendir('./source/blog')) {
    if (file.isFile() && /^\d/.test(file.name)) {
        list.push(file.name)
    }
}
// rename every file. Original format is 0000:Month:00:Title.md new format is ./0000/00/00/Title.md
// make sure to create the directories before renaming the file

let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
let newMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
for (const file of list) {
    const [year, month, day, ...title] = file.split(':')
    let newday = ''+day.padStart(2, '0')
    await fsp.mkdir(`./source/blog/${year}/${newMonths[months.indexOf(month)]}/${newday}`, { recursive: true })
    await fsp.rename(`./source/blog/${file}`, `./source/blog/${year}/${newMonths[months.indexOf(month)]}/${newday}/${title.join(':')}`)
}