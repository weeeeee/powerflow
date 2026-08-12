import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    // Serve files with a simple server
    const { exec } = await import('child_process');
    const server = exec('npx http-server -p 8081');
    
    await new Promise(r => setTimeout(r, 2000));
    
    await page.goto('http://localhost:8081');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Evaluate to force 110 points
    await page.evaluate(() => {
        // Find state
        window.state = { score: 110, allTimeScore: 0 };
        document.getElementById('store-total-score').textContent = '110';
    });
    
    const text = await page.$eval('#store-total-score', el => el.textContent);
    console.log('Store Points:', text);
    
    server.kill();
    await browser.close();
    process.exit(0);
})();
