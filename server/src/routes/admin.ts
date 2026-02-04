import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';
import { notifyClipApproved, notifyClipRejected } from '../bot.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            activeOffers,
            pendingClips,
            totalClips,
            totalPaidOut
        ] = await Promise.all([
            prisma.user.count(),
            prisma.offer.count({ where: { isActive: true } }),
            prisma.clip.count({ where: { status: 'pending' } }),
            prisma.clip.count(),
            prisma.clip.aggregate({
                _sum: { earnedAmount: true },
                where: { status: 'approved' }
            })
        ]);

        res.json({
            totalUsers,
            activeOffers,
            pendingClips,
            totalClips,
            totalPaidOut: totalPaidOut._sum.earnedAmount || 0
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users with search
router.get('/users', async (req, res) => {
    try {
        const { search, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (search) {
            where.OR = [
                { username: { contains: search as string } },
                { firstName: { contains: search as string } }
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    _count: {
                        select: { clips: true, campaigns: true }
                    }
                },
                skip,
                take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users: users.map(u => ({
                id: u.id,
                telegramId: u.telegramId.toString(),
                username: u.username,
                firstName: u.firstName,
                balance: u.balance,
                clipsCount: u._count.clips,
                campaignsCount: u._count.campaigns,
                createdAt: u.createdAt
            })),
            total,
            page: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string))
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single user details
router.get('/users/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                clips: {
                    include: { offer: true },
                    orderBy: { createdAt: 'desc' }
                },
                campaigns: {
                    include: { offer: true }
                },
                socialAccounts: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const totalEarned = user.clips.reduce((sum, c) => sum + c.earnedAmount, 0);
        const totalViews = user.clips.reduce((sum, c) => sum + c.views, 0);

        res.json({
            id: user.id,
            telegramId: user.telegramId.toString(),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            balance: user.balance,
            isAdmin: user.isAdmin,
            createdAt: user.createdAt,
            stats: {
                totalEarned,
                totalViews,
                totalClips: user.clips.length,
                approvedClips: user.clips.filter(c => c.status === 'approved').length,
                pendingClips: user.clips.filter(c => c.status === 'pending').length,
                rejectedClips: user.clips.filter(c => c.status === 'rejected').length
            },
            clips: user.clips.map(c => ({
                id: c.id,
                title: c.title,
                videoUrl: c.videoUrl,
                platform: c.platform,
                status: c.status,
                views: c.views,
                earnedAmount: c.earnedAmount,
                offerName: c.offer.name,
                createdAt: c.createdAt
            })),
            campaigns: user.campaigns.map(c => ({
                offerId: c.offerId,
                offerName: c.offer.name,
                joinedAt: c.joinedAt
            })),
            socialAccounts: user.socialAccounts
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get pending clips for moderation
router.get('/clips/pending', async (req, res) => {
    try {
        const clips = await prisma.clip.findMany({
            where: { status: 'pending' },
            include: {
                user: true,
                offer: true
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(clips.map(c => ({
            id: c.id,
            videoUrl: c.videoUrl,
            platform: c.platform,
            createdAt: c.createdAt,
            user: {
                id: c.user.id,
                username: c.user.username,
                firstName: c.user.firstName
            },
            offer: {
                id: c.offer.id,
                name: c.offer.name,
                title: c.offer.title,
                cpmRate: c.offer.cpmRate
            }
        })));
    } catch (error) {
        console.error('Get pending clips error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve clip
router.post('/clips/:id/approve', async (req, res) => {
    try {
        const clipId = req.params.id;
        const { views = 0 } = req.body;

        const clip = await prisma.clip.findUnique({
            where: { id: clipId },
            include: { offer: true }
        });

        if (!clip) {
            return res.status(404).json({ error: 'Clip not found' });
        }

        // Calculate earnings: views / 1000 * CPM rate
        const earnedAmount = (views / 1000) * clip.offer.cpmRate;

        // Create transaction to ensure all updates happen or none
        const [updatedClip] = await prisma.$transaction([
            // Update clip
            prisma.clip.update({
                where: { id: clipId },
                data: {
                    status: 'approved',
                    views: Number(views),
                    earnedAmount,
                    isVerified: true // Admin approval = verified
                }
            }),
            // Update user balance
            prisma.user.update({
                where: { id: clip.userId },
                data: {
                    balance: { increment: earnedAmount }
                }
            }),
            // Update offer paidOut
            prisma.offer.update({
                where: { id: clip.offerId },
                data: {
                    paidOut: { increment: earnedAmount }
                }
            }),
            // Create transaction record
            prisma.transaction.create({
                data: {
                    userId: clip.userId,
                    clipId: clip.id,
                    amount: earnedAmount,
                    type: 'earning'
                }
            })
        ]);

        // Send notification (outside transaction)
        await notifyClipApproved(clip.userId, clip.title || 'Клип', earnedAmount);

        res.json({
            message: 'Clip approved',
            clip: updatedClip,
            earnedAmount
        });
    } catch (error) {
        console.error('Approve clip error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reject clip
router.post('/clips/:id/reject', async (req, res) => {
    try {
        const clipId = req.params.id;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const clip = await prisma.clip.findUnique({
            where: { id: clipId }
        });

        if (!clip) {
            return res.status(404).json({ error: 'Clip not found' });
        }

        const updatedClip = await prisma.clip.update({
            where: { id: clipId },
            data: {
                status: 'rejected',
                rejectionReason: reason
            }
        });

        // Send notification
        await notifyClipRejected(clip.userId, clip.title || 'Клип', reason);

        res.json({
            message: 'Clip rejected',
            clip: updatedClip
        });
    } catch (error) {
        console.error('Reject clip error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new offer
router.post('/offers', async (req, res) => {
    try {
        const {
            name,
            title,
            type,
            imageUrl,
            avatarUrl,
            bannerUrl,
            totalBudget,
            cpmRate,
            language,
            platforms,
            description,
            requirements,
            assetsLink,
            daysLeft
        } = req.body;

        if (!name || !title || !type || !imageUrl || !totalBudget || !cpmRate) {
            return res.status(400).json({
                error: 'Required fields: name, title, type, imageUrl, totalBudget, cpmRate'
            });
        }

        const offer = await prisma.offer.create({
            data: {
                name,
                title,
                type,
                imageUrl,
                avatarUrl,
                bannerUrl,
                totalBudget: parseFloat(totalBudget),
                cpmRate: parseFloat(cpmRate),
                language: language || 'Russian',
                platforms: JSON.stringify(platforms || ['youtube', 'tiktok', 'instagram']),
                description,
                requirements: requirements ? JSON.stringify(requirements) : null,
                assetsLink,
                daysLeft: daysLeft || 30
            }
        });

        res.json({
            message: 'Offer created',
            offer
        });
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update offer
router.put('/offers/:id', async (req, res) => {
    try {
        const offerId = req.params.id;
        const updates = req.body;

        // Convert arrays to JSON strings if present
        if (updates.platforms) {
            updates.platforms = JSON.stringify(updates.platforms);
        }
        if (updates.requirements) {
            updates.requirements = JSON.stringify(updates.requirements);
        }

        const offer = await prisma.offer.update({
            where: { id: offerId },
            data: updates
        });

        res.json({
            message: 'Offer updated',
            offer
        });
    } catch (error) {
        console.error('Update offer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle offer active status
router.post('/offers/:id/toggle', async (req, res) => {
    try {
        const offer = await prisma.offer.findUnique({
            where: { id: req.params.id }
        });

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        const updated = await prisma.offer.update({
            where: { id: req.params.id },
            data: { isActive: !offer.isActive }
        });

        res.json({
            message: `Offer ${updated.isActive ? 'activated' : 'deactivated'}`,
            offer: updated
        });
    } catch (error) {
        console.error('Toggle offer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
