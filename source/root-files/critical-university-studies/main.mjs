const DATA_PATH = './data.json';

// Create canvas and add to page
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// --- HTML Controls ---
const controlsDiv = document.createElement('div');
controlsDiv.style.position = 'absolute';
controlsDiv.style.top = '0';
controlsDiv.style.left = '0';
controlsDiv.style.width = '100%';
controlsDiv.style.padding = '10px';
controlsDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
controlsDiv.style.zIndex = '1000';
controlsDiv.innerHTML = `
  <input type="text" id="searchInput" placeholder="Search filter..." style="margin-right:10px;"/>
  <select id="kindFilter" style="margin-right:10px;">
    <option value="all">All Kinds</option>
  </select>
  <input type="checkbox" id="filterToggle" checked style="margin-right:5px;"/>
  <label for="filterToggle" style="margin-right:10px;">Show Filtered Points</label>
  <input type="number" id="umapEpochInput" placeholder="UMAP epochs" style="margin-right:10px;"/>
  <button id="runUmapButton">Re-run UMAP</button>
  <span id="umapProgress" style="margin-left:10px; color:white;">UMAP Progress: 0%</span>
`;
document.body.appendChild(controlsDiv);

// Global filter variables.
let searchQuery = '';
let selectedKind = 'all';
let filterToggle = true; // true: show filtered points with transparency; false: do not render filtered points

document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = deMacronize(e.target.value.toLowerCase())
});
document.getElementById('kindFilter').addEventListener('change', e => {
    selectedKind = e.target.value;
});
document.getElementById('filterToggle').addEventListener('change', e => {
    filterToggle = e.target.checked;
});

// Reference to UMAP progress indicator.
const umapProgressIndicator = document.getElementById('umapProgress');

// --- Canvas Resize ---
function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawBackground();
}
function drawBackground() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
onResize();
window.addEventListener('resize', onResize);

// --- Camera and Helpers ---
const camera = {
    x: 0,
    y: 0,
    zoom: -2,
    zoomFactor: 0.05,
    maxZoom: 3,
    minZoom: -2
};

function getScale() {
    return Math.pow(2, camera.zoom);
}

function worldToScreen(x, y) {
    const scale = getScale();
    return {
        x: (x - camera.x) * scale + canvas.width / 2,
        y: (y - camera.y) * scale + canvas.height / 2,
    };
}

// --- Data Loading and Preprocessing ---
const umapConfig = { nComponents: 2, nNeighbors: 20, minDist: 0.5, nEpochs: 400 };
let umap = new UMAP.UMAP(umapConfig);
const numberOfItems = 99999999999999;

const data = await fetch(DATA_PATH)
    .then(response => response.json())
    .then(data =>
        data
            .slice(0, numberOfItems)
            .filter(item =>
                item.title &&
                (item.title.toLowerCase().includes('university') ||
                    item.title.toLowerCase().includes('higher education'))
            )
            .map(item => {
                // Unpack base64 encoded uint8array.
                const array = Array.from(Uint8Array.from(atob(item.b64_title_embedding), c => c.charCodeAt(0)));
                item.title_embedding = array.map(c => c / 255 - 0.5);
                return item;
            })
    );
console.log(data);

// Populate kind dropdown using unique kinds from data.
const kindFilterEl = document.getElementById('kindFilter');
const kinds = new Set(data.map(item => item.kind));
kinds.forEach(kind => {
    const option = document.createElement('option');
    option.value = kind;
    option.textContent = kind;
    kindFilterEl.appendChild(option);
});

// --- Points Creation ---
const pointFocusRadius = 10;
let points = data.map((item, i) => {
    return {
        // Combine several embedding dimensions plus noise.
        x: item.title_embedding[0] * 5000 + item.title_embedding[2] * 5000 + item.title_embedding[4] * 5000 + Math.random() * 10,
        y: item.title_embedding[1] * 5000 + item.title_embedding[3] * 5000 + item.title_embedding[5] * 5000 + Math.random() * 10,
        size: 8,
        color: `hsl(${item.title_embedding[0] * 3000 + 100}, 100%, 50%)`,
        label: item.title,
        link: item.link || item.doi
            ? `https://doi.org/${item.doi}`
            : `https://www.google.com/search?q=${item.title} by ${item.authors}`.replaceAll(' ', '+'),
        authors: item.authors, // comma-separated string
        year: item.year,
        kind: item.kind
    };
});
console.log(points.length);

