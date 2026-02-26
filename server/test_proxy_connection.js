import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function testProxy() {
    const rawProxy = 'andriymayik:4YrrDIPLD2@45.10.156.4:59101';
    // Test without http prefix first
    let proxyUrl = rawProxy;
    if (!proxyUrl.startsWith('http')) {
        proxyUrl = `http://${proxyUrl}`;
    }

    console.log('Testing proxy:', proxyUrl);

    try {
        const agent = new HttpsProxyAgent(proxyUrl);
        const response = await axios.get('https://tiktok-api23.p.rapidapi.com/api/post/detail', {
            params: { videoId: '7607053587209850132' },
            headers: {
                'x-rapidapi-key': '0bc3c8cf9cmsh5117909cd3dcda3p11b238jsnf9b8979fcfa0', // Needs a real key if testing 200, but testing 403 vs timeout is enough
                'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
            },
            httpsAgent: agent,
            proxy: false,
            timeout: 10000
        });
        console.log('Success:', response.status);
    } catch (e) {
        if (e.response) {
            console.log('Received response from RapidAPI (Proxy works):', e.response.status, e.response.data);
        } else {
            console.error('Failed to connect through proxy:', e.message);
        }
    }
}
testProxy();
