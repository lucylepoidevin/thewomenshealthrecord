// One-off: render the cycling-brain viewer at share-card size → public/share/cycling-brain.png
// Needs the dev server running (npm run dev) on 5173.
import { chromium } from 'playwright'
const url = process.argv[2] ?? 'http://localhost:5173/thewomenshealthrecord/#/cycling-brain'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.evaluate(() => document.getElementById('viewer')?.scrollIntoView({ block: 'start' }))
await page.evaluate(() => window.scrollBy(0, 24))
await page.waitForTimeout(3500)
await page.screenshot({ path: 'public/share/cycling-brain.png' })
await browser.close()
console.log('wrote public/share/cycling-brain.png')
