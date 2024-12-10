import fsp from 'fs/promises';
fetch("https://profiles.auckland.ac.nz/api/publications/linkedTo", {
    "headers": {
        "accept": "application/json",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/json",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": "AMCVS_AE271F42636189F00A495CC7%40AdobeOrg=1; at_check=true; utm_medium=Newsletter; utm_campaign=2024_CNM_PG_LifelongLearning_Aug24-Oct24; utm_term=3-september; utm_content=feature-tile; utm_source=ARD; ELOQUA=GUID=D2441B8D3DC14613B715D9A04B5A414E&FPCVISITED=1; ezproxy=fGpQgciBQtKjaxV; ezproxyl=fGpQgciBQtKjaxV; ezproxyn=fGpQgciBQtKjaxV; AMCV_AE271F42636189F00A495CC7%40AdobeOrg=179643557%7CMCIDTS%7C20065%7CMCMID%7C00580068111863913891000970246063411795%7CMCOPTOUT-1733665935s%7CNONE%7CvVersion%7C5.5.0; mbox=PC#6cd38143ef2e480e895f8ec33dc1fe0e.36_0#1796903537|session#4b30a86f20834389a63b3a965bbaf05e#1733660597",
        "Referer": "https://profiles.auckland.ac.nz/b-cohen/publications",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "{\"objectId\":\"b-cohen\",\"objectType\":\"user\",\"pagination\":{\"perPage\":50,\"startFrom\":0},\"sort\":\"dateDesc\",\"favouritesFirst\":true}",
    "method": "POST"
}).then(response => response.json()).then(data => {
    console.log(data)
    fsp.writeFile('data.json', JSON.stringify(data, null, 2));
});