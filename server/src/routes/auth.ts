import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, AuthRequest, validateInitData } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

function generateVerificationCode(): string {
    return `#SC-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

// Validate init data and return user info
router.post('/validate', async (req, res) => {
    const { initData } = req.body;

    if (!initData) {
        return res.status(400).json({ error: 'initData is required' });
    }

    const validation = validateInitData(initData);
    if (!validation.valid || !validation.data) {
        return res.status(401).json({ error: 'Invalid initData' });
    }

    try {
        const userData = JSON.parse(validation.data.user || '{}');
        const telegramId = BigInt(userData.id);

        // Check if user is in ADMIN_IDS
        const adminIds = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim());
        const shouldBeAdmin = adminIds.includes(userData.id.toString());

        // Upsert user
        let user = await prisma.user.upsert({
            where: { telegramId },
            update: {
                username: userData.username,
                firstName: userData.first_name,
                lastName: userData.last_name,
                photoUrl: userData.photo_url
            },
            create: {
                telegramId,
                username: userData.username,
                firstName: userData.first_name,
                lastName: userData.last_name,
                photoUrl: userData.photo_url,
                isAdmin: shouldBeAdmin,
                verificationCode: generateVerificationCode()
            }
        });

        // Backfill verification code if missing
        if (!user.verificationCode) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { verificationCode: generateVerificationCode() }
            });
        }

        // If user should be admin but isn't marked as such, update
        if (shouldBeAdmin && !user.isAdmin) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { isAdmin: true }
            });
        }

        res.json({
            user: {
                id: user.id,
                telegramId: user.telegramId.toString(),
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                photoUrl: user.photoUrl,
                balance: user.balance,
                isAdmin: user.isAdmin,
                verificationCode: user.verificationCode
            }
        });
    } catch (error) {
        console.error('Auth validation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                _count: {
                    select: {
                        clips: true,
                        campaigns: true,
                        socialAccounts: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Backfill verification code if missing for current user
        if (!user.verificationCode) {
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { verificationCode: generateVerificationCode() }
            });
            // Update local user object to reflect change
            (user as any).verificationCode = updatedUser.verificationCode;
        }

        res.json({
            id: user.id,
            telegramId: user.telegramId.toString(),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            photoUrl: user.photoUrl,
            balance: user.balance,
            isAdmin: user.isAdmin,
            verificationCode: user.verificationCode,
            stats: user._count
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
