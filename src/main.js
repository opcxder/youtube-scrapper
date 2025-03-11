import { Actor } from 'apify';
import { PlaywrightCrawler, RequestList } from 'crawlee';
import { URL } from 'url';

// Utility functions
import {
    isHomePage,
    isChannelPage,
    isVideoPage,
    isUserProfilePage,
} from './utils/urlParser.js';

import {
    scrapeHomePage,
    scrapeChannelPage,
    scrapeVideoPage,
    scrapeUserProfilePage,
} from './scrapers/index.js';

// Register exit handler for cleanup
Actor.on('exit', async ({ exitCode, statusMessage }) => {
    if (exitCode === 0) {
        console.log(`Finished successfully: ${statusMessage}`);
    } else {
        console.error(`Failed with status: ${statusMessage}`);
    }
});

// Use Actor.main() which handles init() and exit() automatically
Actor.main(async () => {
    console.log('YouTube scraper starting...');
    
    try {
        const input = await Actor.getInput() || {};
        
        const {
            startUrls = [{ url: 'https://www.youtube.com/' }],
            maxVideos = 50,
            maxComments = 100,
            sortBy = 'popular',
            useProxy = true,
        } = input;

        // Save input to key-value store for debugging
        await Actor.setValue('INPUT', input);

        const proxyConfiguration = useProxy
            ? await Actor.createProxyConfiguration()
            : undefined;

        // Initialize RequestList
        const requestList = await RequestList.open('youtube-list', startUrls);

        const crawler = new PlaywrightCrawler({
            requestList,
            proxyConfiguration,
            maxConcurrency: 1, // Reduced for stability
            launchContext: {
                launchOptions: {
                    headless: true,
                    args: [
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--no-sandbox',
                        '--disable-setuid-sandbox'
                    ],
                    channel: 'chromium', // Explicitly set chromium channel
                },
            },
            browserPoolOptions: {
                useFingerprints: false, // Disable fingerprinting
                preLaunchHooks: [
                    async (browserController) => {
                        const { context } = browserController;
                        if (context) {
                            await context.clearCookies();
                        }
                    },
                ],
            },
            async requestHandler({ page, request, log }) {
                // Set default timeout to 30 seconds
                page.setDefaultTimeout(30000);
                
                log.info(`Processing ${request.url}...`);
                
                // Detect page type
                const url = new URL(request.url);
                let data;

                try {
                    if (isHomePage(url)) {
                        data = await scrapeHomePage(page, maxVideos);
                    } else if (isChannelPage(url)) {
                        data = await scrapeChannelPage(page, maxVideos);
                    } else if (isVideoPage(url)) {
                        data = await scrapeVideoPage(page, maxComments);
                    } else if (isUserProfilePage(url)) {
                        data = await scrapeUserProfilePage(page);
                    } else {
                        log.warning('Unknown page type:', request.url);
                        return;
                    }

                    // Save the data to dataset
                    await Actor.pushData({
                        url: request.url,
                        ...data,
                        scrapedAt: new Date().toISOString(),
                    });

                    // Save last successful scrape info to key-value store
                    await Actor.setValue('LAST_SCRAPE', {
                        url: request.url,
                        timestamp: new Date().toISOString(),
                        type: data.source
                    });

                } catch (error) {
                    log.error('Scraping failed:', error.message);
                    // Save error information to key-value store
                    await Actor.setValue('LAST_ERROR', {
                        url: request.url,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    throw error;
                }
            },

            async failedRequestHandler({ request, error, log }) {
                log.error(`Request ${request.url} failed:\n${error}`);
                await Actor.setValue('FAILED_REQUESTS', {
                    url: request.url,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            },
        });
        
        // Run the crawler
        await crawler.run();
        
        // Set successful exit status
        return 'Scraping finished successfully!';
    } catch (error) {
        // If something goes wrong, fail the actor
        await Actor.fail(`Scraping failed: ${error.message}`);
    }
}); 