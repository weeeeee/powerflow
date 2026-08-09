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
    
    // Wait for view to switch
    await page.waitForSelector('#parent-view.active');
    
    // Check if the button is there and visible
    const btnVisible = await page.$eval('#open-add-store-btn', el => el.offsetParent !== null);
    console.log('Button is visible:', btnVisible);
    
    // Click the button
    await page.click('#open-add-store-btn');
    
    // Check if modal is visible
    const modalVisible = await page.$eval('#store-modal', el => !el.classList.contains('hidden'));
    console.log('Modal is visible:', modalVisible);
    
    await browser.close();
})();
