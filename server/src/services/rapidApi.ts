import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

interface RapidApiStats {
    id: string;
    views: number;
    likes: number;
    comments: number;
    reposts: number;
    description: string;
    thumbnailUrl: string;
    title: string;
    isVerified: boolean;
}

/**
 * Create the correct proxy agent based on the YTDLP_PROXY env variable.
 * Supports: socks5://user:pass@host:port, http://user:pass@host:port, or user:pass@host:port (defaults to socks5)
 *
 * IMPORTANT: We use node-fetch (not native fetch) because native Node.js fetch
 * does NOT support the `agent` option and silently ignores the proxy.
 */
function createProxyAgent(): any | null {
    const proxy = process.env.YTDLP_PROXY;
    if (!proxy) return null;

    if (proxy.startsWith('socks5://') || proxy.startsWith('socks4://') || proxy.startsWith('socks://')) {
        return new SocksProxyAgent(proxy);
    }
    if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
        return new HttpsProxyAgent(proxy);
    }

    // No prefix — default to socks5
    return new SocksProxyAgent(`socks5://${proxy}`);
}

/**
 * Perform an HTTP GET request using the https module directly (which respects agents),
 * bypassing native fetch entirely (which ignores agents in Node.js 18+).
 */
async function fetchWithAgent(url: string, headers: Record<string, string>, agent: any | null): Promise<{ ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<any> }> {
    const https = await import('https');
    const http = await import('http');
    const { URL: NodeURL } = await import('url');

    return new Promise((resolve, reject) => {
        const parsed = new NodeURL(url);
        const isHttps = parsed.protocol === 'https:';
        const lib = isHttps ? https : http;

        const options: any = {
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: 'GET',
            headers,
        };

        if (agent) {
            options.agent = agent;
        }

        const req = lib.request(options, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk: Buffer) => chunks.push(chunk));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf8');
                const status = res.statusCode || 0;
                resolve({
                    ok: status >= 200 && status < 300,
                    status,
                    text: async () => body,
                    json: async () => JSON.parse(body),
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy(new Error('Request timed out'));
        });
        req.end();
    });
}

/**
 * Extract Video ID from TikTok URL.
 * Handles full URLs and short URLs (vt.tiktok.com, vm.tiktok.com).
 * Uses native fetch for redirect resolution (no proxy needed for TikTok redirects).
 */
async function getTikTokVideoId(url: string): Promise<string | null> {
    try {
        // 1. Try to extract directly from URL if it already has /video/ or /photo/
        const fullUrlMatch = url.match(/\/(?:video|photo)\/(\d+)/);
        if (fullUrlMatch) {
            return fullUrlMatch[1];
        }

        // 2. Short URL — follow redirects to find the real video URL
        if (url.includes('tiktok.com') || url.includes('/t/')) {
            console.log(`🔄 Resolving short URL: ${url}`);

            let currentUrl = url;
            for (let i = 0; i < 5; i++) {
                try {
                    // Use https module directly to follow redirects manually
                    const https = await import('https');
                    const { URL: NodeURL } = await import('url');

                    const location = await new Promise<string | null>((resolve) => {
                        const parsed = new NodeURL(currentUrl);
                        const req = https.get({
                            hostname: parsed.hostname,
                            port: parsed.port || 443,
                            path: parsed.pathname + parsed.search,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            },
                        }, (res) => {
                            res.resume(); // consume + discard body
                            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
                                resolve(res.headers.location || null);
                            } else {
                                resolve(null);
                            }
                        });
                        req.on('error', () => resolve(null));
                        req.setTimeout(8000, () => { req.destroy(); resolve(null); });
                    });

                    if (location) {
                        currentUrl = location.startsWith('/')
                            ? new URL(location, currentUrl).href
                            : location;
                        console.log(`➡️ Redirected to: ${currentUrl}`);

                        const match = currentUrl.match(/\/(?:video|photo)\/(\d+)/);
                        if (match) return match[1];

                        const vMatch = currentUrl.match(/[?&]v=(\d+)/) || currentUrl.match(/\/v\/(\d+)/);
                        if (vMatch) return vMatch[1];
                    } else {
                        const match = currentUrl.match(/\/(?:video|photo)\/(\d+)/);
                        if (match) return match[1];
                        break;
                    }
                } catch (stepErr: any) {
                    console.error(`Redirect step ${i} failed:`, stepErr.message);
                    break;
                }
            }
        }

        return null;
    } catch (error: any) {
        console.error('Error extracting TikTok ID:', error.message);
        return null;
    }
}

/**
 * Fetch TikTok Stats using RapidAPI.
 * Uses Node.js https module directly to properly support proxy agents.
 */
export async function getTikTokStatsRapid(url: string): Promise<RapidApiStats | null> {
    try {
        const videoId = await getTikTokVideoId(url);
        if (!videoId) {
            console.error('❌ Could not extract video ID from:', url);
            return null;
        }

        const apiKey = process.env.RAPIDAPI_KEY;
        const apiHost = process.env.RAPIDAPI_HOST || 'tiktok-api23.p.rapidapi.com';

        if (!apiKey) {
            console.error('❌ RAPIDAPI_KEY is missing from .env');
            return null;
        }

        const agent = createProxyAgent();
        if (agent) {
            console.log('🌐 Using proxy for RapidAPI request');
        } else {
            console.warn('⚠️ No YTDLP_PROXY set — RapidAPI request will use server IP (may be geo-blocked)');
        }

        const targetUrl = `https://${apiHost}/api/post/detail?videoId=${videoId}`;
        console.log(`🚀 Fetching stats from RapidAPI for ID: ${videoId}`);

        const response = await fetchWithAgent(
            targetUrl,
            {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost,
                'Host': apiHost,
                'Accept': 'application/json',
            },
            agent
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ RapidAPI HTTP Error: ${response.status}`, errText);
            return null;
        }

        const data = await response.json();
        const item = data?.itemInfo?.itemStruct;

        if (!item) {
            console.error('❌ RapidAPI returned no item info:', JSON.stringify(data).slice(0, 200));
            return null;
        }

        const stats = item.stats;

        return {
            id: item.id,
            views: parseInt(stats.playCount) || 0,
            likes: parseInt(stats.diggCount) || 0,
            comments: parseInt(stats.commentCount) || 0,
            reposts: parseInt(stats.shareCount) || 0,
            description: item.desc || '',
            thumbnailUrl: item.video?.cover || item.video?.originCover || '',
            title: item.desc || '',
            isVerified: false
        };
    } catch (error: any) {
        console.error('❌ RapidAPI error:', error.message);
        return null;
    }
}
