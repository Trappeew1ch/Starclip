import { prisma } from '../index.js';
import { TikTokVideoStats, verifyHashtag } from './ytdlpParser.js';

/**
 * Process new stats for a clip
 * Calculates earnings based on view difference and updates DB
 */
export async function processClipStats(clipId: string, stats: TikTokVideoStats) {
    const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: { offer: true }
    });

    if (!clip) return null;

    // Check verification status
    let isVerified = clip.isVerified;
    if (!isVerified && clip.verificationCode) {
        isVerified = verifyHashtag(stats.description, clip.verificationCode);
        if (isVerified) {
            console.log(`✅ Clip ${clip.id}: Verified with hashtag ${clip.verificationCode}`);
        }
    }

    const newViews = stats.views;
    const previousViews = clip.views || 0;
    let additionalEarnings = 0;
    let viewsDiff = 0;

    // Only count views if clip is verified and views increased
    if (isVerified && newViews > previousViews) {
        viewsDiff = newViews - previousViews;
        // Calculate earnings: (Views Diff / 1000) * Rate per 1000 views
        additionalEarnings = (viewsDiff / 1000) * clip.offer.cpmRate; // assuming cpmRate is per 1000 views
    }

    if (additionalEarnings > 0) {
        // Atomic update with transaction
        await prisma.$transaction([
            // Update clip stats
            prisma.clip.update({
                where: { id: clip.id },
                data: {
                    views: newViews,
                    likes: stats.likes,
                    comments: stats.comments,
                    thumbnailUrl: stats.thumbnailUrl || clip.thumbnailUrl,
                    title: stats.title || clip.title,
                    isVerified: true,
                    earnedAmount: { increment: additionalEarnings },
                    lastStatsFetch: new Date()
                }
            }),
            // Add earnings to user balance
            prisma.user.update({
                where: { id: clip.userId },
                data: {
                    balance: { increment: additionalEarnings }
                }
            }),
            // Update offer paidOut
            prisma.offer.update({
                where: { id: clip.offerId },
                data: {
                    paidOut: { increment: additionalEarnings }
                }
            }),
            // Create transaction record
            prisma.transaction.create({
                data: {
                    userId: clip.userId,
                    clipId: clip.id,
                    amount: additionalEarnings,
                    type: 'earning',
                    status: 'completed'
                }
            })
        ]);
        console.log(`💰 Clip ${clip.id}: +${viewsDiff} views, +${additionalEarnings.toFixed(2)} ₽`);
    } else {
        // Just update stats without earnings
        await prisma.clip.update({
            where: { id: clip.id },
            data: {
                views: newViews,
                likes: stats.likes,
                comments: stats.comments,
                thumbnailUrl: stats.thumbnailUrl || clip.thumbnailUrl,
                title: stats.title || clip.title,
                isVerified, // Update verification status if it changed
                lastStatsFetch: new Date()
            }
        });
        console.log(`📝 Clip ${clip.id}: Updated stats (Diff: ${viewsDiff}, Verified: ${isVerified})`);
    }

    return { viewsDiff, additionalEarnings, isVerified };
}