// --- UMAP Fitting for All Points Initially ---
await umap.fitAsync(points.map(point => [point.x, point.y]), epoch => {
    const progress = Math.floor((epoch / umapConfig.nEpochs) * 100);
    umapProgressIndicator.textContent = `UMAP Progress: ${progress}%`;
    if (epoch % 10 === 0) console.log(`Epoch ${epoch}`);
});
umapProgressIndicator.textContent = 'UMAP Complete';

const positions = umap.getEmbedding();
for (let i = 0; i < points.length; i++) {
    points[i].x = positions[i][0] * 100;
    points[i].y = positions[i][1] * 100;
}

// Global cell structure and cell labels.
let cells = {};
let cellLabels = {};
const stopList = ["the", "and", "of", "in", "a", "to", "for", "with", "on", "is", "by", "an", "at", "as", "pp", "from", "that", "this", "it", "its", "higher", "education", "university"]

// --- Build Spatial Cells and Compute Cell Labels ---
function rebuildCells() {
    cells = {};
    for (let point of points) {
        const cellX = Math.floor(point.x / 100);
        const cellY = Math.floor(point.y / 100);
        cells[cellX] = cells[cellX] || {};
        cells[cellX][cellY] = cells[cellX][cellY] || [];
        cells[cellX][cellY].push(point);
    }
    updateCellLabels();
}

// Computes common words (ignoring stop-list) that appear in more than 3 points per cell.
function updateCellLabels() {
    cellLabels = {};
    for (let cellX in cells) {
        cellLabels[cellX] = cellLabels[cellX] || {};
        for (let cellY in cells[cellX]) {
            const wordCount = {};
            // For each point in the cell, split the label into words.
            for (let point of cells[cellX][cellY]) {
                const words = point.label.split(/\W+/).map(w => w.toLowerCase()).filter(w => w && !stopList.includes(w));
                // Count words in this cell.
                for (let word of words) {
                    wordCount[word] = (wordCount[word] || 0) + 1;
                }
            }
            // Gather words that appear in more than 3 points.
            const commonWords = [];
            for (let word in wordCount) {
                if (wordCount[word] > 2) {
                    commonWords.push({ word, count: wordCount[word] });
                }
            }
            if (commonWords.length) {
                // Join words into a label.
                cellLabels[cellX][cellY] = commonWords.sort((a, b) => b.count - a.count).slice(0, 3).map(w => w.word).join(', ');
            }
        }
    }
}

// Initial cells build.
rebuildCells();

const charactersWithMacronMap = {
    'à': 'a',
    'á': 'a',
    'â': 'a',
    'ã': 'a',
    'ä': 'a',
    'å': 'a',
    'ā': 'a',
    'ă': 'a',
    'ą': 'a',
    'ç': 'c',
    'ć': 'c',
    'č': 'c',
    'è': 'e',
    'é': 'e',
    'ê': 'e',
    'ë': 'e',
    'ē': 'e',
    'ė': 'e',
    'ę': 'e',
    'ě': 'e',
    'ğ': 'g',
    'ì': 'i',
    'í': 'i',
    'î': 'i',
    'ï': 'i',
    'ī': 'i',
    'į': 'i',
    'ı': 'i',
    'ł': 'l',
    'ñ': 'n',
    'ń': 'n',
    'ň': 'n',
    'ò': 'o',
    'ó': 'o',
    'ô': 'o',
    'õ': 'o',
    'ö': 'o',
    'ø': 'o',
    'ō': 'o',
    'ő': 'o',
    'ř': 'r',
    'š': 's',
    'ß': 'ss',
    'ù': 'u',
    'ú': 'u',
    'û': 'u',
    'ü': 'u',
    'ū': 'u',
    'ů': 'u',
    'ű': 'u',
    'ý': 'y',
    'ÿ': 'y',
    'ž': 'z',
    'æ': 'ae',
    'œ': 'oe',
    'ø': 'o',
    'å': 'a',
    'ą': 'a',
    'ć': 'c',
    'ę': 'e',
    'ł': 'l',
    'ń': 'n',
    'ś': 's',
    'ź': 'z',
    'ż': 'z',
}

