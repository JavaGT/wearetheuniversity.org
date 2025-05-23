// Critical prompts for the union members to answer
const prompts = [
    // Neutral
    "My job makes me feel...",

    // Positive
    "I am grateful for...",

    // Wellness
    "I am able to support my family/whānau when...",
    "I feel well when...",
    "My wellness is impacted by...",
    "My sense of safety is...",

    // Leadership
    "My employer makes me feel...",
    "University leadership is...",
    "My relationship to management is...",

    // Relations
    "I feel supported when...",
    "I feel valued when...",
    "I feel respected when...",

    // Desires
    "I wish my job...",
    "I wish my uni life...",
]

export const images = [
    { url: '/wellness-postcards/images/rec-center.jpeg', alt: 'UOA Rec' },
    { url: '/wellness-postcards/images/victoria-law-library.jpg', alt: 'Vic Law' },
    { url: '/wellness-postcards/images/UC-1.png', alt: 'UC Leaves' },
    { url: '/wellness-postcards/images/UC-2.png', alt: 'UC Tea' },
    { url: '/wellness-postcards/images/AUT.jpeg', alt: 'AUT Tea' },
    { url: '/wellness-postcards/images/UOA.png', alt: 'UOA Jenga' },
    { url: '/wellness-postcards/images/Lincoln-1.png', alt: 'Lincoln Sunflower' },
    { url: '/wellness-postcards/images/Lincoln-2.png', alt: 'Lincoln Jenga' },
    { url: '/wellness-postcards/images/bowl-of-fruit.jpg', alt: 'Bowl of Fruit' },
    { url: '/wellness-postcards/images/beehive.png', alt: 'Beehive' },
    { url: '/wellness-postcards/images/traffic.jpg', alt: 'Traffic' },
    { url: '/wellness-postcards/images/office.jpg', alt: 'Office' },

].map(image => {
    image.img = new Image()
    image.img.src = image.url
    // image.img.onload = () => renderPostcard(form, ctx, { stamps, images })
    return image
})

export const stamps = [
    { url: '/wellness-postcards/images/WATU-Stamp.png', alt: 'WATU' },
    { url: '/wellness-postcards/images/TEU-Stamp.png', alt: 'TEU' },
].map(stamp => {
    stamp.img = new Image()
    stamp.img.src = stamp.url
    return stamp
})

const dataInput = [
    { label: 'Prompt', optional: false, type: 'select', options: prompts, default: prompts[0] },
    { label: 'Image', optional: false, type: 'radio', options: images.map(image => image.alt), default: images[0].alt },
    { label: 'Message', optional: false, type: 'textarea', placeholder: 'Write your message here', default: '' },
    { label: 'Signed', optional: true, type: 'text', placeholder: 'Anonymous', default: '' },
    { label: 'Stamp', optional: false, type: 'radio', options: stamps.map(stamp => stamp.alt), default: stamps[0].alt },
    { label: 'Privacy Statement', type: 'span', default: 'If you share to the public gallery, You agree to your postcard to be used for other  promotional material for this campaign, only your message, prompt, image selections, and signed name are included.' },
    { label: 'Share postcard to public gallery?', optional: false, type: 'radio', options: ['Yes', 'No'], default: 'Yes' },
    { label: 'Privacy Statement', type: 'span', default: 'You agree to share optional contact data below with WATU and TEU such as your name and email, solely for communication about this campaign.  All personal data is securely stored and will not be shared with third parties except for necessary campaign support services. You have the right to access and correct your data. We will retain personal data only for the duration of this campaign and will securely delete it afterward. For any privacy concerns, please contact <a href="mailto:contact@wearetheuniversity.org">contact@wearetheuniversity.org</a>' },
    { label: 'Identities', optional: true, type: 'checkbox', options: ['Student', 'Staff', 'Alumni', 'Other'] },
    { label: 'Share email', optional: true, type: 'checkbox', options: ['TEU', 'WATU'], default: ['TEU', 'WATU'] },
    { label: 'Name', optional: true, type: 'text', placeholder: 'Haeata Waitī', default: '' },
    { label: 'Email', optional: true, type: 'email', placeholder: 'name@domain.com', default: '' },
    { label: 'Submit', type: 'submit', default: 'Submit & Download' },
    { label: 'Feedback', type: 'span', default: 'Provide feedback, 2 questions.', href: 'https://docs.google.com/forms/d/e/1FAIpQLSeHfgMrPkx6-u1QVMzq-XX1i8Xx0zKbFDmzcn97BV8Eil5MrA/viewform' }
]

