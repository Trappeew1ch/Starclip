import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
/**
 * Extract Video ID from TikTok URL
 * Handles full URLs and short URLs (vt.tiktok.com)
 */
async function getTikTokVideoId(url) {
    try {
        // 1. Try to extract from URL if it's already a full URL
        const fullUrlMatch = url.match(/\/(?:video|photo)\/(\d+)/);
        if (fullUrlMatch) {
            return fullUrlMatch[1];
        }
        // 2. If it's a short URL (or didn't match regex), try to resolve it
        if (url.includes('tiktok.com') || url.includes('/t/')) {
            console.log(`🔄 Resolving short URL: ${url}`);
            try {
                let currentUrl = url;
                // Follow up to 3 redirects manually to extract the video ID without executing anti-bot JS
                for (let i = 0; i < 3; i++) {
                    const config = {
                        method: 'GET',
                        maxRedirects: 0, // Manual redirect handling
                        validateStatus: (status) => status >= 200 && status < 400,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        }
                    };
                    if (process.env.YTDLP_PROXY) {
                        const agent = new HttpsProxyAgent(process.env.YTDLP_PROXY);
                        config.httpsAgent = agent;
                        config.proxy = false;
                    }
                    const response = await axios.get(currentUrl, config);
                    if (response.status >= 300 && response.status < 400) {
                        const location = response.headers.location;
                        if (location) {
                            currentUrl = location.startsWith('/') ? new URL(location, currentUrl).href : location;
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
                        // Reached final URL (200 OK) or error
                        const match = currentUrl.match(/\/(?:video|photo)\/(\d+)/);
                        if (match)
                            return match[1];
                        break;
                    }
                }
            }
            catch (err) {
                console.error('Fetch redirect error for TikTok:', err);
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
        const config = {
            params: { videoId },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost
            }
        };
        if (process.env.YTDLP_PROXY) {
            const agent = new HttpsProxyAgent(process.env.YTDLP_PROXY);
            config.httpsAgent = agent;
            config.proxy = false;
        }
        const response = await axios.get(`https://${apiHost}/api/post/detail`, config);
        const data = response.data;
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
            reposts: parseInt(stats.shareCount) || 0, // RapidAPI mapping: shareCount usually used for reposts/shares
            description: item.desc || '',
            thumbnailUrl: item.video?.cover || item.video?.originCover || '',
            title: item.desc || '',
            isVerified: false // Will be verified by hashtag check in worker
        };
    }
    catch (error) {
        console.error('❌ RapidAPI error:', error.response?.data || error.message);
        return null;
    }
}
