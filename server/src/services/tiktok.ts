// Using native fetch (Node.js 18+)

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || '';
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'https://starclip.site/api/tiktok/callback';

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

// Generate OAuth authorization URL
export function getAuthUrl(state: string): string {
    const scopes = [
        'user.info.basic',
        'user.info.profile',
        'user.info.stats',
        'video.list'
    ].join(',');

    const params = new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        scope: scopes,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        state: state
    });

    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForToken(code: string): Promise<TikTokTokenResponse | null> {
    try {
        const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_key: TIKTOK_CLIENT_KEY,
                client_secret: TIKTOK_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI
            })
        });

        const data = await response.json() as any;

        if (data.error) {
            console.error('TikTok token exchange error:', data);
            return null;
        }

        return data as TikTokTokenResponse;
    } catch (error) {
        console.error('TikTok token exchange failed:', error);
        return null;
    }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse | null> {
    try {
        const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_key: TIKTOK_CLIENT_KEY,
                client_secret: TIKTOK_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });

        const data = await response.json() as any;

        if (data.error) {
            console.error('TikTok token refresh error:', data);
            return null;
        }

        return data as TikTokTokenResponse;
    } catch (error) {
        console.error('TikTok token refresh failed:', error);
        return null;
    }
}

// Get user info from TikTok
export async function getUserInfo(accessToken: string): Promise<TikTokUserInfo | null> {
    try {
        const response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json() as any;

        if (data.error) {
            console.error('TikTok user info error:', data);
            return null;
        }

        return data.data?.user as TikTokUserInfo;
    } catch (error) {
        console.error('TikTok get user info failed:', error);
        return null;
    }
}

// Get user's videos list
export async function getUserVideos(accessToken: string, cursor?: number, maxCount: number = 20): Promise<{ videos: TikTokVideoInfo[], hasMore: boolean, cursor: number } | null> {
    try {
        const params: any = {
            fields: 'id,title,cover_image_url,share_url,view_count,like_count,comment_count,share_count,create_time'
        };

        if (cursor) params.cursor = cursor;
        if (maxCount) params.max_count = maxCount;

        const url = new URL('https://open.tiktokapis.com/v2/video/list/');
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json() as any;

        if (data.error) {
            console.error('TikTok videos list error:', data);
            return null;
        }

        return {
            videos: data.data?.videos || [],
            hasMore: data.data?.has_more || false,
            cursor: data.data?.cursor || 0
        };
    } catch (error) {
        console.error('TikTok get videos failed:', error);
        return null;
    }
}

// Extract video ID from TikTok URL
export function extractVideoId(url: string): string | null {
    // Formats:
    // https://www.tiktok.com/@username/video/1234567890123456789
    // https://vm.tiktok.com/ZMxxxxxxxx/
    // https://www.tiktok.com/t/ZTxxxxxxxx/

    const patterns = [
        /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
        /tiktok\.com\/.*\/video\/(\d+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

// Get video stats by ID (using user's video list since TikTok doesn't have direct video info endpoint)
export async function getVideoStats(accessToken: string, videoId: string): Promise<TikTokVideoInfo | null> {
    try {
        // TikTok API requires fetching user's video list and finding the video
        let cursor: number | undefined;
        let hasMore = true;

        while (hasMore) {
            const result = await getUserVideos(accessToken, cursor, 50);
            if (!result) return null;

            const video = result.videos.find(v => v.id === videoId);
            if (video) return video;

            hasMore = result.hasMore;
            cursor = result.cursor;

            // Safety limit
            if (cursor && cursor > 500) break;
        }

        return null;
    } catch (error) {
        console.error('TikTok get video stats failed:', error);
        return null;
    }
}

// Query video info directly (alternative method using video query endpoint)
export async function queryVideoInfo(accessToken: string, videoIds: string[]): Promise<TikTokVideoInfo[] | null> {
    try {
        const response = await fetch('https://open.tiktokapis.com/v2/video/query/?fields=id,title,cover_image_url,share_url,view_count,like_count,comment_count,share_count,create_time', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filters: {
                    video_ids: videoIds
                }
            })
        });

        const data = await response.json() as any;

        if (data.error) {
            console.error('TikTok video query error:', data);
            return null;
        }

        return data.data?.videos || [];
    } catch (error) {
        console.error('TikTok query video info failed:', error);
        return null;
    }
}
