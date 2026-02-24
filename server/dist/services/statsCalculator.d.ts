import { TikTokVideoStats } from './ytdlpParser.js';
/**
 * Process new stats for a clip
 * Calculates earnings based on view difference and updates DB
 */
export declare function processClipStats(clipId: string, stats: TikTokVideoStats): Promise<{
    viewsDiff: number;
    additionalEarnings: number;
    isVerified: boolean;
} | null>;
