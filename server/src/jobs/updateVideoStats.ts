import { prisma } from '../index.js';
import { getTikTokStats } from '../services/ytdlpParser.js';
import { processClipStats } from '../services/statsCalculator.js';

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

                if (stats) {
                    const result = await processClipStats(clip.id, stats);
                    if (result) {
                        if (result.additionalEarnings > 0) {
                            updatedCount++;
                            earningsAdded += result.additionalEarnings;
                        }
                        if (result.isVerified && !clip.isVerified) {
                            verifiedCount++;
                        }
                    }
                }

                // Rate limiting - wait 3 seconds between requests
                await new Promise(resolve => setTimeout(resolve, 3000));

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