function createForm(dataInput) {
    const form = document.createElement('form')
    form.id = 'postcard-form'
    form.classList.add('postcard-form')
    dataInput.forEach(input => {
        const set = document.createElement('fieldset')
        set.classList.add('fieldset-' + input.type.toLowerCase())
        set.classList.add('fieldset-label-' + input.label.toLowerCase().replace(/\s+/g, '-'))
        if (input.optional) set.classList.add('fieldset-optional')
        const legend = document.createElement('legend')
        legend.textContent = input.label
        set.appendChild(legend)

        if (input.type === 'span') {
            const p = input.href ? document.createElement('a') : document.createElement('span')
            if (input.href) {
                p.href = input.href
                p.target = '_blank'
                p.rel = 'noopener noreferrer'
            }
            p.innerHTML = input.default
            set.appendChild(p)
            form.appendChild(set)
            return;
        }

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

export function createPostcard() {
    // create a canvas which renders the postcard front and back
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630 * 2;
    const ctx = canvas.getContext('2d');

    // document.getElementById('visual').appendChild(canvas);

    return { ctx, canvas };

    // const stampImg = new Image();
    // stampImg.src = '/media/WATU-Stamp.png';
    // stampImg.onload  = renderPostcard;
}

function urlParam(name, defaultValue) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || defaultValue;
}

export function renderPostcard(form, ctx, { stamps, images }) {
    // retrive scale from url params
    let scale = urlParam('scale', 1)
    // if form is already formdata, skip this step
    const formData = form instanceof FormData ? form : new FormData(form)
    let prompt = formData.get('prompt')
    // if  #blank in url then prompt = 'My job makes me feel...'
    if (window.location.hash === '#blank') {
        prompt = ''
    }
    const image = formData.get('image')
    const message = formData.get('message')
    const signed = formData.get('signed')
    const name = formData.get('name')
    const email = formData.get('email')
    const shareEmail = formData.getAll('share email')
    const identities = formData.getAll('identities')
    // console.log({ prompt, image, message, signed, name, email, shareEmail, identities })

    ctx.canvas.width = 1200 * scale
    ctx.canvas.height = 630 * 2 * scale

    // clear
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1200 * scale, 630 * 2 * scale);

    // rec-centre.jpeg
    // draw image on top half
    // ctx.drawImage(recImg, 0, 0, 1200, 630);
    // ctx.drawImage(images[document.querySelector('input[name="image"]:checked').value].img, 0, 0, 1200, 630);
    ctx.drawImage((images.find(img => img.alt === image) || images[0]).img, 0, 0, 1200 * scale, 630 * scale);

    // render "What wellness means to me" on the front
    ctx.fillStyle = 'white';
    ctx.font = 'bold ' + Math.floor(46 * scale) + 'px monospace';
    // add drop shadow
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 8 * scale
    ctx.shadowOffsetX = 3 * scale;
    ctx.shadowOffsetY = 3 * scale;

    // measure prompt width
    let promptWidth = ctx.measureText(prompt).width;
    // if prompt is too long, scale down font size
    if (promptWidth > (1200 - 200) * scale) {
        const fontSize = Math.floor((46 * (1200 - 200) / promptWidth) * scale);
        ctx.font = 'bold ' + fontSize + 'px monospace';
        promptWidth = ctx.measureText(prompt).width;
    }


    // draw a faint box behind the text
    ctx.fillStyle = 'rgba(0,0,0, 0.5)';
    ctx.fillRect((100 - 10) * scale, (550 - 46 - 10) * scale, (promptWidth + 20) * scale, (46 + 30) * scale);
    // if #blank then draw a white box to be written on, most of the width of the card
    if (window.location.hash === '#blank') {
        ctx.fillStyle = 'rgba(255,255,255, 0.75)';
        ctx.fillRect((100 - 10) * scale, (550 - 46 - 10) * scale, (1200 - 200) * scale, (46 + 30) * scale);
    }

    ctx.fillStyle = 'white';

    // selected prompt
    ctx.fillText(prompt, (100) * scale, (550) * scale);
    ctx.fillText(prompt, (100) * scale, (550) * scale);
    ctx.fillText(prompt, (100) * scale, (550) * scale);
    ctx.fillText(prompt, (100) * scale, (550) * scale);
    ctx.fillText(prompt, (100) * scale, (550) * scale);
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
    ctx.moveTo(0, (630) * scale);
    ctx.lineTo(1200, (630) * scale);
    ctx.stroke();

    // const fontSize = document.querySelector('input[name="Font Size"]');
    // const fontInput = document.querySelector('input[name="Font"]:checked');
    // ctx.font = fontSize.value + 'px ' + fontInput.value;


    let fontnum = Math.floor(46 * scale)

    ctx.font = fontnum + 'px monospace';

    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';

    const numChars = message.length;
    let charactersPerLine = 60;
    // message holds 300 characters by default, if there are more, scale font size down in proportion
    let linespacing = 50 * scale;
    let text_x = 100 * scale;

    if (numChars > 160) {
        let fontSize = Math.floor(46 * 180 / (numChars / 1.2) * scale)
        fontSize = Math.max(fontSize, 30 * scale)
        fontSize = Math.min(fontSize, 46 * scale)
        fontSize = Math.floor(fontSize)
        ctx.font = fontSize + 'px monospace';
        linespacing = Math.floor(4 + (46 * 220 / numChars) * scale);
        linespacing = Math.max(linespacing, 30 * scale);
        linespacing = Math.min(linespacing, 50 * scale);
        linespacing = Math.floor(linespacing);
    }
    charactersPerLine = Math.floor(700 * scale / ctx.measureText('M').width);
    if (numChars > 300) {
        charactersPerLine = Math.floor(900 * scale / ctx.measureText('M').width);
        text_x -= 40 * scale;
    }
    if (numChars > 600) {
        charactersPerLine = Math.floor(1000 * scale / ctx.measureText('M').width);
        text_x = 20 * scale;
        let fontSize = 26 * scale
        fontSize = Math.floor(fontSize)
        ctx.font = fontSize + 'px monospace';
    }

    // draw lines for text on the back
    ctx.strokeStyle = 'lightgrey';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(100 * scale, (850 * scale) + i * linespacing);
        ctx.lineTo(700 * scale, (850 * scale) + i * linespacing);
        ctx.stroke();
    }
    // split message into lines, only split text on spaces
    // const lines = [];
    // let currentLine = '';
    // message.split(' ').forEach(word => {
    //     if (currentLine.length + word.length < charactersPerLine) {
    //         currentLine += word + ' ';
    //     } else {
    //         lines.push(currentLine);
    //         currentLine = word + ' ';
    //     }
    // });
    // lines.push(currentLine);


    // re-do adding forced line breaks with \n
    const lines = message.split('\n').reduce((acc, line) => {
        const words = line.split(' ');
        let currentLine = '';
        words.forEach(word => {
            if (currentLine.length + word.length < charactersPerLine) {
                currentLine += word + ' ';
            } else {
                acc.push(currentLine);
                currentLine = word + ' ';
            }
        });
        acc.push(currentLine);
        return acc;
    }, []);

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
        const jiggle = Math.floor((((i ** 7) % 4 * 4) - 4) * scale)
        const x_offset = Math.min(Math.floor((600 * scale - lineWidth)), 0) / 20;

        ctx.fillText(line, text_x + jiggle + x_offset, 845 * scale + (i - offset) * linespacing);
    });

    ctx.textAlign = 'right';
    // if #blank no signed name
    if (window.location.hash !== '#blank') {
        ctx.fillText('-' + (signed ? signed : "Anonymous"), 1100 * scale, (850 + (5 * 50) - 5) * scale);
    }
    ctx.textAlign = 'left';

    // draw a box on the right for stamp
    ctx.beginPath();
    ctx.moveTo((800 + 150) * scale, (1200 - 550) * scale);
    ctx.lineTo((800 + 150) * scale, (1200 - 550) * scale);
    ctx.lineTo((1000 + 150) * scale, (1200 - 550) * scale);
    ctx.lineTo((1000 + 150) * scale, (1400 - 550) * scale);
    ctx.lineTo((800 + 150) * scale, (1400 - 550) * scale);
    ctx.lineTo((800 + 150) * scale, (1200 - 550) * scale);
    ctx.stroke();

    // Draw stamp
    const stampImg = stamps.find(stamp => stamp.alt === formData.get('stamp'))?.img;

    ctx.save();
    ctx.translate((800 + 150 + 100) * scale, (1200 - 550 + 100) * scale);
    ctx.rotate(Math.PI / 40);
    ctx.drawImage(stampImg, -130 * scale, -100 * scale, 250 * scale, 200 * scale);
    ctx.restore();

    // add url to bottom of top half
    // https://wearetheuniversity.org/wellness-postcards/

    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.font = 'bold ' + Math.floor(20 * scale) + 'px monospace';
    ctx.textAlign = 'right';
    ctx.strokeText('www.wearetheuniversity.org/wellness-postcards', (1200 - 100) * scale, (630 * 2 - 20) * scale);
    ctx.fillText('www.wearetheuniversity.org/wellness-postcards', (1200 - 100) * scale, (630 * 2 - 20) * scale);
    ctx.textAlign = 'left';
}
export function run() {

    const { ctx, canvas } = createPostcard()
    document.getElementById('visual').appendChild(canvas);
    const form = createForm(dataInput)
    document.getElementById('inputs').appendChild(form)

    // stamp.img.onload = () => renderPostcard(form, ctx, { stamps, images })

    stamps.map(stamp => stamp.img.onload = () => renderPostcard(form, ctx, { stamps, images }))
    images.map(image => image.img.onload = () => renderPostcard(form, ctx, { stamps, images }))

    renderPostcard(form, ctx, { stamps, images })
    setTimeout(() => renderPostcard(form, ctx, { stamps, images }), 100)
    setTimeout(() => renderPostcard(form, ctx, { stamps, images }), 1000)

    form.addEventListener('input', () => renderPostcard(form, ctx, { stamps, images }))
    form.addEventListener('submit', (event) => {
        event.preventDefault()
        renderPostcard(form, ctx, { stamps, images })
        // Save as jpg
        const image_file = ctx.canvas.toDataURL('image/jpeg', 0.8)
        const a = document.createElement('a')
        a.href = image_file
        a.download = 'wellness-postcard.jpg'
        a.click()
        // form.reset()

        //  Check for permission to share with WATU & TEU
        const formData = new FormData(form)
        const sharePostcard = formData.get('Share postcard to public gallery?'.toLowerCase())

        // pull out the data from the form
        const prompt = formData.get('Prompt'.toLowerCase())
        const image = formData.get('Image'.toLowerCase())
        const message = formData.get('Message'.toLowerCase())
        const signed = formData.get('Signed'.toLowerCase())
        const name = formData.get('Name'.toLowerCase())
        const email = formData.get('Email'.toLowerCase())
        const shareEmail = formData.getAll('Share email'.toLowerCase())
        const identities = formData.getAll('Identities'.toLowerCase())
        const stamp = formData.get('Stamp'.toLowerCase())

        const submission_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.name = 'hidden_iframe'
        document.body.appendChild(iframe)

        if (message !== 'this is a test') {

            // DRY version
            const privateForm = document.createElement('form')
            privateForm.action = 'https://docs.google.com/forms/d/e/1FAIpQLSfY3iQ3hR5elvIFrUhzAJYrAypbpeVWNFCd5VdIBoWAIMOuOw/formResponse'
            privateForm.target = 'hidden_iframe'
            privateForm.id = 'bootstrapForm'
            privateForm.method = 'POST'
            privateForm.style.display = 'none'
                ;[
                    { name: 'entry.1571391080', type: 'textarea', value: JSON.stringify({ submission_id, prompt, image, message, signed, name, email, shareEmail, identities, stamp }) },
                    { name: 'fvv', type: 'hidden', value: '1' },
                    { name: 'fbzx', type: 'hidden', value: '-7941070824493946295' },
                    { name: 'pageHistory', type: 'hidden', value: '0' },
                    { name: 'btn-submit', type: 'submit', value: 'Submit' }
                ].forEach(field => {
                    const input = document.createElement('input')
                    input.type = field.type
                    input.name = field.name
                    input.value = field.value
                    privateForm.appendChild(input)
                    console.log(`Adding ${field.name} with value ${field.value}`)
                })

            document.body.appendChild(privateForm)
            privateForm.submit()
            console.log(privateForm)

            setTimeout(() => {
                if (sharePostcard === 'Yes') {
                    const publicForm = document.createElement('form')
                    publicForm.action = 'https://docs.google.com/forms/d/e/1FAIpQLSdxpEpEARq2Qz9uARTqkfKWEFfDKXh64IUoV8Mw8TwVfP8EQg/formResponse'
                    publicForm.target = 'hidden_iframe'
                    publicForm.id = 'bootstrapForm'
                    publicForm.method = 'POST'
                    publicForm.style.display = 'none'
                        ;[
                            { name: 'entry.406853500', type: 'textarea', value: JSON.stringify({ submission_id, prompt, image, message, signed, stamp }) },
                            { name: 'fvv', type: 'hidden', value: '1' },
                            { name: 'fbzx', type: 'hidden', value: '-4275759135674733626' },
                            { name: 'pageHistory', type: 'hidden', value: '0' },
                            { name: 'btn-submit', type: 'submit', value: 'Submit' }
                        ].forEach(field => {
                            const input = document.createElement('input')
                            input.type = field.type
                            input.name = field.name
                            input.value = field.value
                            publicForm.appendChild(input)
                        })

                    document.body.appendChild(publicForm)
                    publicForm.submit()
                    console.log(publicForm)
                }
            }, 1000)

        }

        // display popup message thanking the user for their submission
        // also link them to social media to share their postcard
        // bluesky
        // instagram
        const popup = document.createElement('div')
        popup.style.position = 'fixed'
        popup.style.top = '50%'
        popup.style.left = '50%'
        popup.style.transform = 'translate(-50%, -50%)'
        popup.style.backgroundColor = 'white'
        popup.style.padding = '20px'
        popup.style.border = '1px solid black'
        popup.style.zIndex = '1000'

        popup.innerHTML = `
        <button id="close-popup">Close</button>
        <h2>Thank you for making a postcard!</h2>
        <p>Your postcard has been saved to your downloads folder.</p>
        <h3>Share your postcard on social media:</h3>
        <h2>#universtywellness</h2>
        <a href="https://twitter.com/intent/tweet?url=https://wearetheuniversity.org/wellness-postcards&text=I just made a university wellness postcard! Check it out! #universitywellness @nzteu @wetheuniversity @TEU_UoA" target="_blank" rel="noopener noreferrer">Twitter</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=https://wearetheuniversity.org/wellness-postcards" target="_blank" rel="noopener noreferrer">Facebook</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://wearetheuniversity.org/wellness-postcards" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="https://bsky.app/intent/compose?text=I just made a university wellness postcard! Check it out! https://wearetheuniversity.org/wellness-postcards #universitywellness @wearetheuniversity.bsky.social" target="_blank" rel="noopener noreferrer">Bluesky</a>

        <h3>Don't forget alt text for your postcard image!</h3>
        <p>Alt text is a description of the image for people who can't see it. It's important for accessibility. You can use the image description below:</p>
        <p style="border: 1px solid rgba(0,0,0,0.4) id="alt-text">A digital postcard with a photo of ${image} on the front and a message on the back. The message reads: "${prompt} ${message}". The postcard is signed "${signed ? signed : "Anonymous"}".</p>
        <button onclick="navigator.clipboard.writeText(document.getElementById('alt-text').textContent)">Copy alt text</button>
    `
        document.body.appendChild(popup)
        popup.querySelector('#close-popup').addEventListener('click', () => popup.remove())
    })
}