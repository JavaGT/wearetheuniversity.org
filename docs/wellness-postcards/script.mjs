// Critical prompts for the union members to answer
const prompts = [
    "I am grateful for...",
    "I am proud of...",
    "I am happy about...",
    "I feel well when...",
    "My employer makes me feel...",
    "I worry for...",
    "The best part of my job is...",
    "My sources of stress are...",
    "My sources of joy are...",
    "I feel supported when...",
    "I don't feel supported when...",
    "I feel heard when...",
    "I feel seen when...",
    "I feel valued when...",
    "I feel respected when...",
    "I feel safe when...",
    "I feel included when..."
]

const images = [
    { url: './images/rec-center.jpeg', alt: 'Recreation Center' },
    { url: './images/victoria-law-library.jpg', alt: 'Victoria Law Library' },
    { url: './images/bowl-of-fruit.jpg', alt: 'Bowl of Fruit' },
    { url: './images/beehive.png', alt: 'Beehive' },
    { url: './images/traffic.jpg', alt: 'Traffic' },
    { url: './images/office.jpg', alt: 'Office' },
]

const stamps = [
    { url: './images/WATU-Stamp.png', alt: 'WATU Stamp' },
    { url: './images/TEU-Stamp.png', alt: 'TEU Stamp' },
    // { url: './images/TEU2-Stamp.png', alt: 'TEU Stamp 2' },
]

const dataInput = [
    { label: 'Prompt', optional: false, type: 'select', options: prompts, default: prompts[0] },
    { label: 'Image', optional: false, type: 'radio', options: images.map(image => image.alt), default: images[0].alt },
    { label: 'Message', optional: false, type: 'textarea', placeholder: 'Write your message here', default: '' },
    { label: 'Signed', optional: true, type: 'text', placeholder: 'Anonymous', default: '' },
    { label: 'Stamp', optional: false, type: 'radio', options: stamps.map(stamp => stamp.alt), default: stamps[0].alt },
    { label: 'Identities', optional: true, type: 'checkbox', options: ['Student', 'Staff', 'Alumni', 'Other'] },
    { label: 'Share email', optional: true, type: 'checkbox', options: ['TEU', 'WATU'], default: ['TEU', 'WATU'] },
    { label: 'Name', optional: true, type: 'text', placeholder: 'Haeata Waitī', default: '' },
    { label: 'Email', optional: true, type: 'email', placeholder: 'name@domain.com', default: '' },
    { label: 'Submit', type: 'submit', default: 'Submit' }
]

function createForm(dataInput) {
    const form = document.createElement('form')
    form.id = 'postcard-form'
    form.classList.add('postcard-form')
    dataInput.forEach(input => {
        const set = document.createElement('fieldset')
        set.classList.add('fieldset-' + input.type.toLowerCase())
        if (input.optional) set.classList.add('fieldset-optional')
        const legend = document.createElement('legend')
        legend.textContent = input.label
        set.appendChild(legend)
        const inputField = input.type === 'text' || input.type === 'email' || input.type === 'submit' ? document.createElement('input') : document.createElement(input.type)
        if (input.type === 'text' || input.type === 'email' || input.type === 'submit') inputField.type = input.type
        inputField.name = input.label.toLowerCase()
        inputField.placeholder = input.placeholder
        if (input.type === 'radio' || input.type === 'checkbox') {
            input.options?.forEach(option => {
                const label = document.createElement('label')
                const radio = document.createElement('input')
                radio.type = input.type
                radio.name = input.label.toLowerCase()
                radio.value = option
                if (input.default === option) radio.checked = true
                if (input?.default?.includes(option)) radio.checked = true
                label.appendChild(radio)
                label.append(option)
                set.appendChild(label)
            })
            set.appendChild(inputField)
        } else if (input.type === 'select') {
            const select = document.createElement('select')
            select.name = input.label.toLowerCase()
            input.options?.forEach(option => {
                const optionElement = document.createElement('option')
                optionElement.value = option
                optionElement.textContent = option
                if (input.default === option) optionElement.selected = true
                select.appendChild(optionElement)
            })
            set.appendChild(select)
        } else {
            inputField.value = input.default
            set.appendChild(inputField)
        }
        form.appendChild(set)
    }
    )
    return form
}

function createPostcard() {
    // create a canvas which renders the postcard front and back
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630 * 2;
    const ctx = canvas.getContext('2d');

    document.getElementById('visual').appendChild(canvas);

    return { ctx, canvas };

    // const stampImg = new Image();
    // stampImg.src = '/media/WATU-Stamp.png';
    // stampImg.onload  = renderPostcard;
}

