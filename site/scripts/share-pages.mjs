// Generate static share pages: dist/chapters/<slug>/index.html with Open Graph tags,
// redirecting to the hash route. Crawlers get the card; people get the chapter.
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const site = 'https://lucylepoidevin.github.io/thewomenshealthrecord/'
const pages = [
  { slug: 'tested-on-men', title: 'Tested on men, prescribed to women', desc: 'Every new drug the FDA has approved since 2015, scored on who was in the trial against who reports the side effects.', img: 'tested-on-men.png' },
  { slug: 'pain-gap', title: 'The urgency gap', desc: 'Twenty thousand emergency visits for pain and 377 heart attacks, 2018–2022: where women are rated lower, and where they are not.', img: 'pain-gap.png' },
  { slug: 'funding-vs-burden', title: 'The research dollar', desc: '67 diseases, their NIH budgets and the healthy years they cost Americans: where the money follows the burden and which conditions are never measured.', img: 'funding-vs-burden.png' },
  { slug: 'who-gets-studied', title: 'Who gets studied', desc: '56,591 trials and 21 million people: the share of women in each disease\'s trials against the share of women in the disease, and how few trials ever report what they found in women.', img: 'who-gets-studied.png' },
  { slug: 'sent-home-with-a-label', title: 'Where the diagnosis gap lives', desc: 'The story says she is sent home undiagnosed, under-tested and told it is anxiety. We looked in 20,808 emergency visits and 4.3 million cancer cases. The gap is real. It is not where the story puts it.', img: 'sent-home-with-a-label.png' },
  { slug: 'male-default', title: 'The male default body', desc: 'The animals drugs are tested on, the trials that follow, and the label you are handed: three places where the male body is still the standard, measured.', img: 'male-default.png' },
]
// Experiments live outside /chapters/; `path` overrides the folder and hash route.
pages.push({ slug: 'cycling-brain', path: 'cycling-brain', title: 'The cycling brain', desc: 'One woman scanned every morning for thirty days across a menstrual cycle, her hormones drawn alongside. Drag through the month and watch her brain.', img: 'cycling-brain.png' })
const route = p => p.path ? p.path : `chapters/${p.slug}`
const html = p => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${p.title} · The Women's Health Record</title>
<meta name="description" content="${p.desc}"><meta property="og:type" content="article"><meta property="og:site_name" content="The Women's Health Record">
<meta property="og:title" content="${p.title}"><meta property="og:description" content="${p.desc}"><meta property="og:image" content="${site}share/${p.img}"><meta property="og:url" content="${site}${route(p)}/">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${p.title}"><meta name="twitter:description" content="${p.desc}"><meta name="twitter:image" content="${site}share/${p.img}">
<meta http-equiv="refresh" content="0; url=${site}#/${route(p)}"><link rel="canonical" href="${site}#/${route(p)}">
<style>body{font-family:system-ui;background:#FDF2F5;color:#2A1F26;padding:3rem;text-align:center}a{color:#8B1E4B}</style></head>
<body><p>Opening <a href="${site}#/${route(p)}">${p.title}</a>…</p></body></html>`
for (const p of pages) { mkdirSync(`${dist}${route(p)}`, { recursive: true }); writeFileSync(`${dist}${route(p)}/index.html`, html(p)); console.log('share page', route(p)) }
