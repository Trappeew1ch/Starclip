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
export declare function getTikTokStats(url: string): Promise<TikTokVideoStats | null>;
/**
 * Parse YouTube Shorts stats using yt-dlp
 */
export declare function getYouTubeStats(url: string): Promise<TikTokVideoStats | null>;
/**
 * Check if description contains the verification hashtag
 */
export declare function verifyHashtag(description: string, expectedHashtag: string): boolean;
/**
 * Generate a unique verification code for a user
 * Format: #SC-{random_6_chars}
 */
export declare function generateUserVerificationCode(): string;
/**
 * Check if description ENDS with the verification hashtag strictly
 * Ignores whitespace/newlines at the very end
 */
export declare function verifyStrictHashtag(description: string, expectedHashtag: string): boolean;
