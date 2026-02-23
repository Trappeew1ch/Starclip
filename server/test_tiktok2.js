async function run() {
    const url = 'https://vt.tiktok.com/ZSmCkUkd3/';

    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow', // Follow all redirects
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });

        const finalUrl = response.url;
        console.log(`➡️ Resolved to: ${finalUrl}`);

        const match = finalUrl.match(/\/(?:video|photo)\/(\d+)/);
        console.log('Match regex 1:', !!match, match?.[1]);

        const vMatch = finalUrl.match(/[?&]v=(\d+)/) || finalUrl.match(/\/v\/(\d+)/);
        console.log('Match regex 2:', !!vMatch, vMatch?.[1]);
    } catch (e) {
        console.error('Error fetching:', e);
    }
}
run();
