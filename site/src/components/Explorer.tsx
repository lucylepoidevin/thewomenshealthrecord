import { useState } from 'react'
import type { Cmp } from '../lib/types2'

type Cell = { complaint: string; age: string; n_women: number; n_men: number; metrics: Record<string, Cmp | null> }
const COMPLAINTS: [string, string][] = [['all', 'any pain'], ['abdominal', 'abdominal pain'], ['chest', 'chest pain'], ['back', 'back pain'], ['headache', 'a headache or migraine'], ['limb', 'neck, hip, leg or joint pain'], ['flank', 'flank, rib or groin pain']]
const AGES: [string, string][] = [['all', 'any age'], ['18-44', '18 to 44'], ['45-64', '45 to 64'], ['65+', '65 or older']]
const ROWS: { key: string; label: string; unit: string; note?: string }[] = [
  { key: 'severe_share', label: 'rate their pain 7 to 10', unit: '%' },
  { key: 'ems', label: 'arrive by ambulance', unit: '%' },
  { key: 'urgent', label: 'are triaged urgent', unit: '%' },
  { key: 'wait_mean', label: 'minutes to see a clinician', unit: ' min' },
  { key: 'analgesic_ed', label: 'are given any painkiller', unit: '%' },
  { key: 'opioid_ed', label: 'are given an opioid', unit: '%' },
  { key: 'anyimage', label: 'get any imaging', unit: '%' },
  { key: 'tests_count', label: 'tests ordered, on average', unit: '' },
  { key: 'admitted', label: 'are admitted', unit: '%' },
  { key: 'symptom_dx', label: 'leave with a symptom-only diagnosis', unit: '%', note: 'a code like "abdominal pain" rather than a condition' },
  { key: 'lov_mean', label: 'minutes in the department', unit: ' min' },
]

/** Pick a complaint and age band; see what the data says happens to women and men like that. */
export default function Explorer({ cells, source }: { cells: Cell[]; source: string }) {
  const [complaint, setComplaint] = useState('chest')
  const [age, setAge] = useState('45-64')
  const cell = cells.find(c => c.complaint === complaint && c.age === age)
  const fmt = (v: number, unit: string) => unit === '%' ? `${v.toFixed(0)}%` : unit === '' ? v.toFixed(1) : `${v.toFixed(0)}${unit}`
  const sel = 'rounded-full border border-hairline bg-white px-4 py-2 text-[15px] outline-none focus:border-rose focus:ring-4 focus:ring-rose/10'
  return (
    <div className="graphic-card p-5 sm:p-7">
      <h3 className="display text-lg sm:text-[1.35rem] font-medium leading-tight text-ink">Someone like you walks in</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
        Show me adults aged{' '}
        <select value={age} onChange={e => setAge(e.target.value)} className={sel} aria-label="Age band">{AGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        {' '}who came in with{' '}
        <select value={complaint} onChange={e => setComplaint(e.target.value)} className={sel} aria-label="Complaint">{COMPLAINTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </p>
      {cell && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
                <th className="py-2 pr-4 text-left font-bold">Of those visits…</th>
                <th className="py-2 pr-4 text-right font-bold text-rose">Women</th>
                <th className="py-2 pr-4 text-right font-bold text-bronze">Men</th>
                <th className="py-2 text-right font-bold">Gap</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(r => {
                const c = cell.metrics[r.key]
                if (!c) return null
                const clear = c.diff_lo > 0 || c.diff_hi < 0
                return (
                  <tr key={r.key} className="border-t border-hairline/60">
                    <td className="py-2.5 pr-4 text-ink">{r.label}{r.note && <div className="text-[11px] text-ink-3">{r.note}</div>}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums"><span className="font-semibold text-ink">{fmt(c.women.est, r.unit)}</span><div className="text-[11px] text-ink-3">{fmt(Math.max(0, c.women.lo), r.unit)}–{fmt(c.women.hi, r.unit)}</div></td>
                    <td className="py-2.5 pr-4 text-right tabular-nums"><span className="font-semibold text-ink">{fmt(c.men.est, r.unit)}</span><div className="text-[11px] text-ink-3">{fmt(Math.max(0, c.men.lo), r.unit)}–{fmt(c.men.hi, r.unit)}</div></td>
                    <td className={`py-2.5 text-right tabular-nums ${clear ? 'font-bold text-berry' : 'text-ink-3'}`}>{(r.unit === '' ? Math.abs(c.diff) < 0.05 : Math.abs(c.diff) < 0.5) ? '0' : (c.diff > 0 ? '+' : '') + (r.unit === '' ? c.diff.toFixed(1) : c.diff.toFixed(0))}{r.unit === '%' ? ' pts' : r.unit}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-ink-3">Based on {cell.n_women.toLocaleString()} sampled visits by women and {cell.n_men.toLocaleString()} by men. Small ranges under each number are 95% confidence intervals; a gap in bold is one the interval does not reach across. {source}</p>
        </div>
      )}
    </div>
  )
}
