import puppeteer from 'puppeteer';
import { prisma } from '../index.js';
import cron from 'node-cron';

interface VideoStats {
    views: number;
    likes: number;
    comments: number;
    title?: string;
    thumbnailUrl?: string;
}

// Parse YouTube video stats
async function parseYouTubeStats(videoUrl: string): Promise<VideoStats | null> {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for the view count element
        await page.waitForSelector('#info-container', { timeout: 10000 }).catch(() => { });

        const stats = await page.evaluate(() => {
            // Get view count
            const viewsEl = document.querySelector('#info-container yt-formatted-string.style-scope.ytd-watch-info-text') ||
                document.querySelector('span.view-count');
            const viewsText = viewsEl?.textContent || '0';
            const views = parseInt(viewsText.replace(/\D/g, '')) || 0;

            // Get title
            const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
                document.querySelector('title');
            const title = titleEl?.textContent?.replace(' - YouTube', '').trim() || '';

            // Get likes (approximation)
            const likesEl = document.querySelector('#segmented-like-button button') ||
                document.querySelector('ytd-toggle-button-renderer #text');
            const likesText = likesEl?.getAttribute('aria-label') || likesEl?.textContent || '0';
            const likes = parseInt(likesText.replace(/\D/g, '')) || 0;

            // Get comments count
            const commentsEl = document.querySelector('#count .count-text');
            const commentsText = commentsEl?.textContent || '0';
            const comments = parseInt(commentsText.replace(/\D/g, '')) || 0;

            return { views, likes, comments, title };
        });

        return stats;
    } catch (error) {
        console.error('YouTube parsing error:', error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

// Parse TikTok video stats
async function parseTikTokStats(videoUrl: string): Promise<VideoStats | null> {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        await page.waitForSelector('[data-e2e="like-count"]', { timeout: 10000 }).catch(() => { });

        const stats = await page.evaluate(() => {
            // Parse count strings like "1.2M" or "52K"
            const parseCount = (text: string): number => {
                if (!text) return 0;
                const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                if (text.includes('M')) return num * 1000000;
                if (text.includes('K')) return num * 1000;
                return num;
            };

            const likesEl = document.querySelector('[data-e2e="like-count"]');
            const commentsEl = document.querySelector('[data-e2e="comment-count"]');
            const viewsEl = document.querySelector('[data-e2e="video-views"]') ||
                document.querySelector('strong[data-e2e="browse-video-count"]');

            const likes = parseCount(likesEl?.textContent || '0');
            const comments = parseCount(commentsEl?.textContent || '0');
            const views = parseCount(viewsEl?.textContent || '0');

            // Get title
            const titleEl = document.querySelector('[data-e2e="video-desc"]') ||
                document.querySelector('title');
            const title = titleEl?.textContent?.substring(0, 100) || '';

            return { views, likes, comments, title };
        });

        return stats;
    } catch (error) {
        console.error('TikTok parsing error:', error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

// Parse Instagram Reels stats
async function parseInstagramStats(videoUrl: string): Promise<VideoStats | null> {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Instagram requires login for most stats, so we get what we can
        const stats = await page.evaluate(() => {
            // Try to get the meta description which sometimes has view count
            const metaDesc = document.querySelector('meta[property="og:description"]');
            const descContent = metaDesc?.getAttribute('content') || '';

            // Parse likes from description (format: "X likes, Y comments")
            const likesMatch = descContent.match(/([\d,]+)\s*likes/);
            const commentsMatch = descContent.match(/([\d,]+)\s*comments/);
            const viewsMatch = descContent.match(/([\d,]+)\s*views/);

            const likes = likesMatch ? parseInt(likesMatch[1].replace(/,/g, '')) : 0;
            const comments = commentsMatch ? parseInt(commentsMatch[1].replace(/,/g, '')) : 0;
            const views = viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, '')) : likes * 10; // Estimate

            const title = document.querySelector('title')?.textContent || '';

            return { views, likes, comments, title };
        });

        return stats;
    } catch (error) {
        console.error('Instagram parsing error:', error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

// Get stats for any supported platform
export async function getVideoStats(videoUrl: string, platform: string): Promise<VideoStats | null> {
    switch (platform) {
        case 'youtube':
            return parseYouTubeStats(videoUrl);
        case 'tiktok':
            return parseTikTokStats(videoUrl);
        case 'instagram':
            return parseInstagramStats(videoUrl);
        default:
            console.error('Unsupported platform:', platform);
            return null;
    }
}

// Update stats for all approved clips
export async function updateAllClipStats() {
    console.log('Starting clip stats update...');

    const clips = await prisma.clip.findMany({
        where: { status: 'approved' },
        include: { offer: true }
    });

    let updated = 0;
    let failed = 0;

    for (const clip of clips) {
        try {
            const stats = await getVideoStats(clip.videoUrl, clip.platform);

            if (stats && stats.views > clip.views) {
                // Calculate additional earnings
                const viewsDiff = stats.views - clip.views;
                const additionalEarnings = (viewsDiff / 1000) * clip.offer.cpmRate;

                // Update clip stats
                await prisma.clip.update({
                    where: { id: clip.id },
                    data: {
                        views: stats.views,
                        likes: stats.likes,
                        comments: stats.comments,
                        title: stats.title || clip.title,
                        earnedAmount: { increment: additionalEarnings },
                        lastStatsFetch: new Date()
                    }
                });

                // Update user balance
                await prisma.user.update({
                    where: { id: clip.userId },
                    data: {
                        balance: { increment: additionalEarnings }
                    }
                });

                // Update offer paidOut
                await prisma.offer.update({
                    where: { id: clip.offerId },
                    data: {
                        paidOut: { increment: additionalEarnings }
                    }
                });

                // Create transaction for additional earnings
                if (additionalEarnings > 0) {
                    await prisma.transaction.create({
                        data: {
                            userId: clip.userId,
                            clipId: clip.id,
                            amount: additionalEarnings,
                            type: 'earning'
                        }
                    });
                }

                updated++;
                console.log(`Updated clip ${clip.id}: +${stats.views - clip.views} views, +${additionalEarnings.toFixed(2)} RUB`);
            }
        } catch (error) {
            console.error(`Failed to update clip ${clip.id}:`, error);
            failed++;
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`Stats update complete: ${updated} updated, ${failed} failed`);
}

// Schedule stats update every 6 hours
export function scheduleStatsUpdate() {
    cron.schedule('0 */6 * * *', () => {
        console.log('Running scheduled stats update...');
        updateAllClipStats().catch(console.error);
    });
    console.log('Stats update scheduled: every 6 hours');
}
