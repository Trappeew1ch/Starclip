import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all active offers
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;

        const where: any = { isActive: true };
        if (type) where.type = type;

        const offers = await prisma.offer.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // Calculate paidOutPercentage for each offer
        const offersWithProgress = offers.map(offer => ({
            ...offer,
            platforms: JSON.parse(offer.platforms),
            requirements: offer.requirements ? JSON.parse(offer.requirements) : [],
            paidOutPercentage: offer.totalBudget > 0
                ? (offer.paidOut / offer.totalBudget) * 100
                : 0,
            glowColor: offer.type === 'YOUTUBER' ? 'blue' : 'gold'
        }));

        res.json(offersWithProgress);
    } catch (error) {
        console.error('Get offers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single offer by ID
router.get('/:id', async (req, res) => {
    try {
        const offer = await prisma.offer.findUnique({
            where: { id: req.params.id },
            include: {
                _count: {
                    select: { clips: true, campaigns: true }
                }
            }
        });

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        res.json({
            ...offer,
            platforms: JSON.parse(offer.platforms),
            requirements: offer.requirements ? JSON.parse(offer.requirements) : [],
            paidOutPercentage: offer.totalBudget > 0
                ? (offer.paidOut / offer.totalBudget) * 100
                : 0,
            glowColor: offer.type === 'YOUTUBER' ? 'blue' : 'gold'
        });
    } catch (error) {
        console.error('Get offer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Join an offer (create campaign for user)
router.post('/:id/join', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const offerId = req.params.id as string;
        const userId = req.user!.id;

        // Check if offer exists and is active
        const offer = await prisma.offer.findUnique({
            where: { id: offerId as string }
        });

        if (!offer || !offer.isActive) {
            return res.status(404).json({ error: 'Offer not found or inactive' });
        }

        // Check if already joined
        const existing = await prisma.userCampaign.findUnique({
            where: {
                userId_offerId: { userId, offerId }
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Already joined this campaign' });
        }

        // Create campaign entry
        const campaign = await prisma.userCampaign.create({
            data: { userId, offerId },
            include: { offer: true }
        });

        res.json({
            message: 'Successfully joined campaign',
            campaign: {
                id: campaign.id,
                offerId: campaign.offerId,
                joinedAt: campaign.joinedAt,
                offer: {
                    ...campaign.offer,
                    platforms: JSON.parse(campaign.offer.platforms),
                    requirements: campaign.offer.requirements ? JSON.parse(campaign.offer.requirements) : []
                }
            }
        });
    } catch (error) {
        console.error('Join offer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
