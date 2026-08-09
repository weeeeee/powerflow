const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('/home/swhitelex/PowerFlow/index.html', 'utf-8');
const js = fs.readFileSync('/home/swhitelex/PowerFlow/app.js', 'utf-8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
try {
    dom.window.eval(js);
    console.log("No runtime errors on load!");
    
    // simulate click
    const btn = dom.window.document.getElementById('open-add-store-btn');
    if (!btn) {
        console.log("Button not found!");
    } else {
        console.log("Button found. Clicking...");
        btn.click();
        const modal = dom.window.document.getElementById('store-modal');
        console.log("Modal classes:", modal.className);
    }
} catch(e) {
    console.error("Runtime error:", e);
}
