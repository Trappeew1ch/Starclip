import net from 'net';

// Test if proxy responds on TCP level
function testProxy(host, port, label) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(5000);
        socket.on('connect', () => {
            console.log(`✅ ${label} (${host}:${port}) — TCP connection OK`);
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            console.log(`❌ ${label} (${host}:${port}) — timeout`);
            socket.destroy();
            resolve(false);
        });
        socket.on('error', (err) => {
            console.log(`❌ ${label} (${host}:${port}) — error: ${err.message}`);
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, host);
    });
}

async function main() {
    await testProxy('45.153.163.79', 50101, 'Proxy 1');
    await testProxy('185.13.225.208', 51524, 'Proxy 2');
}
main();
