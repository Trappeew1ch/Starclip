interface VideoStats {
    views: number;
    likes: number;
    comments: number;
    title?: string;
    thumbnailUrl?: string;
}
export declare function getVideoStats(videoUrl: string, platform: string): Promise<VideoStats | null>;
export declare function updateAllClipStats(): Promise<void>;
export declare function scheduleStatsUpdate(): void;
export {};
