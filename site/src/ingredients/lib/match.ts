import type { Ingredient, IngredientsFile } from './data'

/** Same normalisation as the Python build: lower-case, ASCII, punctuation to spaces. */
export function norm(s: string) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ')
    .replace(/[()[\],;:/\\'"]/g, ' ').replace(/[-–—_.]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Split a pasted label into ingredient tokens. Handles commas, semicolons, bullets, line breaks, " | " and " / " used
 * as separators, full stops between items, numbered lines, and "Ingredients:" / "INCI:" / "Contains:" headings
 * anywhere in the text. Drops percentages, asterisks, "may contain" and "+/-" prefixes, and a lone heading line.
 */
export function tokenize(text: string): string[] {
  let t = text.replace(/\u00a0/g, ' ')
  t = t.replace(/\b(ingredients?|inci|composition|ingrédients|contains)\s*[:\-–—]?\s*/gi, '\n')
  t = t.replace(/\b(may contain|peut contenir|\+\/-|\(\+\/-\))\s*[:\-–—]?\s*/gi, '\n')
  // full stops between items: ". " followed by a capital or a line end, but not decimals like "0.5"
  t = t.replace(/(?<!\d)\.(?=\s|$)/g, '\n')
  // " | " and " / " as separators (a slash inside a name, like Water/Aqua, has no spaces around it)
  t = t.replace(/\s+[|/]\s+/g, '\n')
  const parts = t.split(/[,;•●▪·\n]+|\s{3,}/)
    .map(x => x.replace(/^\s*\d+[.)]\s+/, '').replace(/\b\d+(\.\d+)?\s?%/g, '').replace(/\*+/g, '').replace(/\s+/g, ' ').trim())
    .filter(x => x.length > 1 && !/^(ingredients?|inci|and|or|also|other)$/i.test(x))
  return parts
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
    const cands = [t, t.replace(/\(.*?\)/g, ' '), ...Array.from(t.matchAll(/\((.*?)\)/g)).map(m => m[1]), ...(t.includes('/') ? t.split('/') : [])]
    let hit: { ing: Ingredient; syn: string } | undefined
    for (const c of cands) { hit = idx.get(norm(c)); if (hit) break }
    if (hit && !seen.has(hit.ing.id)) { seen.add(hit.ing.id); out.push({ token: t, matched: hit.syn, ingredient: hit.ing }) }
  }
  return out
}
