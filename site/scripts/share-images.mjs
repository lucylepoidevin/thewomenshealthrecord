// Share-card images for chapters 4-6: the chapter header at 1200x630. Usage: node scripts/share-images.mjs [baseUrl]
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
const base = process.argv[2] ?? 'http://localhost:5174/thewomenshealthrecord/'
const out = fileURLToPath(new URL('../public/share/', import.meta.url))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
for (const slug of ['who-gets-studied', 'sent-home-with-a-label', 'male-default']) {
  await page.goto(base + '#/chapters/' + slug, { waitUntil: 'networkidle' })
  await page.waitForSelector('article > header')
  await page.addStyleTag({ content: '.fade-up{animation:none!important} header.sticky{display:none!important} article > header{padding:0 1rem!important;min-height:630px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center} .progress-bar{display:none!important}' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${out}${slug}.png`, clip: { x: 0, y: 0, width: 1200, height: 630 } })
  console.log('saved', slug)
}
await browser.close()
