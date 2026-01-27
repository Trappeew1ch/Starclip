import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// Generate a unique referral code
function generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Get referral info for current user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;

        let user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                referrals: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate referral code if not exists
        if (!user.referralCode) {
            const referralCode = generateReferralCode();
            user = await prisma.user.update({
                where: { id: userId },
                data: { referralCode },
                include: { referrals: true }
            });
        }

        const botUsername = process.env.BOT_USERNAME || 'StarClipBot';
        const referralLink = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;

        // Calculate total earned from referrals (10% of their earnings)
        const referralIds = user.referrals.map(r => r.id);
        let totalEarned = 0;

        if (referralIds.length > 0) {
            const referralClips = await prisma.clip.findMany({
                where: {
                    userId: { in: referralIds },
                    status: 'approved'
                }
            });
            const referralEarnings = referralClips.reduce((sum, clip) => sum + clip.earnedAmount, 0);
            totalEarned = referralEarnings * 0.1; // 10% commission
        }

        res.json({
            referralCode: user.referralCode,
            referralLink,
            referralCount: user.referrals.length,
            totalEarned
        });
    } catch (error) {
        console.error('Get referral info error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get list of referrals
router.get('/list', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                referrals: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const referralsList = user.referrals.map(ref => ({
            id: ref.id,
            username: ref.username,
            firstName: ref.firstName,
            photoUrl: ref.photoUrl,
            joinedAt: formatRelativeDate(ref.referredAt || ref.createdAt)
        }));

        res.json(referralsList);
    } catch (error) {
        console.error('Get referrals list error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

function formatRelativeDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Только что';
    if (hours < 24) return `${hours} час${hours === 1 ? '' : hours < 5 ? 'а' : 'ов'} назад`;
    if (days === 1) return '1 день назад';
    if (days < 7) return `${days} дн${days < 5 ? 'я' : 'ей'} назад`;
    return date.toLocaleDateString('ru-RU');
}

export default router;
