// Render an experiment page at share-card size → public/share/<slug>.png  (node scripts/og-experiment.mjs pregnancy-brain)
// Needs the dev server running (npm run dev) on 5173.
import { chromium } from 'playwright'
const slug = process.argv[2] ?? 'cycling-brain'
const url = `http://localhost:5173/thewomenshealthrecord/#/${slug}`
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.waitForSelector('#viewer, #finder, #checker', { timeout: 15000 }).catch(() => {})
await page.waitForTimeout(800)
await page.evaluate(() => (document.getElementById('viewer') ?? document.getElementById('finder') ?? document.getElementById('checker'))?.scrollIntoView({ block: 'start', behavior: 'instant' }))
await page.evaluate(() => window.scrollBy({ top: 24, behavior: 'instant' }))
await page.waitForTimeout(3500)
console.log('scrollY', await page.evaluate(() => window.scrollY))
await page.screenshot({ path: `public/share/${slug}.png` })
await browser.close()
console.log(`wrote public/share/${slug}.png`)
