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
 * Fetch TikTok Stats using RapidAPI
 */
export declare function getTikTokStatsRapid(url: string): Promise<RapidApiStats | null>;
export {};
