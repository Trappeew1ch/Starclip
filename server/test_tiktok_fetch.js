const url = 'https://vt.tiktok.com/ZSmCkUkd3/';

const ac = new AbortController();
setTimeout(() => ac.abort(), 10000);

console.log('Sending fetch...');
fetch(url, {
    method: 'GET',
    redirect: 'follow',
    signal: ac.signal,
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
    }
})
    .then(r => {
        console.log('Final URL:', r.url);
        console.log('Status:', r.status);
    })
    .catch(e => {
        console.error('Fetch caught an error:', e.name, e.message);
    });
