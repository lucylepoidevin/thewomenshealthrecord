// Render an experiment page at share-card size → public/share/<slug>.png  (node scripts/og-experiment.mjs pregnancy-brain)
// Needs the dev server running (npm run dev) on 5173.
import { chromium } from 'playwright'
const slug = process.argv[2] ?? 'cycling-brain'
const url = `http://localhost:5173/thewomenshealthrecord/#/${slug}`
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.evaluate(() => document.getElementById('viewer')?.scrollIntoView({ block: 'start' }))
await page.evaluate(() => window.scrollBy(0, 24))
await page.waitForTimeout(3500)
await page.screenshot({ path: `public/share/${slug}.png` })
await browser.close()
console.log(`wrote public/share/${slug}.png`)
