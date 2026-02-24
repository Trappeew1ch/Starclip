import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dotenv from 'dotenv';
dotenv.config();

// Test the full pipeline: short URL -> video ID -> rapid api via proxy
async function test() {
    const proxy = process.env.YTDLP_PROXY;
    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || 'tiktok-api23.p.rapidapi.com';

    console.log(`Proxy: ${proxy}`);
    console.log(`API Key set: ${!!apiKey}`);

    // Step 1: Resolve short URL
    const shortUrl = 'https://vt.tiktok.com/ZSmCkUkd3/';
    console.log(`\n1) Resolving ${shortUrl}`);

    let currentUrl = shortUrl;
    for (let i = 0; i < 3; i++) {
        const response = await fetch(currentUrl, {
            method: 'GET',
            redirect: 'manual',
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15' }
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (location) {
                currentUrl = location.startsWith('/') ? new URL(location, currentUrl).href : location;
                console.log(`   Redirect: ${currentUrl}`);
                const match = currentUrl.match(/\/(?:video|photo)\/(\d+)/);
                if (match) { console.log(`   ✅ Video ID: ${match[1]}`); await fetchStats(match[1], apiKey, apiHost, proxy); return; }
            } else break;
        } else break;
    }
}

async function fetchStats(videoId, apiKey, apiHost, proxy) {
    console.log(`\n2) Fetching stats for ID ${videoId} via RapidAPI`);
    try {
        const config = {
            params: { videoId },
            headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': apiHost }
        };

        if (proxy) {
            config.httpsAgent = new HttpsProxyAgent(proxy);
            config.proxy = false;
            console.log(`   Using proxy: ${proxy}`);
        }

        const response = await axios.get(`https://${apiHost}/api/post/detail`, config);
        const item = response.data?.itemInfo?.itemStruct;
        if (item) {
            console.log(`   ✅ Stats: views=${item.stats?.playCount}, likes=${item.stats?.diggCount}`);
        } else {
            console.log('   ❌ No item in response:', JSON.stringify(response.data).slice(0, 200));
        }
    } catch (e) {
        console.error('   ❌ API error:', e.response?.data || e.message);
    }
}

test().catch(console.error);
