// Phone-width screenshots of every route, for layout review. Usage: node scripts/mobile-shots.mjs <outDir> [baseUrl]
import { chromium, devices } from 'playwright'
const out = process.argv[2]; const base = process.argv[3] ?? 'http://localhost:5174/thewomenshealthrecord/'
const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['iPhone 13'] })
const page = await ctx.newPage()
for (const r of ['', 'chapters/tested-on-men', 'chapters/pain-gap', 'chapters/funding-vs-burden', 'chapters/who-gets-studied', 'chapters/sent-home-with-a-label', 'chapters/male-default', 'record', 'methods', 'data', 'about']) {
  await page.goto(base + '#/' + r, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important;transition:none!important} .fade-up{animation:none!important}' })
  for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 600) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(60) }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500)
  const h = await page.evaluate(() => document.body.scrollHeight)
  const name = (r || 'home').replace(/\//g, '-')
  // split very tall pages into slices of 2400px
  for (let i = 0, y = 0; y < h && i < 12; i++, y += 2400) {
    await page.screenshot({ path: `${out}/${name}-${i}.png`, clip: { x: 0, y, width: 390, height: Math.min(2400, h - y) }, fullPage: true })
  }
  console.log(name, h)
}
await browser.close()
