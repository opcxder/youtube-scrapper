export async function scrapeHomePage(page, maxVideos) {
    await page.waitForSelector('ytd-rich-grid-renderer');

    const videos = await page.evaluate(async (maxVideos) => {
        const videoElements = document.querySelectorAll('ytd-rich-item-renderer');
        const results = [];

        for (let i = 0; i < Math.min(videoElements.length, maxVideos); i++) {
            const video = videoElements[i];
            
            // Extract video metadata
            const titleElement = video.querySelector('#video-title');
            const channelElement = video.querySelector('#channel-name a');
            const metadataElement = video.querySelector('#metadata-line');
            const thumbnailElement = video.querySelector('#thumbnail img');

            if (!titleElement || !channelElement) continue;

            const metadata = metadataElement ? metadataElement.textContent.split('•') : [];
            const views = metadata[0] ? metadata[0].trim() : '0 views';
            const uploadDate = metadata[1] ? metadata[1].trim() : '';

            results.push({
                title: titleElement.textContent.trim(),
                video_url: titleElement.href,
                channel_name: channelElement.textContent.trim(),
                channel_url: channelElement.href,
                views: views,
                upload_date: uploadDate,
                duration: video.querySelector('#overlays #text')?.textContent.trim() || '',
                thumbnail_url: thumbnailElement ? thumbnailElement.src : '',
            });
        }

        return results;
    }, maxVideos);

    return {
        source: 'homepage',
        videos,
    };
} 