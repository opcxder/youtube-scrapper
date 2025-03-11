export async function scrapeUserProfilePage(page) {
    // Get user profile info
    const userInfo = await page.evaluate(() => {
        const channelName = document.querySelector('yt-formatted-string.ytd-channel-name')?.textContent.trim();
        return {
            username: channelName || '',
            profile_url: window.location.href,
        };
    });

    // Get subscribed channels
    const subscribedChannels = await page.evaluate(async () => {
        const channels = [];
        const channelElements = document.querySelectorAll('ytd-guide-entry-renderer');

        for (const channel of channelElements) {
            const name = channel.querySelector('#guide-entry-title')?.textContent.trim();
            const url = channel.querySelector('a')?.href;

            if (name && url && url.includes('/channel/')) {
                channels.push({
                    channel_name: name,
                    channel_url: url,
                });
            }
        }

        return channels;
    });

    // Get recently watched videos
    const recentlyWatched = await page.evaluate(async () => {
        const videos = [];
        const videoElements = document.querySelectorAll('ytd-video-renderer');

        for (const video of videoElements) {
            const titleElement = video.querySelector('#video-title');
            const channelElement = video.querySelector('#channel-name a');

            if (!titleElement || !channelElement) continue;

            videos.push({
                title: titleElement.textContent.trim(),
                video_url: titleElement.href,
                channel_name: channelElement.textContent.trim(),
                channel_url: channelElement.href,
            });
        }

        return videos;
    });

    return {
        source: 'user_profile',
        ...userInfo,
        subscribed_channels: subscribedChannels,
        recently_watched: recentlyWatched,
    };
} 