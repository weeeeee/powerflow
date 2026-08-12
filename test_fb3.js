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

server.listen(8081, async () => {
    const browser = await puppeteer.launch({args: ['--no-sandbox']});
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.evaluateOnNewDocument(() => {
        window.originalLog = console.log;
        window.originalError = console.error;
    });

    await page.goto('http://localhost:8081/index.html', {waitUntil: 'networkidle0'});
    
    await page.evaluate(() => {
        console.log("Initial state tasks:", document.querySelectorAll('.task-card.completed').length);
        document.querySelectorAll('.complete-btn').forEach(btn => btn.click());
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
        console.log("Before reload, completed tasks:", document.querySelectorAll('.task-card.completed').length);
        console.log("lastResetDate in localStorage:", JSON.parse(localStorage.getItem('powerflow_state') || '{}').lastResetDate);
    });

    // Reload
    await page.reload({waitUntil: 'networkidle0'});
    
    await page.evaluate(() => {
        console.log("After reload tasks:", document.querySelectorAll('.task-card.completed').length);
        console.log("lastResetDate in localStorage after reload:", JSON.parse(localStorage.getItem('powerflow_state') || '{}').lastResetDate);
    });

    await browser.close();
    server.close();
});
