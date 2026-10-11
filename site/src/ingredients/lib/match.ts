import type { Ingredient, IngredientsFile } from './data'

/** Same normalisation as the Python build: lower-case, ASCII, punctuation to spaces. */
export function norm(s: string) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ')
    .replace(/[()[\],;:/\\'"]/g, ' ').replace(/[-–—_.]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Split a pasted label into ingredient tokens. Commas, semicolons, bullets, line breaks; drops "Ingredients:" prefixes and percentages. */
export function tokenize(text: string): string[] {
  const cleaned = text.replace(/^\s*(ingredients?|inci|composition|ingrédients)\s*[:\-–]\s*/i, '').replace(/\bmay contain\b.*$/is, m => m) // keep may-contain list, it is still ingredients
  return cleaned.split(/[,;•·\n]+|\s{3,}/).map(t => t.replace(/\b\d+(\.\d+)?\s?%/g, '').replace(/\*+/g, '').trim()).filter(t => t.length > 1)
}

export type Hit = { token: string; matched: string; ingredient: Ingredient }

export function buildIndex(file: IngredientsFile) {
  const idx = new Map<string, { ing: Ingredient; syn: string }>()
  // hand-set label names first, so e.g. "Cyclopentasiloxane" lands on D5 and not on the cyclomethicone mixture
  for (const ing of file.ingredients) for (const s of ing.aliases ?? []) idx.set(norm(s), { ing, syn: s })
  for (const ing of file.ingredients) for (const s of ing.synonyms) {
    const k = norm(s)
    if (k.length >= 4 && !idx.has(k)) idx.set(k, { ing, syn: s })
  }
  return idx
}

/** Match each token: the whole token, the token without parentheticals, and each parenthetical on its own. */
export function match(tokens: string[], idx: Map<string, { ing: Ingredient; syn: string }>): Hit[] {
  const out: Hit[] = []
  const seen = new Set<string>()
  for (const t of tokens) {
    const cands = [t, t.replace(/\(.*?\)/g, ' '), ...Array.from(t.matchAll(/\((.*?)\)/g)).map(m => m[1])]
    let hit: { ing: Ingredient; syn: string } | undefined
    for (const c of cands) { hit = idx.get(norm(c)); if (hit) break }
    if (hit && !seen.has(hit.ing.id)) { seen.add(hit.ing.id); out.push({ token: t, matched: hit.syn, ingredient: hit.ing }) }
  }
  return out
}
