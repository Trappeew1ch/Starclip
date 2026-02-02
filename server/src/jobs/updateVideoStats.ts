import { prisma } from '../index.js';
import { getTikTokStats, verifyHashtag } from '../services/ytdlpParser.js';

/**
 * Update stats for all approved TikTok/YouTube clips using yt-dlp
 * Runs every 10 minutes
 */
export async function updateClipsWithYtdlp() {
    console.log('🔄 Starting yt-dlp stats update job...');

    try {
        // Get all approved clips that need stats update
        const clips = await prisma.clip.findMany({
            where: {
                status: 'approved',
                platform: { in: ['tiktok', 'youtube'] }
            },
            include: {
                offer: true,
                user: true
            }
        });

        console.log(`📊 Found ${clips.length} clips to update`);

        let updatedCount = 0;
        let verifiedCount = 0;
        let earningsAdded = 0;

        for (const clip of clips) {
            try {
                // Fetch stats using yt-dlp
                const stats = await getTikTokStats(clip.videoUrl);

                if (!stats) {
                    console.log(`⚠️ Clip ${clip.id}: Failed to fetch stats`);
                    continue;
                }

                // Check verification status
                let isVerified = clip.isVerified;
                if (!isVerified && clip.verificationCode) {
                    isVerified = verifyHashtag(stats.description, clip.verificationCode);
                    if (isVerified) {
                        verifiedCount++;
                        console.log(`✅ Clip ${clip.id}: Verified with hashtag ${clip.verificationCode}`);
                    }
                }

                const newViews = stats.views;
                const previousViews = clip.views;

                // Only count views if clip is verified
                if (isVerified && newViews > previousViews) {
                    const viewsDiff = newViews - previousViews;
                    const additionalEarnings = (viewsDiff / 1000) * clip.offer.cpmRate;

                    // Update clip stats
                    await prisma.clip.update({
                        where: { id: clip.id },
                        data: {
                            views: newViews,
                            likes: stats.likes,
                            comments: stats.comments,
                            thumbnailUrl: stats.thumbnailUrl || clip.thumbnailUrl,
                            title: stats.title || clip.title,
                            isVerified: true,
                            earnedAmount: clip.earnedAmount + additionalEarnings,
                            lastStatsFetch: new Date()
                        }
                    });

                    // Add earnings to user balance
                    await prisma.user.update({
                        where: { id: clip.userId },
                        data: {
                            balance: { increment: additionalEarnings }
                        }
                    });

                    // Create transaction record
                    if (additionalEarnings > 0) {
                        await prisma.transaction.create({
                            data: {
                                userId: clip.userId,
                                clipId: clip.id,
                                amount: additionalEarnings,
                                type: 'earning',
                                status: 'completed'
                            }
                        });
                    }

                    // Update offer paidOut
                    await prisma.offer.update({
                        where: { id: clip.offerId },
                        data: {
                            paidOut: { increment: additionalEarnings }
                        }
                    });

                    console.log(`✅ Clip ${clip.id}: +${viewsDiff} views, +${additionalEarnings.toFixed(2)} ₽`);
                    updatedCount++;
                    earningsAdded += additionalEarnings;
                } else if (!isVerified) {
                    // Still update basic info but don't count earnings
                    await prisma.clip.update({
                        where: { id: clip.id },
                        data: {
                            views: newViews,
                            likes: stats.likes,
                            comments: stats.comments,
                            thumbnailUrl: stats.thumbnailUrl || clip.thumbnailUrl,
                            title: stats.title || clip.title,
                            isVerified,
                            lastStatsFetch: new Date()
                        }
                    });
                    console.log(`⏳ Clip ${clip.id}: Updated stats (not verified yet)`);
                } else {
                    // Just update last fetch time
                    await prisma.clip.update({
                        where: { id: clip.id },
                        data: { lastStatsFetch: new Date() }
                    });
                }

                // Rate limiting - wait 3 seconds between requests
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (clipError) {
                console.error(`❌ Error updating clip ${clip.id}:`, clipError);
            }
        }

        console.log(`✅ Stats update complete: ${updatedCount} clips earned, ${verifiedCount} newly verified, +${earningsAdded.toFixed(2)} ₽ total`);
        return { updatedCount, verifiedCount, earningsAdded };
    } catch (error) {
        console.error('❌ yt-dlp stats update job failed:', error);
        throw error;
    }
}

/**
 * Start the scheduler to run every 10 minutes
 */
export function startYtdlpStatsScheduler() {
    const TEN_MINUTES = 10 * 60 * 1000;

    // Run once on startup (after 30 sec delay)
    setTimeout(() => {
        updateClipsWithYtdlp().catch(console.error);
    }, 30000);

    // Then run every 10 minutes
    setInterval(() => {
        updateClipsWithYtdlp().catch(console.error);
    }, TEN_MINUTES);

    console.log('⏰ yt-dlp stats scheduler started (runs every 10 minutes)');
}

// Legacy export for backwards compatibility
export { updateClipsWithYtdlp as updateTikTokClipsStats };
export { startYtdlpStatsScheduler as startStatsUpdateScheduler };
