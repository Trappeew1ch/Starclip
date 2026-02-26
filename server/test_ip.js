async function run() {
    try {
        const r1 = await fetch('http://ip-api.com/json/45.153.163.79');
        console.log('Proxy 1:', await r1.json());
        const r2 = await fetch('http://ip-api.com/json/185.13.225.208');
        console.log('Proxy 2:', await r2.json());
    } catch (e) {
        console.error(e);
    }
}
run();
