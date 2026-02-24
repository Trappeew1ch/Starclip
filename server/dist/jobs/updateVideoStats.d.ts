/**
 * Update stats for all approved TikTok/YouTube clips using yt-dlp
 * Runs every 10 minutes
 */
export declare function updateClipsWithYtdlp(): Promise<{
    updatedCount: number;
    verifiedCount: number;
    earningsAdded: number;
}>;
/**
 * Start the scheduler to run every 10 minutes
 */
export declare function startYtdlpStatsScheduler(): void;
export { updateClipsWithYtdlp as updateTikTokClipsStats };
export { startYtdlpStatsScheduler as startStatsUpdateScheduler };
