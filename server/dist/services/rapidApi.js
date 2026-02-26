import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
/**
 * Create the correct proxy agent based on the YTDLP_PROXY env variable.
 * Supports: socks5://user:pass@host:port, http://user:pass@host:port, or user:pass@host:port (defaults to socks5)
 */
function createProxyAgent() {
    const proxy = process.env.YTDLP_PROXY;
    if (!proxy)
        return null;
    // If it already has a protocol prefix, use as-is
    if (proxy.startsWith('socks5://') || proxy.startsWith('socks4://') || proxy.startsWith('socks://')) {
        return new SocksProxyAgent(proxy);
    }
    if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
        return new HttpsProxyAgent(proxy);
    }
    // No prefix — default to socks5 (most common for residential proxies)
    return new SocksProxyAgent(`socks5://${proxy}`);
}
/**
 * Extract Video ID from TikTok URL
 * Handles full URLs and short URLs (vt.tiktok.com, vm.tiktok.com)
 */
async function getTikTokVideoId(url) {
    try {
        // 1. Try to extract directly from URL if it already has /video/ or /photo/
        const fullUrlMatch = url.match(/\/(?:video|photo)\/(\d+)/);
        if (fullUrlMatch) {
            return fullUrlMatch[1];
        }
        // 2. Short URL — follow redirects to find the real video URL
        if (url.includes('tiktok.com') || url.includes('/t/')) {
            console.log(`🔄 Resolving short URL: ${url}`);
            let currentUrl = url;
            for (let i = 0; i < 5; i++) {
                try {
                    const response = await axios.get(currentUrl, {
                        maxRedirects: 0,
                        validateStatus: (status) => status >= 200 && status < 400,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        },
                        timeout: 8000
                    });
                    if (response.status >= 300 && response.status < 400) {
                        const location = response.headers.location;
                        if (location) {
                            currentUrl = location.startsWith('/')
                                ? new URL(location, currentUrl).href
                                : location;
                            console.log(`➡️ Redirected to: ${currentUrl}`);
                            const match = currentUrl.match(/\/(?:video|photo)\/(\d+)/);
                            if (match)
                                return match[1];
                            const vMatch = currentUrl.match(/[?&]v=(\d+)/) || currentUrl.match(/\/v\/(\d+)/);
                            if (vMatch)
                                return vMatch[1];
                        }
                        else {
                            break;
                        }
                    }
                    else {
                        // Final destination
                        const match = currentUrl.match(/\/(?:video|photo)\/(\d+)/);
                        if (match)
                            return match[1];
                        break;
                    }
                }
                catch (stepErr) {
                    console.error(`Redirect step ${i} failed:`, stepErr.message);
                    break;
                }
            }
        }
        return null;
    }
    catch (error) {
        console.error('Error extracting TikTok ID:', error.message);
        return null;
    }
}
/**
 * Fetch TikTok Stats using RapidAPI
 */
export async function getTikTokStatsRapid(url) {
    try {
        const videoId = await getTikTokVideoId(url);
        if (!videoId) {
            console.error('❌ Could not extract video ID from:', url);
            return null;
        }
        const apiKey = process.env.RAPIDAPI_KEY;
        const apiHost = process.env.RAPIDAPI_HOST || 'tiktok-api23.p.rapidapi.com';
        if (!apiKey) {
            console.error('❌ RAPIDAPI_KEY is missing');
            return null;
        }
        console.log(`🚀 Fetching stats from RapidAPI for ID: ${videoId}`);
        const urlWithParams = new URL(`https://${apiHost}/api/post/detail`);
        urlWithParams.searchParams.append('videoId', videoId);
        const config = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost,
                'Host': apiHost,
                'Accept': 'application/json'
            }
        };
        const agent = createProxyAgent();
        if (agent) {
            config.agent = agent; // Node-fetch uses 'agent' (not httpsAgent)
            console.log('🌐 Using proxy for RapidAPI request');
        }
        // We use native fetch here instead of axios because axios + socks-proxy-agent
        // sometimes sends absolute URIs (GET https://...) in the HTTP request line
        // which Nginx on RapidAPI rejects with 400 Bad Request. Fetch sends correct relative paths.
        const response = await fetch(urlWithParams.toString(), config);
        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ RapidAPI HTTP Error: ${response.status} ${response.statusText}`, errText);
            return null;
        }
        const data = await response.json();
        const item = data?.itemInfo?.itemStruct;
        if (!item) {
            console.error('❌ RapidAPI returned no item info');
            return null;
        }
        const stats = item.stats;
        return {
            id: item.id,
            views: parseInt(stats.playCount) || 0,
            likes: parseInt(stats.diggCount) || 0,
            comments: parseInt(stats.commentCount) || 0,
            reposts: parseInt(stats.shareCount) || 0,
            description: item.desc || '',
            thumbnailUrl: item.video?.cover || item.video?.originCover || '',
            title: item.desc || '',
            isVerified: false
        };
    }
    catch (error) {
        console.error('❌ RapidAPI error:', error.message);
        return null;
    }
}
