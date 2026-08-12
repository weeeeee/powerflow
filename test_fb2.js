const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    if (fs.existsSync(filePath)) {
        res.end(fs.readFileSync(filePath));
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(8080, async () => {
    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('http://localhost:8080/index.html', {waitUntil: 'networkidle0'});
    
    // Check some tasks
    await page.evaluate(() => {
        document.querySelectorAll('.complete-btn').forEach(btn => btn.click());
    });
    await new Promise(r => setTimeout(r, 2000));
    
    // Reload
    await page.reload({waitUntil: 'networkidle0'});
    
    // Check if they are still completed
    const completedCount = await page.evaluate(() => {
        return document.querySelectorAll('.task-card.completed').length;
    });
    console.log('Completed tasks after reload:', completedCount);
    
    await browser.close();
    server.close();
});
