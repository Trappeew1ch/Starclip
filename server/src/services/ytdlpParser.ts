import { spawn } from 'child_process';

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
 * Parse TikTok video stats using yt-dlp
 * No API key or auth required
 */
export async function getTikTokStats(url: string): Promise<TikTokVideoStats | null> {
    return new Promise((resolve) => {
        const proc = spawn('yt-dlp', [
            '--dump-json',
            '--no-download',
            '--no-warnings',
            url
        ]);

        let output = '';
        let errorOutput = '';

        proc.stdout.on('data', (data) => {
            output += data.toString();
        });

        proc.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        proc.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp error for ${url}:`, errorOutput);
                return resolve(null);
            }

            try {
                const json = JSON.parse(output);
                resolve({
                    id: json.id || '',
                    views: json.view_count || 0,
                    likes: json.like_count || 0,
                    comments: json.comment_count || 0,
                    reposts: json.repost_count || 0,
                    description: json.description || '',
                    uploader: json.uploader || json.creator || '',
                    uploaderUrl: json.uploader_url || json.channel_url || '',
                    thumbnailUrl: json.thumbnail || '',
                    title: json.title || json.fulltitle || '',
                    duration: json.duration || 0
                });
            } catch (parseError) {
                console.error(`yt-dlp JSON parse error for ${url}:`, parseError);
                resolve(null);
            }
        });

        proc.on('error', (err) => {
            console.error(`yt-dlp spawn error:`, err);
            resolve(null);
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            proc.kill('SIGTERM');
            console.error(`yt-dlp timeout for ${url}`);
            resolve(null);
        }, 30000);
    });
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
