export type Src = { id: string; n: number; text: string; url: string }
/** Sources are numbered in the order they first appear on the page; the ids match drugs.json. */
const ORDER = ['fdazolpidem2013', 'zucker2020', 'abernethy1982', 'miners1983', 'rawlins1977', 'anderson2008', 'abernethy1985', 'wahllander1989', 'knutti1982', 'lane1992', 'blanchard1983', 'fdacaffeine', 'luzier1999', 'eugene2016', 'lopressor2023', 'toprol2024']
export function numbered(sources: Record<string, { text: string; url: string }>): Src[] {
  const ids = [...ORDER.filter(i => sources[i]), ...Object.keys(sources).filter(i => !ORDER.includes(i))]
  return ids.map((id, i) => ({ id, n: i + 1, ...sources[id] }))
}
