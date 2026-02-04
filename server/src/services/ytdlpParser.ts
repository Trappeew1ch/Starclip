import { getTikTokStatsRapid } from './rapidApi.js';

export interface TikTokVideoStats {
    id: string;
    views: number;
    likes: number;
    comments: number;
    reposts: number;
    description: string;
    uploader: string;
    uploaderUrl: string;
    thumbnailUrl: string;
    title: string;
    duration: number;
}

/**
 * Parse TikTok/YouTube stats
 * Uses RapidAPI for TikTok, yt-dlp for others
 */
export async function getTikTokStats(url: string): Promise<TikTokVideoStats | null> {
    // Check if it's a TikTok URL
    if (url.includes('tiktok.com')) {
        try {
            const rapidStats = await getTikTokStatsRapid(url);
            if (rapidStats) {
                return {
                    ...rapidStats,
                    uploader: '', // RapidAPI might not return uploader name in the same way, optional
                    uploaderUrl: '',
                    duration: 0
                };
            }
        } catch (error) {
            console.error('⚠️ RapidAPI failed:', error);
        }
    }

    // yt-dlp support removed as per request
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        console.warn(`⚠️ YouTube stats fetching is currently disabled (yt-dlp removed). URL: ${url}`);
    }

    return null;
}

/**
 * Parse YouTube Shorts stats using yt-dlp
 */
export async function getYouTubeStats(url: string): Promise<TikTokVideoStats | null> {
    return getTikTokStats(url); // Same logic works for YouTube
}

/**
 * Check if description contains the verification hashtag
 */
export function verifyHashtag(description: string, expectedHashtag: string): boolean {
    if (!expectedHashtag) return false;
    // Case-insensitive search
    return description.toLowerCase().includes(expectedHashtag.toLowerCase());
}

/**
 * Generate a unique verification code for a clip
 * Format: #SC_{offerId_prefix}_{random}
 */
export function generateVerificationCode(offerId: string): string {
    const prefix = offerId.slice(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `#SC_${prefix}_${random}`;
}
