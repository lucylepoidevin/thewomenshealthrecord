// Generate static share pages: dist/chapters/<slug>/index.html with Open Graph tags,
// redirecting to the hash route. Crawlers get the card; people get the chapter.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const site = 'https://lucylepoidevin.github.io/thewomenshealthrecord/'
// Titles and descriptions come from the same source files the site renders, so share cards never drift from the pages.
const src = fileURLToPath(new URL('../src/', import.meta.url))
const unq = t => t.replace(/\\'/g, "'")
const field = (line, key) => { const m = line.match(new RegExp(key + ": '((?:[^'\\\\]|\\\\.)*)'")); return m ? unq(m[1]) : null }
const pages = []
for (const line of readFileSync(src + 'lib/chapters.ts', 'utf8').split('\n')) {
  const slug = field(line, 'slug'); if (!slug) continue
  pages.push({ slug, title: field(line, 'title'), desc: field(line, 'dek'), img: `${slug}.png` })
}
// Experiments live outside /chapters/; `path` overrides the folder and hash route.
for (const entry of readFileSync(src + 'experiments/list.ts', 'utf8').match(/\{ n: \d+,[\s\S]*?\},?\n/g) ?? []) {
  const path = field(entry, 'path'); if (!path) continue
  const slug = path.replace(/^\//, '')
  pages.push({ slug, path: slug, title: field(entry, 'title'), desc: field(entry, 'dek'), img: `${slug}.png` })
}
const route = p => p.path ? p.path : `chapters/${p.slug}`
const html = p => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${p.title} · The Women's Health Record</title>
<meta name="description" content="${p.desc}"><meta property="og:type" content="article"><meta property="og:site_name" content="The Women's Health Record">
<meta property="og:title" content="${p.title}"><meta property="og:description" content="${p.desc}"><meta property="og:image" content="${site}share/${p.img}"><meta property="og:url" content="${site}${route(p)}/">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${p.title}"><meta name="twitter:description" content="${p.desc}"><meta name="twitter:image" content="${site}share/${p.img}">
<meta http-equiv="refresh" content="0; url=${site}#/${route(p)}"><link rel="canonical" href="${site}#/${route(p)}">
<style>body{font-family:system-ui;background:#FDF2F5;color:#2A1F26;padding:3rem;text-align:center}a{color:#8B1E4B}</style></head>
<body><p>Opening <a href="${site}#/${route(p)}">${p.title}</a>…</p></body></html>`
for (const p of pages) { mkdirSync(`${dist}${route(p)}`, { recursive: true }); writeFileSync(`${dist}${route(p)}/index.html`, html(p)); console.log('share page', route(p)) }
