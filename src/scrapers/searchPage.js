export async function scrapeSearchPage(page, maxVideos) {
    console.log('Starting search page scraping...');

    // Handle cookie consent popup if it appears
    try {
        await page.waitForSelector('button[aria-label="Accept all"]', { timeout: 5000 });
        await page.click('button[aria-label="Accept all"]');
    } catch (e) {
        console.log('No consent popup found');
    }

    // Wait for search results to load
    await page.waitForSelector('ytd-video-renderer, ytd-grid-video-renderer', { timeout: 30000 });
    console.log('Search results found');

    // Scroll to load more results
    console.log('Scrolling to load more content...');
    for (let i = 0; i < 2; i++) {
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight * 2);
        });
        await page.waitForTimeout(2000);
    }

    // Extract video information
    console.log('Starting video extraction from search results...');
    const videos = await page.evaluate((maxVideos) => {
        const results = [];
        
        // Get all video elements from search results
        const videoElements = Array.from(document.querySelectorAll('ytd-video-renderer, ytd-grid-video-renderer'));
        console.log(`Found ${videoElements.length} video elements in search`);

        for (let i = 0; i < Math.min(videoElements.length, maxVideos); i++) {
            try {
                const videoElement = videoElements[i];
                
                // Get video title and URL
                const titleElement = videoElement.querySelector('#video-title');
                if (!titleElement) {
                    console.log(`No title element found for video ${i}`);
                    continue;
                }

                // Get channel information
                const channelElement = videoElement.querySelector('#channel-info a, #channel-name a');
                if (!channelElement) {
                    console.log(`No channel element found for video ${i}`);
                    continue;
                }

                // Get metadata
                const metadataElement = videoElement.querySelector('#metadata-line');
                const metadata = metadataElement ? metadataElement.textContent.trim().split('•') : [];
                const views = metadata[0] ? metadata[0].trim() : '0 views';
                const uploadDate = metadata[1] ? metadata[1].trim() : '';

                // Get thumbnail
                const thumbnailElement = videoElement.querySelector('#thumbnail img');
                const thumbnailUrl = thumbnailElement ? thumbnailElement.src : '';

                // Get duration
                const durationElement = videoElement.querySelector('#text.ytd-thumbnail-overlay-time-status-renderer');
                const duration = durationElement ? durationElement.textContent.trim() : '';

                // Get description
                const descriptionElement = videoElement.querySelector('#description-text');
                const description = descriptionElement ? descriptionElement.textContent.trim() : '';

                const videoData = {
                    title: titleElement.textContent.trim(),
                    video_url: titleElement.href || `https://www.youtube.com${titleElement.getAttribute('href')}`,
                    channel_name: channelElement.textContent.trim(),
                    channel_url: channelElement.href,
                    description,
                    views,
                    upload_date: uploadDate,
                    duration,
                    thumbnail_url: thumbnailUrl,
                };

                console.log(`Successfully extracted video: ${videoData.title}`);
                results.push(videoData);
            } catch (e) {
                console.error(`Error extracting video ${i}:`, e.message);
            }
        }

        console.log(`Finished extraction. Found ${results.length} videos.`);
        return results;
    }, maxVideos);

    console.log(`Extracted ${videos.length} videos from search results`);

    return {
        source: 'search',
        videos,
    };
} 