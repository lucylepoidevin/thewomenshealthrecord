import { useMemo, useState } from 'react'
import { GRADE_HELP, GRADE_ORDER, NOT_LISTED, explainerFor, type Grade, type IngredientsFile } from '../lib/data'
import { buildIndex, match, norm, tokenize, type Hit } from '../lib/match'

const SAMPLE = 'Aqua, Glycerin, Cetearyl Alcohol, Methylparaben, Propylparaben, Cyclopentasiloxane, Butylphenyl Methylpropional, Benzophenone-3, Parfum, Titanium Dioxide (CI 77891)'

function GradeTag({ g, names }: { g: Grade; names: Record<Grade, string> }) {
  return <span className={`grade grade-${g}`}>{names[g]}</span>
}

/** Paste box, parsed ingredient list, one card per flagged ingredient. */
export default function Checker({ file }: { file: IngredientsFile }) {
  const [text, setText] = useState('')
  const idx = useMemo(() => buildIndex(file), [file])
  const tokens = useMemo(() => tokenize(text), [text])
  const hits = useMemo(() => match(tokens, idx), [tokens, idx])
  const byGrade = (g: Grade) => hits.filter(h => h.ingredient.top_grade === g)
  const fragrance = tokens.some(t => /^(parfum|fragrance|aroma|flavor|flavour)$/i.test(t.trim()))
  const hitTokens = useMemo(() => new Set(hits.map(h => h.token)), [hits])
  const notListed = useMemo(() => tokens.filter(t => !hitTokens.has(t) && NOT_LISTED[norm(t)]).map(t => [t.trim(), NOT_LISTED[norm(t)]] as const), [tokens, hitTokens])
  return (
    <section id="checker" className="mx-auto max-w-4xl px-4">
      <div className="mb-4 border-l-2 border-berry pl-4 py-1 text-sm text-ink-2">
        <strong className="text-ink">What this is.</strong> A lookup against three official lists, reported in each list's own terms. Inclusion on a list indicates that a chemical <em>can</em> be harmful under some conditions; it does not indicate that a product is harmful. No scores, rankings or brands are given.
      </div>
      <label className="block">
        <span className="eyebrow">Paste an ingredient list</span>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={5} spellCheck={false} placeholder={SAMPLE}
          className="ctl mt-2 w-full font-mono text-[13px] leading-relaxed" aria-label="Ingredient list" />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
        <button type="button" className="text-berry underline underline-offset-2" onClick={() => setText(SAMPLE)}>Try an example</button>
        {text && <button type="button" className="text-berry underline underline-offset-2" onClick={() => setText('')}>Clear</button>}
        {tokens.length > 0 && <span>{tokens.length} ingredients read · {hits.length} on a list · lists dated {file.generated}</span>}
      </div>

      {tokens.length > 0 && (
        <div className="mt-6">
          <div className="rule pt-4">
            <p className="text-xs text-ink-3 mb-2">Ingredients read ({tokens.length}); those on a list are marked.</p>
            <p className="text-[13px] leading-relaxed text-ink-2">
              {tokens.map((t, i) => { const on = hitTokens.has(t); return <span key={i} className={on ? 'text-berry font-semibold' : ''}>{t.replace(/\s+/g, ' ')}{i < tokens.length - 1 ? ', ' : ''}</span> })}
            </p>
          </div>
          {hits.length === 0 && (
            <p className="mt-4 text-ink-2">None of the {tokens.length} ingredients read is on EU List I, II or III or on California's Proposition 65 list (lists dated {file.generated}){fragrance ? ', apart from an undisclosed fragrance, which cannot be checked' : ''}. This is a statement about those three lists rather than a safety assessment; ingredients that appear on non-official lists are not flagged here.</p>
          )}
          {notListed.length > 0 && (
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-2">
              {notListed.map(([t, n]) => <li key={t}><strong className="text-ink">{t}.</strong> {n.note} <a href={n.url} target="_blank" rel="noreferrer" className="text-berry underline underline-offset-2">{n.source}</a>.</li>)}
            </ul>
          )}
          {GRADE_ORDER.map(g => byGrade(g).length > 0 && (
            <div key={g} className="mb-8">
              <div className="rule pt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <GradeTag g={g} names={file.grade_names} />
                <span className="text-xs text-ink-3">{GRADE_HELP[g]}</span>
              </div>
              <ul className="mt-3 space-y-5">
                {byGrade(g).map(h => <Card key={h.ingredient.id} hit={h} file={file} />)}
              </ul>
            </div>
          ))}
          {fragrance && (
            <p className="rule pt-4 text-sm text-ink-2"><strong className="text-ink">"Parfum" or "fragrance"</strong> denotes a mixture that need not be itemised on the label. Several listed substances are fragrance ingredients (butylphenyl methylpropional, benzyl salicylate, some musks). Ingredients covered by that term cannot be checked.</p>
          )}
        </div>
      )}
    </section>
  )
}

function Card({ hit, file }: { hit: Hit; file: IngredientsFile }) {
  const i = hit.ingredient
  const [open, setOpen] = useState(false)
  const rows = [...i.grades].sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade) || String(b.year ?? '').localeCompare(String(a.year ?? '')))
  const explainer = explainerFor(file, i)
  return (
    <li className="grid gap-2 sm:grid-cols-[1fr_2fr]">
      <div>
        <p className="font-semibold text-ink">{hit.token.replace(/\s+/g, ' ')}</p>
        <p className="text-xs text-ink-3">{i.name}{i.cas.length ? ` · CAS ${i.cas[0]}` : ''}{hit.matched.toLowerCase() !== hit.token.toLowerCase().trim() ? ` · matched as "${hit.matched}"` : ''}</p>
      </div>
      <div className="text-sm leading-relaxed text-ink-2">
        {explainer ? <p>{explainer}</p> : <p>Listed as shown below. No plain-language note has yet been written for this ingredient.</p>}
        <button type="button" onClick={() => setOpen(o => !o)} className="mt-1 text-xs text-berry underline underline-offset-2">{open ? 'Hide' : 'Show'} the listings ({rows.length})</button>
        {open && (
          <table className="mt-2 w-full text-xs">
            <tbody>
              {rows.map((r, k) => (
                <tr key={k} className="border-t border-hairline/70 align-top">
                  <td className="py-1 pr-2 whitespace-nowrap"><GradeTag g={r.grade} names={file.grade_names} /></td>
                  <td className="py-1 pr-2">{r.list}{r.status ? ` · ${r.status}` : ''}{r.field ? ` · ${r.field}` : ''}{r.year ? ` · ${r.year}` : ''}{r.grade !== 'california' && (r.health || r.env) ? ` · ${[r.health && 'human health', r.env && 'environment'].filter(Boolean).join(' and ')}` : ''}</td>
                  <td className="py-1 text-right whitespace-nowrap"><a href={file.sources[r.source]?.url} target="_blank" rel="noreferrer" className="text-berry underline underline-offset-2">source</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </li>
  )
}
