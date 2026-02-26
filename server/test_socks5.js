import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function testSocks5(user, pass, host, port, label) {
    console.log(`\n--- Testing ${label} as SOCKS5 ---`);
    const socksUrl = `socks5://${user}:${pass}@${host}:${port}`;
    try {
        const agent = new SocksProxyAgent(socksUrl);
        const res = await axios.get('https://httpbin.org/ip', {
            httpsAgent: agent,
            proxy: false,
            timeout: 10000
        });
        console.log(`✅ SOCKS5 works! Your IP: ${res.data.origin}`);
        return true;
    } catch (e) {
        console.log(`❌ SOCKS5 failed: ${e.message}`);
    }

    console.log(`--- Testing ${label} as HTTP ---`);
    const httpUrl = `http://${user}:${pass}@${host}:${port}`;
    try {
        const agent = new HttpsProxyAgent(httpUrl);
        const res = await axios.get('https://httpbin.org/ip', {
            httpsAgent: agent,
            proxy: false,
            timeout: 10000
        });
        console.log(`✅ HTTP proxy works! Your IP: ${res.data.origin}`);
        return true;
    } catch (e) {
        console.log(`❌ HTTP proxy also failed: ${e.message}`);
    }
    return false;
}

async function main() {
    await testSocks5('astap01', '5YBoMtNUoi', '45.153.163.79', 50101, 'Proxy 1');
    await testSocks5('kiruxa134', 'NQDcqJhhsX', '185.13.225.208', 51524, 'Proxy 2');
}
main();
