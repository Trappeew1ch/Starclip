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
 * Fetch TikTok Stats using RapidAPI.
 * Uses Node.js https module directly to properly support proxy agents.
 */
export declare function getTikTokStatsRapid(url: string): Promise<RapidApiStats | null>;
export {};
