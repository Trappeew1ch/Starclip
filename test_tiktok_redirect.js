async function testRedirect() {
    // using a more realistic random vt.tiktok link from the wild
    // I'll just see what it returns by default.
    const url = 'https://vt.tiktok.com/ZSjR3yE5u/';
    console.log(`Testing redirect for: ${url}`);

    try {
        const response = await fetch(url, {
            redirect: 'manual', // Don't follow redirects, just read the headers
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log('Got response. Status:', response.status);
        console.log('Headers location:', response.headers.get('location'));

        if (response.status === 301 || response.status === 302) {
            const redirectUrl = response.headers.get('location');
            if (redirectUrl) {
                console.log('Testing second redirect for:', redirectUrl);
                const response2 = await fetch(redirectUrl, {
                    redirect: 'manual',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                console.log('Got second response. Status:', response2.status);
                console.log('Second Headers location:', response2.headers.get('location'));
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testRedirect();
