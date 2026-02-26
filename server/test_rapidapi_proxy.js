import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function testRapidApi(user, pass, host, port, label) {
    console.log(`\n--- Testing ${label} vs RapidAPI as SOCKS5 ---`);
    const socksUrl = `socks5://${user}:${pass}@${host}:${port}`;
    try {
        const agent = new SocksProxyAgent(socksUrl);
        const res = await axios.get('https://tiktok-api23.p.rapidapi.com/api/post/detail', {
            params: { videoId: '7607053587209850132' },
            headers: {
                'x-rapidapi-key': 'testkey', // Doesn't matter, we just want to reach the RapidAPI server (expect 403 Forbidden, NOT 400 Bad Request)
                'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
            },
            httpsAgent: agent,
            proxy: false,
            timeout: 10000
        });
        console.log(`✅ SOCKS5 works! Response: ${res.status}`);
    } catch (e) {
        if (e.response) {
            console.log(`Response received via SOCKS5: ${e.response.status} ${e.response.statusText}`);
            if (e.response.status === 403 || e.response.status === 401) {
                console.log(`✅ SOCKS5 successfully connected to RapidAPI (Auth failed as expected).`);
            } else if (e.response.status === 400) {
                console.log(`❌ SOCKS5 returned 400 Bad Request (This is the error in production!)`);
            }
        } else {
            console.log(`❌ SOCKS5 failed: ${e.message}`);
        }
    }

    console.log(`--- Testing ${label} vs RapidAPI as HTTP ---`);
    const httpUrl = `http://${user}:${pass}@${host}:${port}`;
    try {
        const agent = new HttpsProxyAgent(httpUrl);
        const res = await axios.get('https://tiktok-api23.p.rapidapi.com/api/post/detail', {
            params: { videoId: '7607053587209850132' },
            headers: {
                'x-rapidapi-key': 'testkey',
                'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
            },
            httpsAgent: agent,
            proxy: false,
            timeout: 10000
        });
        console.log(`✅ HTTP works! Response: ${res.status}`);
    } catch (e) {
        if (e.response) {
            console.log(`Response received via HTTP: ${e.response.status} ${e.response.statusText}`);
            if (e.response.status === 403 || e.response.status === 401) {
                console.log(`✅ HTTP successfully connected to RapidAPI (Auth failed as expected).`);
            } else if (e.response.status === 400) {
                console.log(`❌ HTTP returned 400 Bad Request`);
            }
        } else {
            console.log(`❌ HTTP failed: ${e.message}`);
        }
    }
}

async function main() {
    await testRapidApi('astap01', '5YBoMtNUoi', '45.153.163.79', 50101, 'Proxy 1');
    await testRapidApi('kiruxa134', 'NQDcqJhhsX', '185.13.225.208', 51524, 'Proxy 2');
}
main();