function deMacronize(text) {
    return text.replace(/[^\x00-\x7F]/g, c => charactersWithMacronMap[c] || c);
}

// --- Filtering Helper ---
function isPointMatching(point) {
    const searchMatch = !searchQuery || deMacronize(point.label.toLowerCase()).includes(searchQuery);
    const kindMatch = (selectedKind === 'all' || point.kind === selectedKind);
    return searchMatch && kindMatch;
}

// --- UMAP Re-run Function ---
// Only re-run on points that pass the filters.
async function runUMAP(epochs) {
    const filteredPoints = points.filter(isPointMatching);
    if (filteredPoints.length === 0) return;
    const umapFiltered = new UMAP.UMAP({ ...umapConfig, nEpochs: epochs });
    await umapFiltered.fitAsync(filteredPoints.map(p => [p.x, p.y]), epoch => {
        const progress = Math.floor((epoch / epochs) * 100);
        umapProgressIndicator.textContent = `UMAP Progress: ${progress}%`;
        if (epoch % 10 === 0) console.log(`Epoch ${epoch}`);
    });
    umapProgressIndicator.textContent = 'UMAP Complete';
    const newPositions = umapFiltered.getEmbedding();
    for (let i = 0; i < filteredPoints.length; i++) {
        filteredPoints[i].x = newPositions[i][0] * 100;
        filteredPoints[i].y = newPositions[i][1] * 100;
    }
    rebuildCells();
}
document.getElementById('runUmapButton').addEventListener('click', async () => {
    const epochs = parseInt(document.getElementById('umapEpochInput').value) || umapConfig.nEpochs;
    console.log('Running UMAP for', epochs, 'epochs on filtered points');
    await runUMAP(epochs);
});

// --- Cursor & Nearest Point ---
const cursor = { x: 0, y: 0, nearestPoint: null };

// --- Helper: Draw Grid ---
function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -10; i <= 10; i++) {
        // Vertical lines.
        let start = worldToScreen(i * 100, -1000);
        let end = worldToScreen(i * 100, 1000);
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        // Horizontal lines.
        start = worldToScreen(-1000, i * 100);
        end = worldToScreen(1000, i * 100);
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
    }
    ctx.stroke();
}

// --- Helper: Rounded Rectangle ---
function roundRect(ctx, x, y, width, height, radius, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.fill();
}

// --- Helper: Parse Styled Text ---
// Supports **bold** and *italic* markers.
function parseStyledText(text) {
    const segments = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ text: text.substring(lastIndex, match.index), bold: false, italic: false });
        }
        const marker = match[0];
        if (marker.startsWith('**') && marker.endsWith('**')) {
            segments.push({ text: marker.slice(2, -2), bold: true, italic: false });
        } else if (marker.startsWith('*') && marker.endsWith('*')) {
            segments.push({ text: marker.slice(1, -1), bold: false, italic: true });
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        segments.push({ text: text.substring(lastIndex), bold: false, italic: false });
    }
    return segments;
}

function measureStyledTextWidth(ctx, text, fontSize = 20, fontFamily = 'sans-serif') {
    const segments = parseStyledText(text);
    let totalWidth = 0;
    segments.forEach(seg => {
        ctx.font = `${seg.bold ? 'bold ' : ''}${seg.italic ? 'italic ' : ''}${fontSize}px ${fontFamily}`;
        totalWidth += ctx.measureText(seg.text).width;
    });
    return totalWidth;
}

