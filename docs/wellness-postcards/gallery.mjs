// https://docs.google.com/spreadsheets/d/e/2PACX-1vRK60uZgiy1R8M3cPPXm3B512GgWSXRZF7iheQpISowPZNXPH_sppVi1kFWbRaZdoaFteKrMkZAzL0P/pub?output=csv
import { csvParse } from "https://cdn.skypack.dev/d3-dsv@3";
import { createPostcard, renderPostcard, stamps, images } from "./script.mjs";

// get csv and parse it in browser
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRK60uZgiy1R8M3cPPXm3B512GgWSXRZF7iheQpISowPZNXPH_sppVi1kFWbRaZdoaFteKrMkZAzL0P/pub?output=csv';
const csv = await fetch(csvUrl).then(response => response.text());
const data = csvParse(csv);

// get the gallery container
const gallery = document.querySelector('#gallery');



// create a postcard renderer
const { canvas, ctx } = createPostcard();
canvas.style.display = 'none';

// for (let i=0;i<10;i++) {
// create a card for each row in the csv
data.forEach(row => {
    row = JSON.parse(row.JSON);
    if (!row.message?.trim()) return;
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
    gallery.appendChild(img);

    // when image is clicked, open its dataurl in a new tab
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
        const win = window.open();
        win.document.write(`<img src="${img.src}">`);
    });
    // add id to the image
    img.id = row.submission_id
});
// }