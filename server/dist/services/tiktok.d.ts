interface TikTokTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    open_id: string;
    scope: string;
    token_type: string;
}
interface TikTokUserInfo {
    open_id: string;
    union_id: string;
    avatar_url: string;
    display_name: string;
    bio_description: string;
    profile_deep_link: string;
    is_verified: boolean;
    follower_count: number;
    following_count: number;
    likes_count: number;
    video_count: number;
}
interface TikTokVideoInfo {
    id: string;
    title: string;
    cover_image_url: string;
    share_url: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    share_count: number;
    create_time: number;
}
export declare function getAuthUrl(state: string): string;
export declare function exchangeCodeForToken(code: string): Promise<TikTokTokenResponse | null>;
export declare function refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse | null>;
export declare function getUserInfo(accessToken: string): Promise<TikTokUserInfo | null>;
export declare function getUserVideos(accessToken: string, cursor?: number, maxCount?: number): Promise<{
    videos: TikTokVideoInfo[];
    hasMore: boolean;
    cursor: number;
} | null>;
export declare function extractVideoId(url: string): string | null;
export declare function getVideoStats(accessToken: string, videoId: string): Promise<TikTokVideoInfo | null>;
export declare function queryVideoInfo(accessToken: string, videoIds: string[]): Promise<TikTokVideoInfo[] | null>;
export {};
