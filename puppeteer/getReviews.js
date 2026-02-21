const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
// We define the function
const getReviews = async (url) => {
    const browser = await puppeteer.launch({ 
        headless: "new", 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // 1. Look for the DIV that contains "Reviews" and click its parent BUTTON
        // We use evaluate to find the element because normal selectors might skip aria-hidden items
        await page.evaluate(() => {
            const divs = Array.from(document.querySelectorAll('div'));
            const reviewDiv = divs.find(d => d.innerText.trim() === 'Reviews');
            if (reviewDiv) {
                // Click the button that contains this div
                reviewDiv.closest('button').click();
            }
        });

        // 2. Wait for the reviews to actually load
        await page.waitForSelector('[role="article"]', { timeout: 30000 });

        const reviews = await page.evaluate(() => {
            const nodes = document.querySelectorAll('[role="article"]');
            return Array.from(nodes).map(node => ({
                author: node.querySelector('button[aria-label*="profile"]')?.innerText || "Anonymous",
                rating: parseInt(node.querySelector('[aria-label*="stars"]')?.getAttribute('aria-label')) || 0,
                text: node.querySelector('span[class*="text"]')?.innerText || ""
            }));
        });
        
        return reviews;
    } catch (err) {
        console.error("Scrape failed:", err.message);
        return [];
    } finally {
        await browser.close();
    }
};
// CRITICAL: Export the function so app.js can see it
module.exports = { getReviews };