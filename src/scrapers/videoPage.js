export async function scrapeVideoPage(page, maxComments) {
    // Wait for video and metadata to load
    await page.waitForSelector('ytd-watch-metadata');
    
    // Get video details
    const videoInfo = await page.evaluate(() => {
        const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent.trim();
        const channelName = document.querySelector('#owner #channel-name a')?.textContent.trim();
        const channelUrl = document.querySelector('#owner #channel-name a')?.href;
        const viewCount = document.querySelector('#info-container ytd-video-view-count-renderer')?.textContent.trim();
        const likeCount = document.querySelector('#segmented-like-button')?.getAttribute('aria-label')?.match(/\d+/)?.[0] || '0';
        const description = document.querySelector('#description-inline-expander')?.textContent.trim();
        const thumbnail = document.querySelector('.ytp-cued-thumbnail-overlay-image')?.style.backgroundImage.match(/url\("(.+)"\)/)?.[1];

        return {
            video_title: title || '',
            video_url: window.location.href,
            channel_name: channelName || '',
            channel_url: channelUrl || '',
            views: viewCount || '0',
            likes: likeCount + 'K',
            upload_date: document.querySelector('#info-container .ytd-video-primary-info-renderer:last-child')?.textContent.trim() || '',
            duration: document.querySelector('.ytp-time-duration')?.textContent.trim() || '',
            thumbnail_url: thumbnail || '',
            description: description || '',
        };
    });

    // Scroll to load comments
    await page.evaluate(async () => {
        const commentsSection = document.querySelector('#comments');
        commentsSection.scrollIntoView();
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    // Wait for comments to load
    await page.waitForSelector('ytd-comment-thread-renderer');

    // Extract comments
    const comments = await page.evaluate(async (maxComments) => {
        const commentElements = document.querySelectorAll('ytd-comment-thread-renderer');
        const results = [];

        for (let i = 0; i < Math.min(commentElements.length, maxComments); i++) {
            const comment = commentElements[i];
            
            const authorElement = comment.querySelector('#author-text');
            const contentElement = comment.querySelector('#content-text');
            const likesElement = comment.querySelector('#vote-count-middle');
            const timestampElement = comment.querySelector('.published-time-text');
            
            if (!authorElement || !contentElement) continue;

            // Get replies
            const replies = [];
            const replyElements = comment.querySelectorAll('ytd-comment-renderer.ytd-comment-replies-renderer');
            
            for (const reply of replyElements) {
                const replyAuthor = reply.querySelector('#author-text');
                const replyContent = reply.querySelector('#content-text');
                const replyLikes = reply.querySelector('#vote-count-middle');
                const replyTimestamp = reply.querySelector('.published-time-text');

                if (!replyAuthor || !replyContent) continue;

                replies.push({
                    username: replyAuthor.textContent.trim(),
                    user_url: replyAuthor.href || '',
                    comment: replyContent.textContent.trim(),
                    likes: parseInt(replyLikes?.textContent.trim() || '0'),
                    timestamp: replyTimestamp?.textContent.trim() || '',
                });
            }

            results.push({
                username: authorElement.textContent.trim(),
                user_url: authorElement.href || '',
                comment: contentElement.textContent.trim(),
                likes: parseInt(likesElement?.textContent.trim() || '0'),
                timestamp: timestampElement?.textContent.trim() || '',
                replies,
            });
        }

        return results;
    }, maxComments);

    return {
        source: 'video',
        ...videoInfo,
        top_comments: comments,
    };
} 