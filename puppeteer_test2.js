(async () => {
    const { default: puppeteer } = await import('puppeteer');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    
    await page.goto('http://localhost:8080');
    
    // Go to parent portal
    await page.click('#nav-parent-btn');
    await page.type('#parent-password-input', '1234');
    await page.click('#password-form button[type="submit"]');
    
    await page.waitForSelector('#parent-view.active');
    
    // Try adding a store item
    console.log('Clicking add store btn...');
    await page.click('#open-add-store-btn');
    await new Promise(r => setTimeout(r, 500));
    
    console.log('Typing store details...');
    await page.type('#store-title-input', 'Test Store Item');
    await page.type('#store-points-input', '100');
    
    console.log('Clicking save...');
    await page.click('#save-store-btn');
    await new Promise(r => setTimeout(r, 500));
    
    // Try adding a quest
    console.log('Clicking add quest btn...');
    await page.click('#open-add-quest-btn');
    await new Promise(r => setTimeout(r, 500));
    
    console.log('Typing quest details...');
    await page.type('#quest-title-input', 'Test Quest Item');
    
    console.log('Clicking save quest...');
    await page.click('#save-quest-btn');
    await new Promise(r => setTimeout(r, 500));
    
    await browser.close();
})();
