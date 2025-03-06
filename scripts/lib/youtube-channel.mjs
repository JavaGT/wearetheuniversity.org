import fsp from "fs/promises";
import { execp } from "./lib.mjs";
import convert from "xml-js";

let loggingEnabled = true;
function log(...args) {
    if (loggingEnabled) {
        console.log(...args);
    }
}

export function setLoggingEnabled(enabled) {
    loggingEnabled = enabled;
}

export async function youtubeChannelIdToRss(channel_id) {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel_id}`;
    log(`Generated RSS URL: ${rssUrl}`);
    return rssUrl;
}

export async function fetchYoutubeChannelRss(channel_id) {
    const feed_url = await youtubeChannelIdToRss(channel_id);
    log(`Trying ${feed_url}`);
    return fetch(feed_url)
        .then(x => x.text());
}

export async function fetchYoutubeChannelRssObject(channel_id) {
    return fetchYoutubeChannelRss(channel_id)
        .then(x => convert.xml2js(x, { compact: true }));
}

export async function scrapeYoutubeChannelRecent(channel_id) {
    const obj = await fetchYoutubeChannelRssObject(channel_id);
    const videos = obj.feed.entry.map(entry => {
        const title = entry.title._text;
        const url = entry.link._attributes.href;
        const id = entry["yt:videoId"]._text;
        const videoDetails = { title, url, id, channel_id };
        log(`Scraped video: ${JSON.stringify(videoDetails)}`);
        return videoDetails;
    });
    return videos;
}

export async function listYoutubeChannelVideos(channel_id) {
    log(`Fetching videos for channel: ${channel_id}`);
    return execp(`yt-dlp --flat-playlist --print id "https://www.youtube.com/channel/${channel_id}"`, { maxBuffer: 1024 * 1024 * 10 })
        .then(x => x.split('\n').filter(x => x.trim() !== ''))
        .catch(() => {
            log(`Failed to fetch videos for channel: ${channel_id}`);
            return [];
        });
}