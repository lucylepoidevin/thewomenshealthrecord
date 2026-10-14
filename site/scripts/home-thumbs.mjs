// Thumbnails for the home page, cut from the live pages themselves (dev server on 5173). node scripts/home-thumbs.mjs
import { chromium } from 'playwright'
const base = 'http://localhost:5173/thewomenshealthrecord/#'
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
const shots = [
  ['mammography-access', '/mammography-access', '#map svg', 3000],
  ['experiments', '/experiments', 'svg[height="728"]', 3000],
  ['cycling-brain', '/cycling-brain', '.brain-stage', 6000],
  ['pregnancy-brain', '/pregnancy-brain', '.brain-stage', 6000],
  ['male-brain', '/male-brain', '.brain-stage', 6000],
  ['your-dose', '/your-dose', '#simulator svg, section svg', 3000],
  ['mammography-ai', '/mammography-ai', '#timeline-chart svg', 3000],
  ['ingredient-check', '/ingredient-check', '#checker', 2500],
]
for (const [name, route, sel, wait] of shots) {
  await page.goto(base + route, { waitUntil: 'networkidle' }); await page.waitForTimeout(wait)
  if (name === 'ingredient-check') {
    await page.click('text=Try an example'); await page.waitForTimeout(800)
  }
  const el = await page.$(sel)
  if (!el) { console.log('missing', name, sel); continue }
  await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(600)
  await el.screenshot({ path: `public/home/${name}.png` })
  console.log('wrote', name)
}
await b.close()
