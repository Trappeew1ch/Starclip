import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.RAPIDAPI_KEY;
const apiHost = process.env.RAPIDAPI_HOST || 'tiktok-api23.p.rapidapi.com';
const proxy = process.env.YTDLP_PROXY;

console.log('=== RAPIDAPI DIRECT PROXY TEST ===');
console.log('Proxy from .env:', proxy || 'NOT SET');
console.log('API Key present:', !!apiKey);

async function runTest() {
    if (!proxy || !apiKey) {
        console.log('❌ Missing proxy or API key in .env');
        return;
    }

    let agent;
    if (proxy.startsWith('socks5://') || proxy.startsWith('socks4://') || proxy.startsWith('socks://')) {
        agent = new SocksProxyAgent(proxy);
        console.log('Using: SocksProxyAgent (Explicit SOCKS)');
    } else if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
        agent = new HttpsProxyAgent(proxy);
        console.log('Using: HttpsProxyAgent (HTTP/HTTPS)');
    } else {
        agent = new SocksProxyAgent(`socks5://${proxy}`);
        console.log('Using: SocksProxyAgent (Implicit SOCKS5)');
    }

    const config = {
        params: { videoId: '7607053587209850132' },
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': apiHost,
            'Host': apiHost
        },
        httpsAgent: agent,
        proxy: false,
        timeout: 15000
    };

    console.log('\n🚀 Sending request to RapidAPI...');
    try {
        const response = await axios.get(`https://${apiHost}/api/post/detail`, config);
        console.log(`✅ SUCCESS! Status: ${response.status}`);
        console.log("Keys received:", Object.keys(response.data));
    } catch (error) {
        console.log(`❌ FAILED!`);
        if (error.response) {
            console.log(`Status: ${error.response.status} ${error.response.statusText}`);
            let dataStr = typeof error.response.data === 'string'
                ? error.response.data
                : JSON.stringify(error.response.data);
            console.log(`Data (first 300 chars): ${dataStr.substring(0, 300)}`);
            console.log(`Headers sent:`, JSON.stringify(error.config.headers, null, 2));
        } else {
            console.log(`Error message: ${error.message}`);
        }
    }
}

runTest();
