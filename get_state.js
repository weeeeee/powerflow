import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    // We can just open the local index.html directly if it doesn't need a server,
    // but the firebase stuff requires module support. Let's use a simple express server.
    // wait, we can just point to http://localhost:8080 if it's running, or run it ourselves.
    
    await page.goto('http://localhost:8080').catch(e => console.log('not running'));
    
    // Wait a bit for firebase to load
    await new Promise(r => setTimeout(r, 2000));
    
    const scores = await page.evaluate(() => {
        return {
            storeTotal: document.getElementById('store-total-score') ? document.getElementById('store-total-score').textContent : 'not found',
            allTimeTotal: document.getElementById('alltime-score-display') ? document.getElementById('alltime-score-display').textContent : 'not found',
            totalScore: document.getElementById('total-score') ? document.getElementById('total-score').textContent : 'not found',
        }
    });
    console.log(scores);
    await browser.close();
})();
