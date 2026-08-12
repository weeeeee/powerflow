const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('file:///home/swhitelex/PowerFlow/index.html');
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
})();
