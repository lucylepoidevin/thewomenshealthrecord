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

const names = ['01-zolpidem-dumbbell', '02-beeswarm-trials', '03-scatter-ambien-corner', '04-table-corner', '05-zolpidem-usage-vs-reports', '06-reports-per-user', '07-summary', '08-lookup']
const cards = page.locator('.graphic-card')
const n = await cards.count()
for (let i = 0; i < Math.min(n, names.length); i++) {
  if (names[i] === '08-lookup') {
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

// ---- Chapter 2
{
  const b2 = await chromium.launch()
  const p2 = await b2.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
  await p2.goto(base + '#/chapters/pain-gap', { waitUntil: 'networkidle' })
  await p2.waitForSelector('.graphic-card')
  await p2.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important;transition:none!important} .fade-up{animation:none!important} .progress-bar{display:none!important}' })
  for (let y = 0; y < await p2.evaluate(() => document.body.scrollHeight); y += 700) { await p2.evaluate(v => window.scrollTo(0, v), y); await p2.waitForTimeout(80) }
  await p2.waitForTimeout(600)
  const names2 = ['ch2-01-severe-pain', 'ch2-02-triage-ambulance', 'ch2-03-analgesic-by-score', 'ch2-04-where-treatment-differs', 'ch2-05-wait-minutes', 'ch2-06-heart-attack', 'ch2-07-what-you-say', 'ch2-08-chest-pain-by-age', 'ch2-09-how-you-arrive', 'ch2-10-urgency-by-score', 'ch2-11-adjusted-odds', 'ch2-12-explorer', 'ch2-13-summary']
  const cards2 = p2.locator('.graphic-card')
  const n2 = await cards2.count()
  for (let i = 0; i < Math.min(n2, names2.length); i++) {
    await cards2.nth(i).scrollIntoViewIfNeeded(); await p2.waitForTimeout(250)
    await cards2.nth(i).screenshot({ path: `${out}${names2[i]}.png` }); console.log('saved', names2[i])
  }
  await p2.evaluate(() => window.scrollTo(0, 0))
  await p2.locator('article > header').screenshot({ path: `${out}ch2-00-header.png` })
  await b2.close()
}

// ---- Chapter 3
{
  const b3 = await chromium.launch()
  const p3 = await b3.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
  await p3.goto(base + '#/chapters/funding-vs-burden', { waitUntil: 'networkidle' })
  await p3.waitForSelector('.graphic-card')
  await p3.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important;transition:none!important} .fade-up{animation:none!important} .progress-bar{display:none!important}' })
  for (let y = 0; y < await p3.evaluate(() => document.body.scrollHeight); y += 700) { await p3.evaluate(v => window.scrollTo(0, v), y); await p3.waitForTimeout(80) }
  await p3.waitForTimeout(600)
  const names3 = ['ch3-01-funding-vs-burden', 'ch3-02-ratio-ranked', 'ch3-03-same-burden', 'ch3-04-uncounted', 'ch3-05-trend', 'ch3-06-explorer', 'ch3-07-summary']
  const cards3 = p3.locator('.graphic-card')
  const n3 = await cards3.count()
  for (let i = 0; i < Math.min(n3, names3.length); i++) {
    await cards3.nth(i).scrollIntoViewIfNeeded(); await p3.waitForTimeout(250)
    await cards3.nth(i).screenshot({ path: `${out}${names3[i]}.png` }); console.log('saved', names3[i])
  }
  await b3.close()
}

// ---- Record and Data pages
{
  const b4 = await chromium.launch()
  const p4 = await b4.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
  for (const [route, name] of [['record', 'site-record'], ['data', 'site-data'], ['corrections', 'site-corrections']]) {
    await p4.goto(base + '#/' + route, { waitUntil: 'networkidle' })
    await p4.addStyleTag({ content: '.fade-up{animation:none!important}' })
    await p4.waitForTimeout(500)
    await p4.screenshot({ path: `${out}${name}.png`, fullPage: true }); console.log('saved', name)
  }
  await b4.close()
}
