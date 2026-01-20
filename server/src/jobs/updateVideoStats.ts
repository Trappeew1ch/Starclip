import { prisma } from '../index.js';
import * as tiktokService from '../services/tiktok.js';

// Update stats for all approved TikTok clips
export async function updateTikTokClipsStats() {
    console.log('🔄 Starting TikTok stats update job...');

    try {
        // Get all approved TikTok clips
        const clips = await prisma.clip.findMany({
            where: {
                platform: 'tiktok',
                status: 'approved'
            },
            include: {
                user: {
                    include: {
                        socialAccounts: {
                            where: { platform: 'tiktok' }
                        }
                    }
                },
                offer: true
            }
        });

        console.log(`📊 Found ${clips.length} TikTok clips to update`);

        let updatedCount = 0;
        let earningsAdded = 0;

        for (const clip of clips) {
            try {
                const tiktokAccount = clip.user.socialAccounts[0];
                if (!tiktokAccount || !tiktokAccount.accessToken) {
                    console.log(`⚠️ Clip ${clip.id}: User has no TikTok account connected`);
                    continue;
                }

                // Check if token needs refresh
                if (tiktokAccount.tokenExpiresAt && tiktokAccount.tokenExpiresAt < new Date()) {
                    if (tiktokAccount.refreshToken) {
                        const newTokens = await tiktokService.refreshAccessToken(tiktokAccount.refreshToken);
                        if (newTokens) {
                            await prisma.socialAccount.update({
                                where: { id: tiktokAccount.id },
                                data: {
                                    accessToken: newTokens.access_token,
                                    refreshToken: newTokens.refresh_token,
                                    tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000)
                                }
                            });
                            tiktokAccount.accessToken = newTokens.access_token;
                        } else {
                            console.log(`⚠️ Clip ${clip.id}: Failed to refresh token`);
                            continue;
                        }
                    }
                }

                // Extract video ID from URL
                const videoId = tiktokService.extractVideoId(clip.videoUrl);
                if (!videoId) {
                    console.log(`⚠️ Clip ${clip.id}: Cannot extract video ID from URL`);
                    continue;
                }

                // Try to get video stats
                let videoStats = null;

                // First try query endpoint
                const videos = await tiktokService.queryVideoInfo(tiktokAccount.accessToken!, [videoId]);
                if (videos && videos.length > 0) {
                    videoStats = videos[0];
                } else {
                    // Fallback to searching in user's videos
                    videoStats = await tiktokService.getVideoStats(tiktokAccount.accessToken!, videoId);
                }

                if (!videoStats) {
                    console.log(`⚠️ Clip ${clip.id}: Video stats not available`);
                    continue;
                }

                const newViews = videoStats.view_count;
                const previousViews = clip.views;

                // Only update if views increased
                if (newViews > previousViews) {
                    const viewsDiff = newViews - previousViews;
                    const additionalEarnings = (viewsDiff / 1000) * clip.offer.cpmRate;

                    // Update clip stats
                    await prisma.clip.update({
                        where: { id: clip.id },
                        data: {
                            views: newViews,
                            likes: videoStats.like_count,
                            comments: videoStats.comment_count,
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
                    await prisma.transaction.create({
                        data: {
                            userId: clip.userId,
                            clipId: clip.id,
                            amount: additionalEarnings,
                            type: 'earning',
                            status: 'completed'
                        }
                    });

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
                } else {
                    // Just update last fetch time
                    await prisma.clip.update({
                        where: { id: clip.id },
                        data: { lastStatsFetch: new Date() }
                    });
                }
            } catch (clipError) {
                console.error(`❌ Error updating clip ${clip.id}:`, clipError);
            }
        }

        console.log(`✅ Stats update complete: ${updatedCount} clips updated, +${earningsAdded.toFixed(2)} ₽ total earnings`);
        return { updatedCount, earningsAdded };
    } catch (error) {
        console.error('❌ Stats update job failed:', error);
        throw error;
    }
}

// Schedule the job to run every 4 hours
export function startStatsUpdateScheduler() {
    // Run immediately on startup (with 30 sec delay)
    setTimeout(() => {
        updateTikTokClipsStats().catch(console.error);
    }, 30000);

    // Then run every 4 hours
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    setInterval(() => {
        updateTikTokClipsStats().catch(console.error);
    }, FOUR_HOURS);

    console.log('⏰ Stats update scheduler started (runs every 4 hours)');
}
