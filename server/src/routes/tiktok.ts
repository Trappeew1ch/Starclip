import { Router, Response } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import * as tiktokService from '../services/tiktok.js';
import crypto from 'crypto';

const router = Router();

// Store state tokens temporarily (in production, use Redis or DB)
const stateTokens = new Map<string, { telegramId: string; expiresAt: number }>();

// Get OAuth authorization URL
router.get('/auth-url', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        // Generate unique state token
        const state = crypto.randomBytes(16).toString('hex');

        // Store state with user's telegramId (expires in 10 minutes)
        stateTokens.set(state, {
            telegramId: req.user!.telegramId.toString(),
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        const authUrl = tiktokService.getAuthUrl(state);

        res.json({ authUrl, state });
    } catch (error) {
        console.error('TikTok auth URL error:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
});

// OAuth callback (called by TikTok after user authorizes)
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;

        if (error) {
            console.error('TikTok OAuth error:', error, error_description);
            return res.redirect(`/tiktok-error?error=${encodeURIComponent(error_description as string || 'Authorization failed')}`);
        }

        if (!code || !state) {
            return res.redirect('/tiktok-error?error=Missing authorization code');
        }

        // Verify state token
        const storedState = stateTokens.get(state as string);
        if (!storedState || storedState.expiresAt < Date.now()) {
            stateTokens.delete(state as string);
            return res.redirect('/tiktok-error?error=Invalid or expired state token');
        }

        stateTokens.delete(state as string);

        // Exchange code for tokens
        const tokenResponse = await tiktokService.exchangeCodeForToken(code as string);
        if (!tokenResponse) {
            return res.redirect('/tiktok-error?error=Failed to exchange authorization code');
        }

        // Get user info from TikTok
        const userInfo = await tiktokService.getUserInfo(tokenResponse.access_token);
        if (!userInfo) {
            return res.redirect('/tiktok-error?error=Failed to get TikTok user info');
        }

        // Find user by telegramId
        const user = await prisma.user.findFirst({
            where: { telegramId: BigInt(storedState.telegramId) }
        });

        if (!user) {
            return res.redirect('/tiktok-error?error=User not found');
        }

        // Calculate token expiration
        const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

        // Create or update social account
        await prisma.socialAccount.upsert({
            where: {
                userId_platform: {
                    userId: user.id,
                    platform: 'tiktok'
                }
            },
            update: {
                platformUserId: tokenResponse.open_id,
                accountName: userInfo.display_name,
                profileUrl: userInfo.profile_deep_link,
                followers: userInfo.follower_count,
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token,
                tokenExpiresAt: expiresAt,
                isConnected: true
            },
            create: {
                userId: user.id,
                platform: 'tiktok',
                platformUserId: tokenResponse.open_id,
                accountName: userInfo.display_name,
                profileUrl: userInfo.profile_deep_link,
                followers: userInfo.follower_count,
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token,
                tokenExpiresAt: expiresAt,
                isConnected: true
            }
        });

        // Redirect to success page in mini app
        res.redirect('/tiktok-success');
    } catch (error) {
        console.error('TikTok callback error:', error);
        res.redirect('/tiktok-error?error=Server error');
    }
});

// Get connected TikTok account info
router.get('/account', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const account = await prisma.socialAccount.findFirst({
            where: {
                userId: req.user!.id,
                platform: 'tiktok'
            }
        });

        if (!account) {
            return res.json({ connected: false });
        }

        // Check if token needs refresh
        if (account.tokenExpiresAt && account.tokenExpiresAt < new Date() && account.refreshToken) {
            const newTokens = await tiktokService.refreshAccessToken(account.refreshToken);
            if (newTokens) {
                await prisma.socialAccount.update({
                    where: { id: account.id },
                    data: {
                        accessToken: newTokens.access_token,
                        refreshToken: newTokens.refresh_token,
                        tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000)
                    }
                });
            }
        }

        res.json({
            connected: true,
            accountName: account.accountName,
            profileUrl: account.profileUrl,
            followers: account.followers
        });
    } catch (error) {
        console.error('Get TikTok account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Disconnect TikTok account
router.post('/disconnect', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        await prisma.socialAccount.deleteMany({
            where: {
                userId: req.user!.id,
                platform: 'tiktok'
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Disconnect TikTok error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get video stats for a TikTok URL
router.post('/video-stats', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { videoUrl } = req.body;

        if (!videoUrl) {
            return res.status(400).json({ error: 'Video URL is required' });
        }

        // Get user's TikTok account
        const account = await prisma.socialAccount.findFirst({
            where: {
                userId: req.user!.id,
                platform: 'tiktok',
                isConnected: true
            }
        });

        if (!account || !account.accessToken) {
            return res.status(400).json({ error: 'TikTok account not connected' });
        }

        // Extract video ID
        const videoId = tiktokService.extractVideoId(videoUrl);
        if (!videoId) {
            return res.status(400).json({ error: 'Invalid TikTok video URL' });
        }

        // Try to get video stats using query endpoint first
        const videos = await tiktokService.queryVideoInfo(account.accessToken, [videoId]);

        if (videos && videos.length > 0) {
            const video = videos[0];
            return res.json({
                videoId: video.id,
                title: video.title,
                views: video.view_count,
                likes: video.like_count,
                comments: video.comment_count,
                shares: video.share_count,
                thumbnailUrl: video.cover_image_url
            });
        }

        // Fallback: search in user's videos
        const videoStats = await tiktokService.getVideoStats(account.accessToken, videoId);

        if (!videoStats) {
            return res.status(404).json({ error: 'Video not found or not accessible' });
        }

        res.json({
            videoId: videoStats.id,
            title: videoStats.title,
            views: videoStats.view_count,
            likes: videoStats.like_count,
            comments: videoStats.comment_count,
            shares: videoStats.share_count,
            thumbnailUrl: videoStats.cover_image_url
        });
    } catch (error) {
        console.error('Get video stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
