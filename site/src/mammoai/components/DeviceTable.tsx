import { Fragment, useState } from 'react'
import { ROLE_SHORT, fmtN, type Device } from '../lib/data'

const Y = ({ v }: { v: boolean }) => <span className={v ? 'text-ink' : 'text-ink-3'}>{v ? 'yes' : 'no'}</span>
/** Every clearance, newest first, with the quotes behind each coded value on demand. */
export default function DeviceTable({ devices }: { devices: Device[] }) {
  const [open, setOpen] = useState<string | null>(null)
  const rows = [...devices].sort((a, b) => b.year - a.year || b.decision_date.localeCompare(a.decision_date))
  return (
    <div className="table-wrap">
      <table className="w-full text-xs">
        <thead><tr className="text-left text-ink-3"><th className="py-1 pr-3">Decision</th><th className="py-1 pr-3">Device</th><th className="py-1 pr-3">Role</th><th className="py-1 pr-3 text-right">Test set</th><th className="py-1 pr-3">Where</th><th className="py-1 pr-3">Age</th><th className="py-1 pr-3">Race</th><th className="py-1 pr-3">Density</th><th className="py-1 pr-3">Subgroups</th><th className="py-1 pr-3">Vendors</th></tr></thead>
        <tbody>
          {rows.map(d => (
            <Fragment key={d.submission}>
              <tr className="border-t border-hairline/70 align-top cursor-pointer hover:bg-white/5" onClick={() => setOpen(o => o === d.submission ? null : d.submission)}>
                <td className="py-1 pr-3 whitespace-nowrap tabular-nums">{d.decision_date.slice(-4)} <a className="text-berry underline underline-offset-2" href={d.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{d.submission}</a></td>
                <td className="py-1 pr-3 min-w-[16rem]">{d.device}<span className="text-ink-3"> · {d.company}</span></td>
                <td className="py-1 pr-3 whitespace-nowrap">{ROLE_SHORT[d.role]}</td>
                <td className="py-1 pr-3 text-right tabular-nums whitespace-nowrap">{d.test_exams ? `${fmtN(d.test_exams)} ${d.test_exams_unit === 'not stated' ? '' : d.test_exams_unit}` : <span className="text-ink-3">not stated</span>}</td>
                <td className="py-1 pr-3 min-w-[7rem]">{d.test_countries.length ? d.test_countries.map(c => c === 'United States' ? 'US' : c === 'United Kingdom' ? 'UK' : c).join(', ') : <span className="text-ink-3">not stated</span>}</td>
                <td className="py-1 pr-3 whitespace-nowrap"><Y v={d.age_reported} /></td><td className="py-1 pr-3 whitespace-nowrap"><Y v={d.race_reported} /></td><td className="py-1 pr-3 whitespace-nowrap"><Y v={d.density_reported} /></td><td className="py-1 pr-3 whitespace-nowrap"><Y v={d.subgroup_performance_reported} /></td>
                <td className="py-1 pr-3 min-w-[10rem]">{d.vendors.length ? d.vendors.join(', ') : <span className="text-ink-3">not stated</span>}</td>
              </tr>
              {open === d.submission && (
                <tr className="bg-white/5"><td colSpan={10} className="px-3 py-3 text-[12px] leading-relaxed text-ink-2 whitespace-normal" style={{ maxWidth: 0 }}>
                  <p><strong className="text-ink">Intended use.</strong> {d.intended_use_short} <span className="text-ink-3">({d.modality}; {d.validation_type}; {d.population})</span></p>
                  {[['Test set', d.q_test_exams], ['Cancers', d.q_test_cancers], ['Sites', d.q_test_sites], ['Countries', d.q_test_countries], ['Period', d.q_test_period], ['Age', d.age_summary === 'not stated' ? '' : `${d.age_summary} · "${d.q_age}"`], ['Race', d.race_summary === 'not stated' ? '' : `${d.race_summary} · "${d.q_race}"`], ['Density', d.density_summary === 'not stated' ? '' : `${d.density_summary} · "${d.q_density}"`], ['Vendors', d.q_vendors], ['Readers', d.q_readers], ['Training data', d.training_summary === 'not stated' ? '' : `${d.training_summary} · "${d.q_training}"`], ['Subgroups', d.subgroup_summary === 'not stated' ? '' : d.subgroup_summary], ['Headline', d.headline_performance]].filter(([, v]) => v).map(([k, v]) => <p key={k as string}><strong className="text-ink">{k}.</strong> {v}</p>)}
                  {d.notes && <p><strong className="text-ink">Notes.</strong> {d.notes}</p>}
                  <p className="text-ink-3">Text extraction: {d.text_quality}. <a className="text-berry underline underline-offset-2" href={d.url} target="_blank" rel="noreferrer">Open the FDA document</a>.</p>
                </td></tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
