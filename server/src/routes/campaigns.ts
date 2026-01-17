import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get user's campaigns with offer details and stats
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const campaigns = await prisma.userCampaign.findMany({
            where: { userId: req.user!.id },
            include: {
                offer: true
            },
            orderBy: { joinedAt: 'desc' }
        });

        // Get clips for each campaign
        const campaignsWithStats = await Promise.all(
            campaigns.map(async (campaign) => {
                const clips = await prisma.clip.findMany({
                    where: {
                        userId: req.user!.id,
                        offerId: campaign.offerId
                    }
                });

                const totalViews = clips.reduce((sum, c) => sum + c.views, 0);
                const totalEarned = clips.reduce((sum, c) => sum + c.earnedAmount, 0);

                return {
                    id: campaign.offer.id,
                    channelName: campaign.offer.name,
                    avatarUrl: campaign.offer.avatarUrl || campaign.offer.imageUrl,
                    episode: campaign.offer.title,
                    earned: `${totalEarned.toFixed(0)} ₽`,
                    views: totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews.toString(),
                    daysLeft: campaign.offer.daysLeft,
                    paidOut: campaign.offer.totalBudget > 0
                        ? Math.round((campaign.offer.paidOut / campaign.offer.totalBudget) * 100)
                        : 0,
                    rate: `${campaign.offer.cpmRate} ₽`,
                    description: campaign.offer.description || '',
                    assetsLink: campaign.offer.assetsLink || '#',
                    clipsCount: clips.length,
                    pendingClips: clips.filter(c => c.status === 'pending').length
                };
            })
        );

        res.json(campaignsWithStats);
    } catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get clips for a specific campaign
router.get('/:offerId/clips', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const clips = await prisma.clip.findMany({
            where: {
                userId: req.user!.id,
                offerId: req.params.offerId as string
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(clips);
    } catch (error) {
        console.error('Get campaign clips error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
