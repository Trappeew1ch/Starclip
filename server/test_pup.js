import puppeteer from 'puppeteer';

async function testRedirect() {
    // using a real TikTok short URL
    const url = 'https://vm.tiktok.com/ZMxxxxxx/'; // Example, but I'll let it just fail or redirect to trending if it's invalid.
    console.log(`Testing puppeteer for: ${url}`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

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
