export function isSearchPage(url) {
    return url.pathname === '/results' && url.searchParams.has('search_query');
}

export function isChannelPage(url) {
    return url.pathname.startsWith('/@') || 
           url.pathname.startsWith('/c/') || 
           url.pathname.startsWith('/channel/');
}

export function isVideoPage(url) {
    return url.pathname === '/watch' && url.searchParams.has('v');
}

export function isUserProfilePage(url) {
    return url.pathname === '/profile';
} 