// --- Helper: Render Styled Text with Background ---
function renderText(ctx, x, y, text, options = {}) {
    const opacity = options.opacity || 1;
    const padding = options.padding || 10;
    const bgColor = options.backgroundColor || `rgba(0,0,0,0.8)`;
    const fontSize = options.fontSize || 20;
    const fontFamily = options.fontFamily || 'sans-serif';
    const segments = parseStyledText(text);
    let totalWidth = 0;
    segments.forEach(seg => {
        ctx.font = `${seg.bold ? 'bold ' : ''}${seg.italic ? 'italic ' : ''}${fontSize}px ${fontFamily}`;
        totalWidth += ctx.measureText(seg.text).width;
    });
    const textHeight = fontSize;
    const rectX = x;
    const rectY = y;
    const rectWidth = totalWidth + padding * 2;
    const rectHeight = textHeight + padding * 2;
    // globalAlpha is used to fade out the text and background.
    ctx.globalAlpha = opacity;
    roundRect(ctx, rectX, rectY, rectWidth, rectHeight, 10, bgColor);
    let currentX = x + padding;
    const textY = y + padding + textHeight / 2;
    segments.forEach(seg => {
        ctx.font = `${seg.bold ? 'bold ' : ''}${seg.italic ? 'italic ' : ''}${fontSize}px ${fontFamily}`;
        ctx.fillStyle = options.textColor || 'white';
        ctx.textBaseline = 'middle';
        ctx.fillText(seg.text, currentX, textY);
        currentX += ctx.measureText(seg.text).width;
    });
    ctx.globalAlpha = 1;
}

