import { prisma } from '../index.js';

// Calculate earnings for a clip based on views
export function calculateEarnings(views: number, cpmRate: number): number {
    return (views / 1000) * cpmRate;
}

// Process payment for an approved clip
export async function processClipPayment(clipId: string, views: number) {
    const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: { offer: true }
    });

    if (!clip) {
        throw new Error('Clip not found');
    }

    const earnedAmount = calculateEarnings(views, clip.offer.cpmRate);

    // Update clip
    await prisma.clip.update({
        where: { id: clipId },
        data: {
            views,
            earnedAmount,
            status: 'approved'
        }
    });

    // Update user balance
    await prisma.user.update({
        where: { id: clip.userId },
        data: {
            balance: { increment: earnedAmount }
        }
    });

    // Update offer paidOut
    await prisma.offer.update({
        where: { id: clip.offerId },
        data: {
            paidOut: { increment: earnedAmount }
        }
    });

    // Create transaction record
    await prisma.transaction.create({
        data: {
            userId: clip.userId,
            clipId: clip.id,
            amount: earnedAmount,
            type: 'earning',
            status: 'completed'
        }
    });

    return {
        clipId,
        views,
        earnedAmount,
        newBalance: (await prisma.user.findUnique({ where: { id: clip.userId } }))?.balance
    };
}

// Get user's transaction history
export async function getUserTransactions(userId: number, limit = 50) {
    return prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
}

// Get user's total earnings
export async function getUserTotalEarnings(userId: number) {
    const result = await prisma.transaction.aggregate({
        where: {
            userId,
            type: 'earning',
            status: 'completed'
        },
        _sum: { amount: true }
    });

    return result._sum.amount || 0;
}
