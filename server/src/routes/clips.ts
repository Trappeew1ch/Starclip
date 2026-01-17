import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Detect platform from URL
function detectPlatform(url: string): string | null {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    return null;
}

// Get user's clips
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { offerId, status } = req.query;

        const where: any = { userId: req.user!.id };
        if (offerId) where.offerId = offerId;
        if (status) where.status = status;

        const clips = await prisma.clip.findMany({
            where,
            include: { offer: true },
            orderBy: { createdAt: 'desc' }
        });

        const clipsFormatted = clips.map(clip => ({
            id: clip.id,
            accountId: clip.platform, // Use platform as accountId for filtering
            campaignId: clip.offerId,
            title: clip.title || `Клип для ${clip.offer.name}`,
            thumbnailUrl: clip.thumbnailUrl || 'https://imgur.com/6mIWjbX.png',
            views: clip.views > 1000 ? `${(clip.views / 1000).toFixed(1)}K` : clip.views.toString(),
            status: clip.status === 'approved' ? 'published' : clip.status === 'rejected' ? 'rejected' : 'processing',
            date: formatDate(clip.createdAt),
            platform: clip.platform,
            videoUrl: clip.videoUrl,
            aiData: clip.status === 'approved' ? {
                score: 85,
                category: 'Content',
                verdict: 'accepted'
            } : clip.status === 'rejected' ? {
                score: 20,
                category: 'Unknown',
                verdict: 'rejected',
                rejectionReason: clip.rejectionReason || 'Не соответствует требованиям',
                comment: 'Клип отклонён модератором'
            } : undefined
        }));

        res.json(clipsFormatted);
    } catch (error) {
        console.error('Get clips error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit new clip
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { videoUrl, offerId } = req.body;

        if (!videoUrl || !offerId) {
            return res.status(400).json({ error: 'videoUrl and offerId are required' });
        }

        // Detect platform
        const platform = detectPlatform(videoUrl);
        if (!platform) {
            return res.status(400).json({
                error: 'Unsupported platform. Use YouTube, TikTok, or Instagram links.'
            });
        }

        // Check if user has joined this campaign
        const campaign = await prisma.userCampaign.findUnique({
            where: {
                userId_offerId: {
                    userId: req.user!.id,
                    offerId
                }
            }
        });

        if (!campaign) {
            return res.status(400).json({
                error: 'You must join this campaign first'
            });
        }

        // Create clip
        const clip = await prisma.clip.create({
            data: {
                userId: req.user!.id,
                offerId,
                videoUrl,
                platform,
                status: 'pending'
            },
            include: { offer: true }
        });

        res.json({
            message: 'Clip submitted for review',
            clip: {
                id: clip.id,
                videoUrl: clip.videoUrl,
                platform: clip.platform,
                status: clip.status,
                createdAt: clip.createdAt
            }
        });
    } catch (error) {
        console.error('Submit clip error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single clip details
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const clip = await prisma.clip.findUnique({
            where: { id: req.params.id as string },
            include: { offer: true }
        });

        if (!clip || clip.userId !== req.user!.id) {
            return res.status(404).json({ error: 'Clip not found' });
        }

        res.json(clip);
    } catch (error) {
        console.error('Get clip error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

function formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн.`;
    return date.toLocaleDateString('ru-RU');
}

export default router;
