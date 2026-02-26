import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';

// This script tests SOCKS5 strictly against the RapidAPI endpoint to reproduce the exact 400 Bad Request error.
async function testRapidApiDirect() {
    console.log("🚀 Starting RapidAPI Test via SOCKS5...");

    // Using one of the provided proxy IPs
    const socksUrl = `socks5://kiruxa134:NQDcqJhhsX@185.13.225.208:51524`;
    const agent = new SocksProxyAgent(socksUrl);

    // Using the exact headers from our rapidApi.ts
    const apiKey = '0bc3c8cf9cmsh5117909cd3dcda3p11b238jsnf9b8979fcfa0'; // Just a random key to get 403 Forbidden instead of 400 Bad Request
    const apiHost = 'tiktok-api23.p.rapidapi.com';

    try {
        console.log("1. Testing via axios (like our code)...");
        const res = await axios.get(`https://${apiHost}/api/post/detail`, {
            params: { videoId: '7607053587209850132' },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost,
                'Host': apiHost
            },
            httpsAgent: agent,
            proxy: false,
            timeout: 10000
        });
        console.log(`✅ Axios SOCKS5 works! Response: ${res.status}`);
    } catch (e) {
        if (e.response) {
            console.log(`❌ Axios Response: ${e.response.status} ${e.response.statusText}`);
            console.log(e.response.data);
        } else {
            console.log(`❌ Axios Failed: ${e.message}`);
        }
    }
}

testRapidApiDirect();
