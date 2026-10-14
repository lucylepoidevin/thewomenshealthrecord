import { useMemo, useState } from 'react'
import { GRADE_HELP, GRADE_ORDER, explainerFor, type Grade, type Ingredient, type IngredientsFile } from '../lib/data'
import { norm } from '../lib/match'
import { Card } from './Checker'

/** Display name: the first hand-set label name where one exists, otherwise the list's own name. */
export const displayName = (i: Ingredient) => (i.aliases && i.aliases[0]) || i.name.split(';')[0].trim()

/** Every chemical on the three lists, searchable by any name or CAS number and filterable by grade. */
export default function Browse({ file }: { file: IngredientsFile }) {
  const [q, setQ] = useState('')
  const [grade, setGrade] = useState<Grade | 'all'>('all')
  const [open, setOpen] = useState(false)
  const rows = useMemo(() => {
    const nq = norm(q)
    return file.ingredients
      .filter(i => grade === 'all' || i.top_grade === grade)
      .filter(i => !nq || norm(displayName(i)).includes(nq) || norm(i.name).includes(nq) || i.cas.some(c => c.includes(q.trim())) || (i.aliases ?? []).some(a => norm(a).includes(nq)) || i.synonyms.some(s => norm(s).includes(nq)))
      .sort((a, b) => GRADE_ORDER.indexOf(a.top_grade) - GRADE_ORDER.indexOf(b.top_grade) || displayName(a).localeCompare(displayName(b)))
  }, [file, q, grade])
  const counts = useMemo(() => Object.fromEntries(GRADE_ORDER.map(g => [g, file.ingredients.filter(i => i.top_grade === g).length])) as Record<Grade, number>, [file])
  const withNote = (i: Ingredient) => Boolean(explainerFor(file, i))
  return (
    <section id="browse" className="mx-auto max-w-4xl px-4 mt-14">
      <div className="rule pt-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="display text-2xl font-medium">The {file.ingredients.length} chemicals on the three lists</h2>
        <button type="button" className="text-sm text-berry underline underline-offset-2" onClick={() => setOpen(o => !o)}>{open ? 'Hide the list' : 'Browse the list'}</button>
      </div>
      {open && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
            <button type="button" className={`tab ${grade === 'all' ? 'is-active' : ''}`} onClick={() => setGrade('all')}>All {file.ingredients.length}</button>
            {GRADE_ORDER.map(g => <button key={g} type="button" className={`tab ${grade === g ? 'is-active' : ''}`} onClick={() => setGrade(g)}>{file.grade_names[g]} {counts[g]}</button>)}
          </div>
          <input className="ctl mt-3 w-full max-w-md" placeholder="Search a name, synonym or CAS number" value={q} onChange={e => setQ(e.target.value)} aria-label="Search the lists" />
          {grade !== 'all' && <p className="mt-2 text-xs text-ink-3">{GRADE_HELP[grade]}</p>}
          <p className="mt-3 text-xs text-ink-3">{rows.length} of {file.ingredients.length} shown{q ? ` for "${q}"` : ''}. Chemicals with a plain-language note are listed with it; the rest show the list entry only.</p>
          {rows.length === 0 && <p className="mt-3 text-sm text-ink-2">No chemical on the three lists matches "{q}". The lists are short: about three hundred chemicals against tens of thousands of cosmetic ingredients.</p>}
          <ul className="mt-4 space-y-5">
            {rows.slice(0, 120).map(i => <Card key={i.id} hit={{ token: displayName(i), matched: displayName(i), ingredient: i }} file={file} />)}
          </ul>
          {rows.length > 120 && <p className="mt-3 text-xs text-ink-3">Showing the first 120; search to narrow.</p>}
          <p className="mt-4 text-xs text-ink-3">{file.ingredients.filter(withNote).length} of the {file.ingredients.length} have a plain-language note.</p>
        </div>
      )}
    </section>
  )
}
