import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

async function checkEnvAndCode() {
    console.log("=== DIAGNOSTIC CHECK ===");

    // 1. Check if YTDLP_PROXY is actually set correctly in the running process environment
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    const proxy = process.env.YTDLP_PROXY;
    console.log("1. YTDLP_PROXY from .env:\n   " + (proxy ? proxy : "NOT SET"));

    if (proxy && (proxy.includes('socks') || proxy.includes('http'))) {
        console.log("   ✅ Type prefix detected in proxy string: OK");
    } else if (proxy) {
        console.log("   ℹ️ No prefix (http:// or socks5://) detected. It will default to SOCKS5.");
    }

    // 2. Check the compiled code in dist/services/rapidApi.js to ensure it has our latest fixes
    try {
        const codePath = path.resolve(process.cwd(), 'dist/services/rapidApi.js');
        const code = fs.readFileSync(codePath, 'utf8');
        console.log("\n2. Checking compiled rapidApi.js...");

        if (code.includes('SocksProxyAgent')) {
            console.log("   ✅ SOCKS5 proxy patch is PRESENT in the compiled code.");
        } else {
            console.log("   ❌ SOCKS5 proxy patch is MISSING from the compiled code!");
        }

        if (code.includes("'Host': apiHost")) {
            console.log("   ✅ Host header patch is PRESENT in the compiled code.");
        } else {
            console.log("   ❌ Host header patch is MISSING from the compiled code!");
        }
    } catch (e) {
        console.log("\n2. Checking compiled rapidApi.js...\n   ❌ FAILED TO READ FILE! (Did you run npm run build?)");
    }

    console.log("\n=========================");
    console.log("IF ANY OF THE CHECKS ABOVE FAILED (❌), DO THE FOLLOWING:");
    console.log("1. git pull");
    console.log("2. npm install");
    console.log("3. pm2 restart starclip-api");
}

checkEnvAndCode();
