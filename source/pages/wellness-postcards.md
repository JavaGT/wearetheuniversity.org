---
slug: 'wellness-postcards'
title: 'Make a Wellness Postcard'
---

<style>
    body {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

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
        margin: 20px;
        padding: 10px;
        background: cadetblue;
        border-radius: 10px;
    }
    #inputs > * {
        padding: 6px;
    }
    section.body {
        max-width: 96vw !important;
        display: flex;
        flex-flow: wrap;
        justify-content: space-around;
    }
</style>

<div id="visual"></div>
<div id="inputs"></div>


<script type="module">
    // create a canvas which renders the postcard front and back
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630 * 2;
    const ctx = canvas.getContext('2d');

    document.getElementById('visual').appendChild(canvas);

    // prpmopt selection
    const prompts = [
        "What wellness means to me...",
        "Our new gym...",
        "I feel well when...",
        "Obstacles to my wellness include...",
        "University managment..."
    ];

    // select interface for prompt
    const label0 = document.createElement('label');
    label0.textContent = 'Prompt';
    document.getElementById('inputs').appendChild(label0);

    const promptSelect = document.createElement('select');
    promptSelect.onchange = () => {
        renderPostcard();
    }
    document.getElementById('inputs').appendChild(promptSelect);

    prompts.forEach((prompt) => {
        const option = document.createElement('option');
        option.value = prompt;
        option.textContent = prompt;
        promptSelect.appendChild(option);
    });

    const label1 = document.createElement('label');
    label1.textContent = 'Message';
    document.getElementById('inputs').appendChild(label1);
    const textbox = document.createElement('textarea');
    textbox.innerHTML = ["Fair pay", "Good working conditions", "A sense of purpose", "A sense of belonging", "A sense of achievement"][Math.floor(Math.random() * 5)];
    textbox.oninput = () => {
        renderPostcard();
    }
    document.getElementById('inputs').appendChild(textbox);

    const label2 = document.createElement('label');
    label2.textContent = 'Signed by';
    document.getElementById('inputs').appendChild(label2);

    const signedBy = document.createElement('input');
    signedBy.placeholder = 'Anonymous';
    signedBy.oninput = renderPostcard;
    document.getElementById('inputs').appendChild(signedBy);

    // font selection using radio buttons
    const label3 = document.createElement('label');
    label3.textContent = 'Font';
    document.getElementById('inputs').appendChild(label3);

    const fontWrapper = document.createElement('div');
    document.getElementById('inputs').appendChild(fontWrapper);

    const fontInput = document.createElement('input');
    fontInput.type = 'text';
    fontInput.style.display = 'none';
    fontInput.oninput = renderPostcard;
    fontInput.value = 'monospace';
    fontInput.onchange = () => {
        const font = document.querySelector('input[name="font"]:checked');
        font.checked = false;
        renderPostcard();
    }
    document.getElementById('inputs').appendChild(fontInput);
    
    const fonts = ['cursive', 'serif', 'fantasy', 'sans-serif', 'monospace'];
    fonts.forEach((font, i) => {
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'font';
        input.value = font;
        input.id = font;
        input.onchange = () => {
            fontInput.value = font;
            renderPostcard();
        }
        if (i === 0) {
            input.checked = true;
            fontInput.value = font;
        }
        fontWrapper.appendChild(input);

        const label = document.createElement('label');
        label.textContent = font;
        label.htmlFor = font;
        fontWrapper.appendChild(label);
    });

    // event listener for font selection
    fontInput.onchange = renderPostcard;


    // font size
    const label4 = document.createElement('label');
    label4.textContent = 'Font Size';
    document.getElementById('inputs').appendChild(label4);

    const fontSize = document.createElement('input');
    fontSize.type = 'number';
    fontSize.value = 46;
    fontSize.oninput = renderPostcard;
    fontSize.max = 46;
    fontSize.min = 30;
    document.getElementById('inputs').appendChild(fontSize);

    // save image (as jpg) button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Image';
    saveButton.onclick = () => {
        const link = document.createElement('a');
        link.download = 'postcard.jpg';
        link.href = canvas.toDataURL('image/jpeg');
        link.click();
    }
    document.getElementById('inputs').appendChild(saveButton);


    // draw stamp /assets/WATU-Stamp.png
    const img = new Image();
    img.src = '/media/WATU-Stamp.png';
    img.onload = renderPostcard;


    const recImg = new Image();
    recImg.src = '/media/well-rec-centre.jpeg';
    recImg.onload = renderPostcard;

    renderPostcard();

    function renderPostcard() {
        // clear
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 1200, 630 * 2);

        // rec-centre.jpeg
        // draw image on top half
        ctx.drawImage(recImg, 0, 0, 1200, 630);

        // render "What wellness means to me" on the front
        ctx.fillStyle = 'white';
        ctx.font = 'bold 46px monospace';
        // add drop shadow
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // selected prompt
        ctx.fillText(promptSelect.value, 100, 550);
        ctx.fillText(promptSelect.value, 100, 550);
        ctx.fillText(promptSelect.value, 100, 550);
        ctx.fillText(promptSelect.value, 100, 550);


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
        ctx.font = fontSize.value + 'px ' + fontInput.value;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(100, 850 + i * 50);
            ctx.lineTo(600, 850 + i * 50);
            ctx.stroke();
            // render line of text
        }

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
        const name = signedBy.value || 'Anonymous';
        // right align
        ctx.textAlign = 'right';
        // save current font
        let currentFont = ctx.font;
        // set fontsize to 46
        console.log('font is', ctx.font);
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


        ctx.save();
        ctx.translate(800 + 150 + 100, 1200 - 550 + 100);
        ctx.rotate(Math.PI / 40);
        ctx.drawImage(img, -130, -100, 250, 200);
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