export async function scrapeChannelPage(page, maxVideos) {
    // Wait for channel info to load
    await page.waitForSelector('ytd-channel-name');

    // Get channel details
    const channelInfo = await page.evaluate(() => {
        const channelName = document.querySelector('ytd-channel-name yt-formatted-string')?.textContent.trim();
        const subscriberCount = document.querySelector('#subscriber-count')?.textContent.trim();
        const description = document.querySelector('#description-container #description')?.textContent.trim();
        
        return {
            channel_name: channelName || '',
            channel_url: window.location.href,
            subscribers: subscriberCount || '0',
            description: description || '',
            total_videos: document.querySelector('#videos-count')?.textContent.trim() || '0',
        };
    });

    // Navigate to videos tab if not already there
    const videosTabButton = await page.$('tp-yt-paper-tab:has-text("Videos")');
    if (videosTabButton) {
        await videosTabButton.click();
        await page.waitForSelector('ytd-grid-video-renderer');
    }

    // Get latest videos
    const videos = await page.evaluate(async (maxVideos) => {
        const videoElements = document.querySelectorAll('ytd-grid-video-renderer');
        const results = [];

        for (let i = 0; i < Math.min(videoElements.length, maxVideos); i++) {
            const video = videoElements[i];
            
            const titleElement = video.querySelector('#video-title');
            const metadataElement = video.querySelector('#metadata-line');
            const thumbnailElement = video.querySelector('#thumbnail img');

            if (!titleElement) continue;

            const metadata = metadataElement ? metadataElement.textContent.split('•') : [];
            const views = metadata[0] ? metadata[0].trim() : '0 views';
            const uploadDate = metadata[1] ? metadata[1].trim() : '';

            results.push({
                title: titleElement.textContent.trim(),
                video_url: titleElement.href,
                views: views,
                upload_date: uploadDate,
                duration: video.querySelector('#overlays #text')?.textContent.trim() || '',
                thumbnail_url: thumbnailElement ? thumbnailElement.src : '',
            });
        }

        return results;
    }, maxVideos);

    return {
        source: 'channel',
        ...channelInfo,
        latest_videos: videos,
    };
} 