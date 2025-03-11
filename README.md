# YouTube Scraper - Apify Actor

A powerful YouTube scraper that extracts structured data from various YouTube pages including homepage, channels, videos, and user profiles.

## Features

- 🏠 **Homepage Scraping**: Extract trending and recommended videos
- 📺 **Channel Scraping**: Get channel details and latest videos
- 🎥 **Video Scraping**: Extract video metadata and top comments
- 👤 **User Profile Scraping**: Get subscriptions and watch history
- 🔄 **Automatic Page Type Detection**: Intelligently identifies the type of YouTube page

## Input Configuration

```json
{
    "startUrls": [
        { "url": "https://www.youtube.com/" }
    ],
    "maxVideos": 50,
    "maxComments": 100,
    "sortBy": "popular",
    "useProxy": true
}
```

### Input Parameters

- `startUrls` (required): Array of YouTube URLs to scrape
- `maxVideos` (optional): Maximum number of videos to scrape per page/channel (default: 50)
- `maxComments` (optional): Maximum number of comments to scrape per video (default: 100)
- `sortBy` (optional): Sort order for videos and comments (options: "popular", "recent", "mostViewed")
- `useProxy` (optional): Whether to use Apify Proxy (default: true)

## Output Format

The scraper produces structured JSON data based on the page type:

### Homepage Output
```json
{
    "source": "homepage",
    "videos": [
        {
            "title": "Video Title",
            "video_url": "https://www.youtube.com/watch?v=...",
            "channel_name": "Channel Name",
            "channel_url": "https://www.youtube.com/c/...",
            "views": "1.2M",
            "upload_date": "2 days ago",
            "duration": "10:30",
            "thumbnail_url": "https://i.ytimg.com/..."
        }
    ]
}
```

### Channel Output
```json
{
    "source": "channel",
    "channel_name": "Channel Name",
    "channel_url": "https://www.youtube.com/c/...",
    "subscribers": "1.2M",
    "total_videos": 100,
    "description": "Channel description...",
    "latest_videos": [
        {
            "title": "Video Title",
            "video_url": "https://www.youtube.com/watch?v=...",
            "views": "500K",
            "upload_date": "1 day ago",
            "duration": "15:45",
            "thumbnail_url": "https://i.ytimg.com/..."
        }
    ]
}
```

### Video Output
```json
{
    "source": "video",
    "video_title": "Video Title",
    "video_url": "https://www.youtube.com/watch?v=...",
    "channel_name": "Channel Name",
    "channel_url": "https://www.youtube.com/c/...",
    "views": "1M",
    "likes": "50K",
    "upload_date": "2023-01-01",
    "duration": "12:34",
    "thumbnail_url": "https://i.ytimg.com/...",
    "description": "Video description...",
    "top_comments": [
        {
            "username": "User",
            "user_url": "https://www.youtube.com/channel/...",
            "comment": "Great video!",
            "likes": 100,
            "timestamp": "2 hours ago",
            "replies": [
                {
                    "username": "Another User",
                    "user_url": "https://www.youtube.com/channel/...",
                    "comment": "Thanks!",
                    "likes": 10,
                    "timestamp": "1 hour ago"
                }
            ]
        }
    ]
}
```

### User Profile Output
```json
{
    "source": "user_profile",
    "username": "User Name",
    "profile_url": "https://www.youtube.com/channel/...",
    "subscribed_channels": [
        {
            "channel_name": "Channel Name",
            "channel_url": "https://www.youtube.com/c/..."
        }
    ],
    "recently_watched": [
        {
            "title": "Video Title",
            "video_url": "https://www.youtube.com/watch?v=...",
            "channel_name": "Channel Name",
            "channel_url": "https://www.youtube.com/c/..."
        }
    ]
}
```

## Usage

1. Create a new task in Apify Console
2. Set your input configuration
3. Run the actor and wait for results
4. Download the data in JSON format

## Limitations

- Requires JavaScript to be enabled
- Some data might be rate-limited by YouTube
- User profile scraping requires authentication
- Results may vary based on region and YouTube's A/B testing

## Dependencies

- Node.js 16+
- Playwright for web scraping
- Apify SDK for actor implementation

## License

MIT License 