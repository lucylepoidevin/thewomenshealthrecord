// Headless screenshots of each Chapter 1 figure, for Substack and sharing.
// Usage: node scripts/screenshots.mjs [baseUrl]   (dev server must be running)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const base = process.argv[2] ?? 'http://localhost:5173/thewomenshealthrecord/'
const out = fileURLToPath(new URL('../../press/', import.meta.url))
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
await page.goto(base + '#/chapters/tested-on-men', { waitUntil: 'networkidle' })
await page.waitForSelector('.graphic-card')
await page.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important;transition:none!important} .fade-up{animation:none!important} .progress-bar{display:none!important}' })
// scroll through so ResizeObserver-driven charts lay out
for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 700) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(80) }
await page.waitForTimeout(600)

const names = ['01-zolpidem-dumbbell', '02-beeswarm-trials', '03-scatter-ambien-corner', '04-table-corner', '05-zolpidem-usage-vs-reports', '06-summary', '07-lookup']
const cards = page.locator('.graphic-card')
const n = await cards.count()
for (let i = 0; i < Math.min(n, names.length); i++) {
  if (names[i] === '07-lookup') {
    await page.fill('input[aria-label="Search drugs"]', 'Ozempic')
    await page.waitForTimeout(200)
    await page.locator('ul li button').first().click()
    await page.waitForTimeout(400)
  }
  await cards.nth(i).scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  await cards.nth(i).screenshot({ path: `${out}${names[i]}.png` })
  console.log('saved', names[i])
}
await page.evaluate(() => window.scrollTo(0, 0))
await page.locator('article > header').screenshot({ path: `${out}00-chapter-header.png` })
await page.goto(base, { waitUntil: 'networkidle' })
await page.addStyleTag({ content: '.fade-up{animation:none!important}' })
await page.locator('main > div > section').first().screenshot({ path: `${out}00-home-hero.png` })
console.log('saved headers')
await browser.close()