// --- Helper: Wrap Text ---
function wrapText(ctx, text, maxWidth, fontSize = 14, fontFamily = 'sans-serif') {
    ctx.font = `${fontSize}px ${fontFamily}`;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (let word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

// --- Render Nearest Point Info ---
function drawNearestPointInfo(point) {
    const scale = getScale();
    const screenPos = worldToScreen(point.x, point.y);
    const renderSize = point.size * scale * 1.5;
    const fontSize = 20 * scale;
    const padding = 10;

    const labelText = point.label;
    const textWidth = measureStyledTextWidth(ctx, labelText, fontSize);
    const labelX = screenPos.x - textWidth / 2 - padding;
    const labelY = screenPos.y - renderSize - fontSize - padding;
    renderText(ctx, labelX, labelY, labelText, { fontSize, padding, backgroundColor: 'rgba(0,0,0,0.8)' });

    const infoText = `Authors: ${point.authors} | Year: ${point.year || 'N/A'}`;
    const infoFontSize = fontSize * 0.8;
    const infoTextWidth = measureStyledTextWidth(ctx, infoText, infoFontSize);
    const infoX = screenPos.x - infoTextWidth / 2 - padding;
    const infoY = labelY - (infoFontSize + padding + 5);
    renderText(ctx, infoX, infoY, infoText, { fontSize: infoFontSize, padding, backgroundColor: 'rgba(0,0,0,0.8)' });
}

// --- Draw Citation at Bottom ---
function drawCitation() {
    const citationText = cursor?.nearestPoint?.label ?
        `${cursor.nearestPoint.label} | ${cursor.nearestPoint.authors} | Year: ${cursor.nearestPoint.year || 'N/A'}` :
        'Hover over a point for details';
    const fontSize = 14;
    const padding = 5;
    const maxTextWidth = canvas.width - 40;
    const lines = wrapText(ctx, citationText, maxTextWidth, fontSize);
    const lineHeight = fontSize + padding * 2;
    const totalHeight = lines.length * lineHeight;

    for (let i = 0; i < lines.length; i++) {
        const textWidth = ctx.measureText(lines[i]).width;
        const x = (canvas.width - (textWidth + padding * 2)) / 2;
        const y = canvas.height - totalHeight + i * lineHeight - 10;
        renderText(ctx, x, y, lines[i], { fontSize, padding, backgroundColor: 'rgba(0,0,0,0.8)', textColor: 'lightgray' });
    }
}

// --- Render Cell Labels ---
// Draws common word labels for each cell.
function drawCellLabels() {
    // opacity relates to zoom level
    const opacity = Math.max(0, Math.min(1, (camera.zoom - camera.minZoom) / (camera.maxZoom - camera.minZoom)));
    if (opacity < 0.1) return;
    const fontSize = 12;
    const padding = 3;
    for (let cellX in cellLabels) {
        for (let cellY in cellLabels[cellX]) {
            const label = cellLabels[cellX][cellY];
            if (label) {
                // Compute world coordinates (top-left of the cell).
                const worldX = cellX * 100;
                const worldY = cellY * 100;
                const screenPos = worldToScreen(worldX, worldY);
                renderText(ctx, screenPos.x, screenPos.y, label, {
                    fontSize, padding,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    textColor: 'white',
                    opacity
                });
            }
        }
    }
}

// --- Main Render Loop ---
function render() {
    drawBackground();
    drawGrid();

    cursor.nearestPoint = null;
    let nearestDistance = Infinity;
    const cellX = Math.floor(cursor.x / 100);
    const cellY = Math.floor(cursor.y / 100);
    for (let i = cellX - 1; i <= cellX + 1; i++) {
        for (let j = cellY - 1; j <= cellY + 1; j++) {
            if (cells[i] && cells[i][j]) {
                for (let point of cells[i][j]) {
                    if (!filterToggle && !isPointMatching(point)) continue;
                    const distance = Math.hypot(point.x - cursor.x, point.y - cursor.y);
                    if (distance < nearestDistance && distance < pointFocusRadius) {
                        nearestDistance = distance;
                        cursor.nearestPoint = point;
                    }
                }
            }
        }
    }
    canvas.style.cursor = cursor.nearestPoint ? 'pointer' : 'default';

    const scale = getScale();
    for (let point of points) {
        const matches = isPointMatching(point);
        if (!filterToggle && !matches) continue;
        const opacity = matches ? 1 : 0.1;

        const screenPos = worldToScreen(point.x, point.y);
        const halfWidth = canvas.width / scale / 2;
        const halfHeight = canvas.height / scale / 2;
        if (
            point.x < camera.x - halfWidth ||
            point.x > camera.x + halfWidth ||
            point.y < camera.y - halfHeight ||
            point.y > camera.y + halfHeight
        ) {
            continue;
        }

        if (point === cursor.nearestPoint) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.shadowColor = point.color;
            ctx.shadowBlur = 20;
        } else {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
        }
        ctx.fillStyle = point.color;
        const renderSize = point.size * scale;

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, renderSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    if (cursor.nearestPoint) {
        drawNearestPointInfo(cursor.nearestPoint);
    }

    // Draw cell labels over points.
    drawCellLabels();

    drawCitation();

    window.requestAnimationFrame(render);
}
render();

// --- Event Listeners ---
canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const zoomDelta = Math.sign(e.deltaY) * camera.zoomFactor;
    camera.zoom = Math.min(camera.maxZoom, Math.max(camera.minZoom, camera.zoom + zoomDelta));
    if (camera.zoom === camera.maxZoom || camera.zoom === camera.minZoom) return;
    camera.x += (e.offsetX - canvas.width / 2) / getScale() * zoomDelta;
    camera.y += (e.offsetY - canvas.height / 2) / getScale() * zoomDelta;
});

canvas.addEventListener('mousemove', e => {
    if (e.buttons === 1) {
        camera.x -= e.movementX / getScale();
        camera.y -= e.movementY / getScale();
    }
    cursor.x = (e.offsetX - canvas.width / 2) / getScale() + camera.x;
    cursor.y = (e.offsetY - canvas.height / 2) / getScale() + camera.y;
});

document.addEventListener('keydown', e => {
    if ((e.key === '0' && e.ctrlKey) || (e.key === '0' && e.metaKey)) {
        camera.x = 0;
        camera.y = 0;
        camera.zoom = camera.minZoom;
    }
});

document.addEventListener('mouseup', e => {
    if (cursor.nearestPoint && cursor.nearestPoint.link && (e.metaKey || e.ctrlKey)) {
        window.open(cursor.nearestPoint.link, '_blank');
    }
});
