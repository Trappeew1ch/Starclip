import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

interface RapidApiStats {
    id: string;
    views: number;
    likes: number;
    comments: number;
    reposts: number;
    description: string;
    thumbnailUrl: string;
    title: string;
    isVerified: boolean;
}

/**
 * Extract Video ID from TikTok URL
 * Handles full URLs and short URLs (vt.tiktok.com)
 */
async function getTikTokVideoId(url: string): Promise<string | null> {
    try {
        // 1. Try to extract from URL if it's already a full URL
        const fullUrlMatch = url.match(/\/video\/(\d+)/);
        if (fullUrlMatch) {
            return fullUrlMatch[1];
        }

        // 2. If it's a short URL (vt.tiktok.com etc), resolve redirect
        if (url.includes('vt.tiktok.com') || url.includes('/t/')) {
            console.log(`🔄 Resolving short URL: ${url}`);

            const config: any = {
                maxRedirects: 5,
                validateStatus: (status: number) => status >= 200 && status < 400
            };

            // Use proxy if strictly needed for resolution (often TikTok blocks DC IPs)
            // But let's try without first, as axios might handle it if we fake UA
            if (process.env.YTDLP_PROXY) {
                const agent = new HttpsProxyAgent(process.env.YTDLP_PROXY);
                config.httpsAgent = agent;
                config.proxy = false; // Disable axios default proxy handling
            }

            const response = await axios.head(url, config);
            const resolvedUrl = response.request.res.responseUrl || response.headers.location;

            if (resolvedUrl) {
                console.log(`➡️ Resolved to: ${resolvedUrl}`);
                const match = resolvedUrl.match(/\/video\/(\d+)/);
                if (match) return match[1];
            }
        }

        return null;
    } catch (error) {
        console.error('Error extracting TikTok ID:', error);
        return null;
    }
}

/**
 * Fetch TikTok Stats using RapidAPI
 */
export async function getTikTokStatsRapid(url: string): Promise<RapidApiStats | null> {
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

        const response = await axios.get('https://tiktok-api23.p.rapidapi.com/api/post/detail', {
            params: { videoId },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost
            }
        });

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
    } catch (error: any) {
        console.error('❌ RapidAPI error:', error.response?.data || error.message);
        return null;
    }
}
