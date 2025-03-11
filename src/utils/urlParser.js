export const isHomePage = (url) => {
    return url.hostname === 'www.youtube.com' && url.pathname === '/';
};

export const isChannelPage = (url) => {
    return url.hostname === 'www.youtube.com' && (
        url.pathname.startsWith('/c/') ||
        url.pathname.startsWith('/channel/') ||
        url.pathname.startsWith('/user/')
    );
};

export const isVideoPage = (url) => {
    return url.hostname === 'www.youtube.com' && (
        url.pathname === '/watch' ||
        url.searchParams.has('v')
    );
};

export const isUserProfilePage = (url) => {
    return url.hostname === 'www.youtube.com' && (
        url.pathname.includes('/feed/subscriptions') ||
        url.pathname.includes('/feed/library') ||
        url.pathname.includes('/feed/history')
    );
}; 