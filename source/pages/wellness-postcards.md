---
slug: 'wellness-postcards'
title: 'Make a Wellness Postcard'
---

<style>

    canvas {
        border: 1px solid black;
        max-width: 80vw;
        max-height: 80vh;
        margin: 0 auto;
    }

    #inputs {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 0 5px;
        padding: 10px;
        background: cadetblue;
        border-radius: 10px;
    }
    #inputs > * {
        padding: 2px;
    }
    section.body {
        max-width: 96vw !important;
        /* display: flex; */
    }
    .flex {
        display: flex;
        flex-flow: wrap;
        justify-content: center;
        align-items: center;
    }
</style>

<div style="text-align:center; margin-bottom: 1.5rem">
    <h3>Places to share your postcard</h3>
    <a href="https://www.instagram.com">Instagram</a>
    <a href="https://bsky.app">Bluesky</a>
    <a href="https://www.twitter.com">Twitter</a>
    <a href="https://www.facebook.com">Facebook</a>
    <a href="https://www.linkedin.com">LinkedIn</a>
</div>
<div class="flex">
    <div id="visual"></div>
    <div id="inputs"></div>
</div>


<script type="module">
    const data_structure = [
        {
            position: 0,
            name: "Prompt",
            type: "select",
            options: [
                "What wellness means to me...",
                "Our new gym...",
                "I feel well when...",
                "Obstacles to my wellness include...",
                "University managment..."
            ]
        },
        {
            position: 1,
            name: "Message",
            type: "textarea",
            placeholder: "Message",
            value: ["Fair pay", "Paid a living wage", "Good working conditions", "A sense of purpose", "A sense of belonging", "A sense of achievement"][Math.floor(Math.random() * 6)]
        },
        {
            position: 2,
            name: "Signed by",
            type: "input",
            placeholder: "Anonymous",
            input: "text",
            value: "Anonymous"
        },
        {
            position: 3,
            name: "Font",
            type: "radio",
            options: [
                {name: "cursive"},
                {name: "serif"},
                {name: "fantasy"},
                {name: "sans-serif"},
                {name: "monospace"}
            ]
        },
        {
            position: 4,
            name: "Font Size",
            type: "input",
            input: "number",
            value: 46,
            max: 46,
            min: 30
        },
        {
            position: 5,
            name: "Image",
            type: "radio",
            options: [
                {name: "rec-centre", src: '/media/well-rec-centre.jpeg'},
                {name: "vic uni", src: '/media/vic-law-library.jpg'},
                {name: "fruit", src: '/media/fruit.jpg'},
                {name: "clocktower", src: '/media/clocktower.jpg'},
            ]
        },
        {
            position: 6,
            name: "Permission",
            type: "radio",
            label: "Permission to share on the website?",
            options: [
                {name: "yes", value: "yes"},
                {name: "yes (anonymised)", value: "yes-anon"},
                {name: "no", value: "no"}
            ]
        },
        {
            position: 7,
            name: "Save Image",
            type: "button",
            onclick: () => {
                const link = document.createElement('a');
                link.download = 'postcard.jpg';
                link.href = canvas.toDataURL('image/jpeg');
                link.click();
            }
        }
    ]

    const images = {
        'rec-centre':  {src: '/media/well-rec-centre.jpeg'},
        'vic uni':  {src: '/media/vic-law-library.jpg'},
        'fruit':  {src: '/media/fruit.jpg'},
        'clocktower':  {src: '/media/clocktower.jpg'},
    }

    Object.keys(images).forEach((key) => {
        images[key].img = new Image();
        images[key].img.src = images[key].src;
        images[key].img.onload = () => {
            renderPostcard();
        }
    });

    // build interface

    data_structure.forEach((data) => {
        const label = document.createElement('label');
        label.textContent = data.label || data.name;
        document.getElementById('inputs').appendChild(label);

        const element = document.createElement(data.type);
        element.name = data.name;
        element.position = data.position;
        element.value = data.value;
        element.max = data.max;
        element.min = data.min;
        element.placeholder = data.placeholder;
        element.oninput = element.onchange = renderPostcard
        
        if (data.type === "select") {
            data.options.forEach((option) => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                element.appendChild(optionElement);
            });
        } else if (data.type === "radio") {
            data.options.forEach((option, i) => {
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = data.name;
                input.value = option.value || option.name;
                input.id = option.name;
                input.onchange = renderPostcard
                if (i === 0) {
                    input.checked = true;
                }
                element.appendChild(input);

                const label = document.createElement('label');
                label.textContent = option.name;
                label.htmlFor = option.name;
                element.appendChild(label);
            });
        } else if (data.type === "button") {
            element.onclick = data.onclick;
            element.textContent = data.name;
        } else if (data.type === "input") {
            element.type = data.input;
        }
        document.getElementById('inputs').appendChild(element);
    });

    // create a canvas which renders the postcard front and back
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630 * 2;
    const ctx = canvas.getContext('2d');

    document.getElementById('visual').appendChild(canvas);

    const stampImg = new Image();
    stampImg.src = '/media/WATU-Stamp.png';
    stampImg.onload  = renderPostcard;


    renderPostcard();


    function renderPostcard() {
        // clear
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 1200, 630 * 2);

        // rec-centre.jpeg
        // draw image on top half
        // ctx.drawImage(recImg, 0, 0, 1200, 630);
        // ctx.drawImage(images[document.querySelector('input[name="image"]:checked').value].img, 0, 0, 1200, 630);
        ctx.drawImage(images[document.querySelector('input[name="Image"]:checked').value].img, 0, 0, 1200, 630);

        // render "What wellness means to me" on the front
        ctx.fillStyle = 'white';
        ctx.font = 'bold 46px monospace';
        // add drop shadow
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // selected prompt
        ctx.fillText(document.querySelector('select[name="Prompt"]').value, 100, 550);
        ctx.fillText(document.querySelector('select[name="Prompt"]').value, 100, 550);
        ctx.fillText(document.querySelector('select[name="Prompt"]').value, 100, 550);
        ctx.fillText(document.querySelector('select[name="Prompt"]').value, 100, 550);
        ctx.fillText(document.querySelector('select[name="Prompt"]').value, 100, 550);


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
        ctx.fillStyle = 'black';
        const fontSize = document.querySelector('input[name="Font Size"]');
        const fontInput = document.querySelector('input[name="Font"]:checked');
        ctx.font = fontSize.value + 'px ' + fontInput.value;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(100, 850 + i * 50);
            ctx.lineTo(600, 850 + i * 50);
            ctx.stroke();
        }

        const textbox = document.querySelector('[name="Message"]');
        let numberOfLines = Math.min(textbox.value.split('\n').length, 12)

        for (let i = 0; i < Math.min(numberOfLines, 12); i++) {
            // ctx.fillText(textbox.value.split('\n')[i] || '', 100, 850 + i * 50 - 5);
            let text = textbox.value.split('\n')[i] || '';

            // take number of lines and if they are over 5, offset i by half the difference
            let offset = 0;
            if (numberOfLines > 5) {
                offset = -Math.floor(((numberOfLines - 5) / 2))
            }

            ctx.fillText(text, 100, 850 + (i + offset) * 50 - 5);
        }

        // draw signed by
        const signedBy = document.querySelector('[name="Signed by"]');
        const name = signedBy.value || 'Anonymous';
        // right align
        ctx.textAlign = 'right';
        // save current font
        let currentFont = ctx.font;
        // set fontsize to 46

        console.log('original font is', currentFont);
        ctx.font = '46px ' + ctx.font.split(' ')[2];

        console.log('font is now', ctx.font);

        ctx.fillText('-' + name, 1100, 850 + 5 * 50 - 5);

        // restore font
        ctx.font = currentFont;
        console.log('font restored', ctx.font);
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
        ctx.strokeText('www.wearetheuniversity.org/wellness-postcards', 1200 - 100, 630*2 - 20);
        ctx.fillText('www.wearetheuniversity.org/wellness-postcards', 1200 - 100, 630*2 - 20);
        ctx.textAlign = 'left';
    }
</script>