import puppeteer from 'puppeteer';

async function testRedirect() {
    const url = 'https://vm.tiktok.com/ZSjR3yE5u/'; // short url
    console.log(`Testing puppeteer for: ${url}`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const finalUrl = page.url();
        console.log('Final resolved URL:', finalUrl);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (browser) await browser.close();
    }
}

testRedirect();
