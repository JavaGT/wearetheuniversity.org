// https://docs.google.com/spreadsheets/d/e/2PACX-1vRK60uZgiy1R8M3cPPXm3B512GgWSXRZF7iheQpISowPZNXPH_sppVi1kFWbRaZdoaFteKrMkZAzL0P/pub?output=csv
import { csvParse } from "https://cdn.skypack.dev/d3-dsv@3";
import { createPostcard, renderPostcard, stamps, images } from "./script.mjs";

const gallery = document.querySelector('#gallery');


if (gallery) {
    // get csv and parse it in browser
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRK60uZgiy1R8M3cPPXm3B512GgWSXRZF7iheQpISowPZNXPH_sppVi1kFWbRaZdoaFteKrMkZAzL0P/pub?output=csv';
    const csv = await fetch(csvUrl).then(response => response.text()).catch(error => {
        console.error('Error fetching csv', error);
        gallery.innerHTML = 'Error fetching gallery data. Please try again later.';
        throw error;
    })
    let data = csvParse(csv);

    // get the gallery container



    // create a postcard renderer
    const { canvas, ctx } = createPostcard();
    canvas.style.display = 'none';

    // for (let i=0;i<10;i++) {
    // create a card for each row in the csv

    const unique_messages = new Set();
    let current_message;
    data = data.filter(row => {
        try {
            current_message = JSON.parse(row.JSON).message;
            if (unique_messages.has(current_message)) {
                return false
            }
            unique_messages.add(current_message);
            return true
        } catch (e) {
            // console.error('Error parsing JSON', row.JSON);
            return false
        }
    })

    data
        // randomize the order of the rows, but all the rows with signed  should be at the top
        // .sort((a, b) => {
        //     if (a.signed && !b.signed) return -1;
        //     if (!a.signed && b.signed) return 1;
        //     return Math.random() - 0.5;
        // })
        .forEach(row => {
            if (row?.Remove.toLowerCase() === 'yes') {
                console.log('Skipping row', row);
                return
            }
            if (!row.JSON) return;
            try {
                row = JSON.parse(row.JSON);
            } catch (e) {
                console.error('Error parsing JSON', row.JSON);
                return;
            }
            if (!row.message?.trim()) return;

            if (shouldHide(row.message)) return

            console.log('Rendering row', row);
            const formdata = new FormData();
            formdata.append('prompt', row.prompt);
            formdata.append('image', row.image);
            formdata.append('message', row.message);
            formdata.append('signed', row.signed);
            formdata.append('stamp', row.stamp || 'WATU');

            // render the postcard
            renderPostcard(formdata, ctx, { stamps, images });
            // append the postcard to the gallery
            const img = new Image();
            img.src = canvas.toDataURL();
            if (row.stamp === 'WATU') {
                // black background
                img.style.backgroundColor = 'black';
                img.style.border = '2px solid #fffb';
            }
            if (row.stamp === 'TEU') {
                // TEU branded
                img.style.backgroundColor = '#ff5800'
            }
            gallery.appendChild(img);

            // when image is clicked, open its dataurl in a new tab
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => {
                const win = window.open();
                win.document.body.style.margin = 0;
                win.document.write(`<img style="max-width:100vw;max-height:100vh" src="${img.src}">`);
            });
            // add id to the image
            img.id = row.submission_id
        });
    // }

    // remove the loading spinner id="gallery-loading"
    document.querySelector('#gallery-loading').remove();




}
function shouldHide(message) {
    const hidewords = [
        'communist',
        'socialist',
        'lazy',
        'privliged',
    ]
    for (const bad of hidewords) {
        if (message.toLowerCase().includes(bad)) {
            return true
        }
    }
    return false
}