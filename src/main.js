import { Actor } from 'apify';
import { PlaywrightCrawler, RequestList } from 'crawlee';
import { URL } from 'url';
import fs from 'fs';

// Utility functions
import {
    isChannelPage,
    isVideoPage,
    isUserProfilePage,
    isSearchPage,
} from './utils/urlParser.js';

import {
    scrapeChannelPage,
    scrapeVideoPage,
    scrapeUserProfilePage,
    scrapeSearchPage,
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
        // Read input from file
        let input = {};
        try {
            const inputFile = process.env.APIFY_INPUT_FILE || 'input.json';
            const inputData = fs.readFileSync(inputFile, 'utf8');
            input = JSON.parse(inputData);
            console.log('Successfully read input from file:', inputFile);
        } catch (e) {
            console.log('No input file found, using defaults');
        }
        
        const {
            startUrls = [],
            searchQueries = ['trending videos'],
            maxVideos = 5,
            maxComments = 5,
            sortBy = 'popular',
            useProxy = false,
        } = input;

        // If no startUrls provided, create them from search queries
        const urls = startUrls.length > 0 ? startUrls : 
            searchQueries.map(query => ({
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
            }));

        console.log('Input configuration:', {
            maxVideos,
            maxComments,
            sortBy,
            useProxy,
            urls: urls.map(u => u.url),
            searchQueries
        });

        // Validate input
        if (maxVideos < 1 || maxVideos > 1000) {
            throw new Error('maxVideos must be between 1 and 1000');
        }
        if (maxComments < 0 || maxComments > 500) {
            throw new Error('maxComments must be between 0 and 500');
        }

        // Save input to key-value store for debugging
        await Actor.setValue('INPUT', input);

        const proxyConfiguration = useProxy
            ? await Actor.createProxyConfiguration()
            : undefined;

        // Initialize RequestList
        const requestList = await RequestList.open('youtube-list', urls);

        const crawler = new PlaywrightCrawler({
            requestList,
            proxyConfiguration,
            maxConcurrency: 1,
            launchContext: {
                launchOptions: {
                    headless: true,
                    args: [
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security',
                        '--disable-features=IsolateOrigins,site-per-process',
                        '--window-size=1280,800'
                    ],
                    channel: 'chromium',
                },
            },
            browserPoolOptions: {
                useFingerprints: false,
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
                    // Wait for network to be idle
                    await page.waitForLoadState('networkidle');

                    if (isSearchPage(url)) {
                        data = await scrapeSearchPage(page, maxVideos);
                        log.info(`Found ${data.videos.length} videos in search results`);
                    } else if (isChannelPage(url)) {
                        data = await scrapeChannelPage(page, maxVideos);
                        log.info(`Found ${data.latest_videos.length} videos on channel`);
                    } else if (isVideoPage(url)) {
                        data = await scrapeVideoPage(page, maxComments);
                        log.info(`Found ${data.top_comments?.length || 0} comments on video`);
                    } else if (isUserProfilePage(url)) {
                        data = await scrapeUserProfilePage(page);
                        log.info(`Found ${data.subscribed_channels.length} subscribed channels`);
                    } else {
                        log.warning('Unknown page type:', url.toString());
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