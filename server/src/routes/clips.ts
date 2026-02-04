import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { generateUserVerificationCode, getTikTokStats, verifyStrictHashtag } from '../services/ytdlpParser.js';
import { processClipStats } from '../services/statsCalculator.js';

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
        if (req.user) {
            console.log(`🎥 Fetching clips for User ${req.user.id} (offerId=${offerId || 'all'}, status=${status || 'all'})`);
        }

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
            verificationCode: clip.verificationCode,
            isVerified: clip.isVerified,
            earnedAmount: clip.earnedAmount,
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

        // Check for duplicate video URL
        const existingClip = await prisma.clip.findFirst({
            where: { videoUrl }
        });

        if (existingClip) {
            return res.status(400).json({ error: 'This video has already been submitted' });
        }

        // Get or generate User Verification Code
        let user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        let verificationCode = user?.verificationCode;

        if (!verificationCode) {
            verificationCode = generateUserVerificationCode();
            await prisma.user.update({
                where: { id: req.user!.id },
                data: { verificationCode }
            });
        }

        // PRE-VALIDATION: Check description immediately using background fetch if possible, 
        // OR rely on client to confirm?
        // User requeset: "Мы запрашиваем сразу данные о видео... если в конце нет кода... мы отклоняем видео сразу и даём ему уведомление"
        // This implies we MUST fetch stats NOW.

        let stats = null;
        try {
            if (platform === 'tiktok') {
                stats = await getTikTokStats(videoUrl);
            }
            // Add YouTube support if needed later
        } catch (e) {
            console.error('Validation fetch error:', e);
            // If fetch fails, do we block? Maybe allow but mark unverified? 
            // "If code missing... decline immediately". 
            // Let's assume on fetch error we can't verify, so we return error.
            return res.status(400).json({ error: 'Could not fetch video data. Please check URL privacy settings.' });
        }

        if (!stats) {
            return res.status(400).json({ error: 'Video not found or inaccessible.' });
        }

        const isValid = verifyStrictHashtag(stats.description, verificationCode);

        if (!isValid) {
            return res.status(400).json({
                error: 'Verification failed',
                details: `Description must end with ${verificationCode}`,
                code: verificationCode
            });
        }

        // Create clip (Verified)
        const clip = await prisma.clip.create({
            data: {
                userId: req.user!.id,
                offerId,
                videoUrl,
                platform,
                status: 'pending', // Still pending mod approval? Or approved? Usually "accepted" means verified. But Admin approval might be separate. 
                // User said "video will be accepted ONLY IF...". 
                // Let's keep status pending (for admin budget/content check) but isVerified = true.
                verificationCode,
                isVerified: true,
                views: stats.views,
                likes: stats.likes,
                comments: stats.comments,
                title: stats.description.slice(0, 50) + '...'
            },
            include: { offer: true }
        });

        // Calculate initial stats/earnings
        await processClipStats(clip.id, stats);

        // Respond
        res.json({
            message: 'Clip submitted and verified',
            clip: {
                id: clip.id,
                videoUrl: clip.videoUrl,
                platform: clip.platform,
                status: clip.status,
                verificationCode: clip.verificationCode,
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
