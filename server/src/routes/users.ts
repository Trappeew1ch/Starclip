import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get user stats for earnings page
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;

        // Get user with balance
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        // Get social accounts
        const accounts = await prisma.socialAccount.findMany({
            where: { userId }
        });

        // Get all approved clips
        const clips = await prisma.clip.findMany({
            where: {
                userId,
                status: 'approved'
            },
            include: { offer: true }
        });

        // Get referrals earnings
        const referralTx = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                userId,
                type: 'referral'
            }
        });
        const earnedFromReferrals = referralTx._sum.amount || 0;
        const earnedFromClips = clips.reduce((sum, c) => sum + c.earnedAmount, 0);

        // Calculate stats
        const totalVideos = clips.length;
        const totalViews = clips.reduce((sum, c) => sum + c.views, 0);
        const totalFollowers = accounts.reduce((sum, a) => sum + a.followers, 0);
        const avgViews = totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0;

        // Get top 3 clips by earnings
        const topClips = clips
            .sort((a, b) => b.earnedAmount - a.earnedAmount)
            .slice(0, 3)
            .map(clip => ({
                id: clip.id,
                title: clip.title || `Клип для ${clip.offer.name}`,
                views: clip.views > 1000000
                    ? `${(clip.views / 1000000).toFixed(1)}M`
                    : clip.views > 1000
                        ? `${(clip.views / 1000).toFixed(0)}K`
                        : clip.views.toString(),
                earned: `+${clip.earnedAmount.toFixed(0)} ₽`,
                imageUrl: clip.thumbnailUrl || 'https://imgur.com/5SyGq8g.png',
                date: formatRelativeDate(clip.createdAt)
            }));

        const responseData = {
            balance: user?.balance || 0,
            earnedClips: earnedFromClips,
            earnedReferrals: earnedFromReferrals,
            profiles: accounts.length,
            videos: totalVideos,
            followers: totalFollowers,
            totalViews,
            avgViews,
            topClips
        };
        res.json(responseData);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get social accounts
router.get('/accounts', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const accounts = await prisma.socialAccount.findMany({
            where: { userId: req.user!.id }
        });

        // Calculate clips count and earnings per account
        const accountsWithStats = await Promise.all(
            accounts.map(async (acc) => {
                const clips = await prisma.clip.findMany({
                    where: {
                        userId: req.user!.id,
                        platform: acc.platform,
                        status: 'approved'
                    }
                });

                const totalEarned = clips.reduce((sum, c) => sum + c.earnedAmount, 0);

                return {
                    id: acc.id.toString(),
                    name: acc.accountName,
                    platform: acc.platform,
                    avatarUrl: undefined,
                    isConnected: acc.isConnected,
                    clipsCount: clips.length,
                    totalEarned: `${totalEarned.toFixed(0)} ₽`
                };
            })
        );

        res.json(accountsWithStats);
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add social account
router.post('/accounts', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { platform, accountName, profileUrl } = req.body;

        if (!platform || !accountName) {
            return res.status(400).json({ error: 'platform and accountName are required' });
        }

        const account = await prisma.socialAccount.create({
            data: {
                userId: req.user!.id,
                platform,
                accountName,
                profileUrl
            }
        });

        res.json({
            id: account.id.toString(),
            name: account.accountName,
            platform: account.platform,
            isConnected: true,
            clipsCount: 0,
            totalEarned: '0 ₽'
        });
    } catch (error) {
        console.error('Add account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Request withdrawal
router.post('/withdraw', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { amount, wallet } = req.body;

        if (!amount || amount < 10) {
            return res.status(400).json({ error: 'Минимальная сумма вывода 10 ₽' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.balance < amount) {
            return res.status(400).json({ error: 'Недостаточно средств на балансе' });
        }

        // Create transaction to deduct balance and create request
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { balance: { decrement: amount } }
            }),
            prisma.payoutRequest.create({
                data: {
                    userId,
                    amount,
                    wallet: wallet || 'Не указан',
                    status: 'pending'
                }
            }),
            prisma.transaction.create({
                data: {
                    userId,
                    amount: -amount,
                    type: 'withdrawal',
                    status: 'pending'
                }
            })
        ]);

        const supportUsername = process.env.SUPPORT_USERNAME || 'support';

        res.json({
            success: true,
            message: 'Заявка на вывод создана',
            currentBalance: user.balance - amount
        });
    } catch (error) {
        console.error('Withdraw error:', error);
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
