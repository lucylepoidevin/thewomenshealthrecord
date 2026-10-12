// Crawl every route on the dev server: console errors, page errors, failed requests, suspicious text, internal links, mobile overflow.
// node scripts/check-site.mjs  (dev server on 5173)
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
const app = readFileSync('src/App.tsx', 'utf8')
const routes = [...new Set([...app.matchAll(/path="([^"]+)"/g)].map(m => m[1]))].filter(r => r !== '*')
const base = 'http://localhost:5173/thewomenshealthrecord/#'
const browser = await chromium.launch()
const out = { routes: {}, external: new Set(), internalBad: [] }
for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)) })
  page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 200)))
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url().slice(0, 160)))
  page.on('response', r => { if (r.status() >= 400) errors.push(`http ${r.status()}: ` + r.url().slice(0, 160)) })
  for (const route of routes) {
    errors.length = 0
    await page.goto(base + route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    const info = await page.evaluate(() => {
      const text = document.body.innerText
      const bad = ['undefined', 'NaN', '[object Object]', 'null,', 'Could not load', 'Loading…', 'Loading the'].filter(s => text.includes(s))
      const links = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'))
      return { bad, links, overflow: document.documentElement.scrollWidth > window.innerWidth + 1, scrollWidth: document.documentElement.scrollWidth, title: document.title, h1: document.querySelector('h1')?.textContent?.trim().slice(0, 80), textLen: text.length }
    })
    const key = `${viewport.width}:${route}`
    out.routes[key] = { errors: [...errors], bad: info.bad, overflow: info.overflow, scrollWidth: info.scrollWidth, h1: info.h1, textLen: info.textLen }
    if (viewport.width === 1280) {
      for (const h of info.links) {
        if (!h) continue
        if (/^https?:/.test(h)) out.external.add(h)
        else if (h.startsWith('#/')) { const r = h.slice(1).split('?')[0]; if (!routes.includes(r) && !routes.includes(r.replace(/\/$/, ''))) out.internalBad.push(`${route} -> ${h}`) }
        else if (h.startsWith('/') && !h.startsWith('/thewomenshealthrecord')) out.internalBad.push(`${route} -> ${h}`)
      }
    }
  }
  await page.close()
}
await browser.close()
out.external = [...out.external].sort()
writeFileSync('/tmp/site-check.json', JSON.stringify(out, null, 1))
let problems = 0
for (const [k, v] of Object.entries(out.routes)) {
  if (v.errors.length || v.bad.length || v.overflow) { problems++; console.log(k, JSON.stringify({ errors: [...new Set(v.errors)], bad: v.bad, overflow: v.overflow, scrollWidth: v.scrollWidth })) }
}
console.log('routes checked:', routes.length, 'x2 viewports; routes with problems:', problems)
console.log('internal links not matching a route:', out.internalBad.length); out.internalBad.slice(0, 40).forEach(l => console.log('  ', l))
console.log('external links:', out.external.length)