function renderPostcard(form, ctx) {
    const formData = new FormData(form)
    const prompt = formData.get('prompt')
    const image = formData.get('image')
    const message = formData.get('message')
    const signed = formData.get('signed')
    const name = formData.get('name')
    const email = formData.get('email')
    const shareEmail = formData.getAll('share email')
    const identities = formData.getAll('identities')
    console.log({ prompt, image, message, signed, name, email, shareEmail, identities })


    // clear
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1200, 630 * 2);

    // rec-centre.jpeg
    // draw image on top half
    // ctx.drawImage(recImg, 0, 0, 1200, 630);
    // ctx.drawImage(images[document.querySelector('input[name="image"]:checked').value].img, 0, 0, 1200, 630);
    ctx.drawImage(images.find(img => img.alt === image).img, 0, 0, 1200, 630);

    // render "What wellness means to me" on the front
    ctx.fillStyle = 'white';
    ctx.font = 'bold 46px monospace';
    // add drop shadow
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // measure prompt width
    const promptWidth = ctx.measureText(prompt).width;

    // draw a faint box behind the text
    ctx.fillStyle = 'rgba(0,0,0, 0.5)';
    ctx.fillRect(100-10, 550 - 46-10, promptWidth + 20, 46 + 30);

    ctx.fillStyle = 'white';

    // selected prompt
    ctx.fillText(prompt, 100, 550);
    ctx.fillText(prompt, 100, 550);
    ctx.fillText(prompt, 100, 550);
    ctx.fillText(prompt, 100, 550);
    ctx.fillText(prompt, 100, 550);
    // ctx.fillText(document.querySelector('select[name="Prompt"]').value, 100, 550);
    // ctx.fillText(document.querySelector('select[name="Prompt"]').value, 100, 550);
    // ctx.fillText(document.querySelector('select[name="Prompt"]').value, 100, 550);
    // ctx.fillText(document.querySelector('select[name="Prompt"]').value, 100, 550);


    // reset drop shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;


    // draw a line between the front and back
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(0, 630);
    ctx.lineTo(1200, 630);
    ctx.stroke();

    // draw lines for text on the back
    ctx.strokeStyle = 'lightgrey';
    // const fontSize = document.querySelector('input[name="Font Size"]');
    // const fontInput = document.querySelector('input[name="Font"]:checked');
    // ctx.font = fontSize.value + 'px ' + fontInput.value;

    ctx.font = '46px monospace';

    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(100, 850 + i * 50);
        ctx.lineTo(700, 850 + i * 50);
        ctx.stroke();
    }

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';

    const numChars = message.length;
    let charactersPerLine = 60;
    // message holds 300 characters by default, if there are more, scale font size down in proportion
    if (numChars > 180) {
        ctx.font = Math.floor(46 * 180 / numChars) + 'px monospace';
    }
    charactersPerLine = Math.floor(700 / ctx.measureText('M').width);

    // split message into lines, only split text on spaces
    const lines = [];
    let currentLine = '';
    message.split(' ').forEach(word => {
        if (currentLine.length + word.length < charactersPerLine) {
            currentLine += word + ' ';
        } else {
            lines.push(currentLine);
            currentLine = word + ' ';
        }
    });
    lines.push(currentLine);

    // draw text on the back
    ctx.fillStyle = 'black';
    lines.forEach((line, i) => {
        // ctx.fillText(line, 100, 850 + i * 50);
        // offset by half the difference between number of lines and 5
        // if line is less than 5, offset by 0
        let offset = 0;
        if (lines.length > 5) {
            offset = Math.floor((lines.length - 5) / 2)
        }
        // measure the width of the line
        const lineWidth = ctx.measureText(line).width;
        // draw the line with a slight offset, more offset for longer lines
        const jiggle = (((i ** 7) % 4 * 4) - 4)
        const x_offset = Math.min(Math.floor((600 - lineWidth)), 0) / 20;

        ctx.fillText(line, 100 + jiggle + x_offset, 845 + (i - offset) * 50);
    });

    ctx.textAlign = 'right';
    ctx.fillText('-' + (signed ? signed : "Anonymous"), 1100, 850 + 5 * 50 - 5);
    ctx.textAlign = 'left';

    // draw a box on the right for stamp
    ctx.beginPath();
    ctx.moveTo(800 + 150, 1200 - 550);
    ctx.lineTo(800 + 150, 1200 - 550);
    ctx.lineTo(1000 + 150, 1200 - 550);
    ctx.lineTo(1000 + 150, 1400 - 550);
    ctx.lineTo(800 + 150, 1400 - 550);
    ctx.lineTo(800 + 150, 1200 - 550);
    ctx.stroke();

    // Draw stamp
    const stampImg = stamps.find(stamp => stamp.alt === formData.get('stamp')).img;

    ctx.save();
    ctx.translate(800 + 150 + 100, 1200 - 550 + 100);
    ctx.rotate(Math.PI / 40);
    ctx.drawImage(stampImg, -130, -100, 250, 200);
    ctx.restore();

    // add url to bottom of top half
    // https://wearetheuniversity.org/wellness-postcards/

    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'right';
    ctx.strokeText('www.wearetheuniversity.org/wellness-postcards', 1200 - 100, 630 * 2 - 20);
    ctx.fillText('www.wearetheuniversity.org/wellness-postcards', 1200 - 100, 630 * 2 - 20);
    ctx.textAlign = 'left';
}

const { ctx } = createPostcard()
const form = createForm(dataInput)
document.getElementById('inputs').appendChild(form)

images.forEach(image => {
    image.img = new Image()
    image.img.src = image.url
    image.img.onload = () => renderPostcard(form, ctx)
})

stamps.forEach(stamp => {
    stamp.img = new Image()
    stamp.img.src = stamp.url
    stamp.img.onload = () => renderPostcard(form, ctx)
})

renderPostcard(form, ctx)
setTimeout(() => renderPostcard(form, ctx), 100)
setTimeout(() => renderPostcard(form, ctx), 1000)

form.addEventListener('input', () => renderPostcard(form, ctx))
form.addEventListener('submit', (event) => {
    event.preventDefault()
    renderPostcard(form, ctx)
    // Save as jpg
    const image = ctx.canvas.toDataURL('image/jpeg', 0.8)
    const a = document.createElement('a')
    a.href = image
    a.download = 'wellness-postcard.jpg'
    a.click()


    // form.reset()
})