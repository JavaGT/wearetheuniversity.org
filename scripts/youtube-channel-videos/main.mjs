import fsp from 'fs/promises'
import { listYoutubeChannelVideos, setLoggingEnabled } from '../lib/youtube-channel.mjs'

// let channel_ids = new Set()
// for await (const metadatapath of fsp.glob('./source/archive/youtube/*.metadata.json')) {
//     const metadata = JSON.parse(await fsp.readFile(metadatapath, 'utf-8'))
//     channel_ids.add(metadata.channel_id)
// }
// fsp.writeFile('./scripts/youtube-channel-videos/channel_ids.txt', [...channel_ids].join('\n'))


for await (const channel_id of (await fsp.readFile('./scripts/youtube-channel-videos/channel_ids.txt', 'utf-8')).split('\n')) {
    if (channel_id.trim() === '') continue
    // const channel_id = 'UCUKg41qkUTUQXGDzklgpmlQ'
    const datestring = new Date().toISOString().split('T')[0]
    const output_file = `./scripts/youtube-channel-videos/${channel_id}-${datestring}-video_ids.txt`
    
    global.loggingEnabled = true
    
    setLoggingEnabled(true)
    
    const video_ids = await listYoutubeChannelVideos(channel_id)
    await fsp.writeFile(output_file, video_ids.join('\n'))
    
    console.log('Wrote', video_ids.length, 'video ids to', output_file)
}