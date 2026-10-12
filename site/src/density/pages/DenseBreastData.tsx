import { Link } from 'react-router-dom'
import { SourceList } from '../components/Cite'
import { DATA, DENSITIES, LETTER, SHORT, fmtN, img, useDensity } from '../lib/data'

export default function DenseBreastData() {
  const { data } = useDensity()
  if (!data) return <p className="mx-auto max-w-2xl px-4 pt-16 text-center text-sm text-ink-3">Loading…</p>
  const st = data.stats
  return (
    <div className="mx-auto max-w-4xl px-4 pt-16 pb-24">
      <p className="eyebrow">Data · Experiment 6</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl font-light leading-tight">Data: breast density</h1>
      <p className="mt-4 text-ink-2 leading-relaxed">Everything the page uses, as one file: <a className="text-berry underline underline-offset-2" href={`${DATA}density.json`}>density.json</a> (generated {data.generated}). Images are in <code className="text-sm">data/density/img/</code>, one WebP per case, named by density, mass size, dose and M-SYNTH phantom number.</p>

      <h2 className="display mt-12 text-2xl font-medium">Cases ({data.msynth.cases.length})</h2>
      <p className="mt-1 text-sm text-ink-3">Mass contrast {data.msynth.contrast}; pixel pitch {data.msynth.px_mm} mm. Coordinates are fractions of the rendered image.</p>
      <div className="table-wrap mt-3">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-ink-3"><th className="py-1 pr-3">Case</th><th className="py-1 pr-3">Density</th><th className="py-1 pr-3">Mass</th><th className="py-1 pr-3">Dose</th><th className="py-1 pr-3">Centre (x, y)</th><th className="py-1 pr-3">Archive member</th></tr></thead>
          <tbody>
            {data.msynth.cases.map(c => (
              <tr key={c.id} className="border-t border-hairline/70">
                <td className="py-1 pr-3"><a className="text-berry underline underline-offset-2" href={img(c)} target="_blank" rel="noreferrer">{c.id}</a></td>
                <td className="py-1 pr-3">{LETTER[c.density]} {SHORT[c.density]}</td>
                <td className="py-1 pr-3">{c.lesion ? `${c.size_mm} mm` : 'none'}</td>
                <td className="py-1 pr-3">{c.dose}%</td>
                <td className="py-1 pr-3 tabular-nums">{c.lesion ? `${c.lesion.x.toFixed(3)}, ${c.lesion.y.toFixed(3)}` : ''}</td>
                <td className="py-1 pr-3 text-ink-3 break-all">{c.member}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="display mt-12 text-2xl font-medium">BCSC risk estimation dataset, {st.bcsc_risk.years}</h2>
      <p className="mt-1 text-sm text-ink-3">{st.bcsc_risk.note} {fmtN(st.bcsc_risk.exams)} mammograms in the file, {fmtN(st.bcsc_risk.with_density)} with a recorded density and age 40 to 79.</p>
      <div className="table-wrap mt-3">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-ink-3"><th className="py-1 pr-3">Density</th><th className="py-1 pr-3 text-right">Mammograms</th><th className="py-1 pr-3 text-right">Cancers within a year</th><th className="py-1 pr-3 text-right">Per 1,000</th></tr></thead>
          <tbody>{st.bcsc_risk.by_density.map(r => <tr key={r.density} className="border-t border-hairline/70"><td className="py-1 pr-3">{LETTER[r.density]} {SHORT[r.density]}</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(r.exams)}</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(r.cancers)}</td><td className="py-1 pr-3 text-right tabular-nums">{r.per1000}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="table-wrap mt-4">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-ink-3"><th className="py-1 pr-3">Age</th><th className="py-1 pr-3 text-right">Mammograms</th>{DENSITIES.map(d => <th key={d} className="py-1 pr-3 text-right">{LETTER[d]} share</th>)}{DENSITIES.map(d => <th key={d} className="py-1 pr-3 text-right">{LETTER[d]} per 1,000</th>)}</tr></thead>
          <tbody>{st.bcsc_risk.by_age.map(r => <tr key={r.age} className="border-t border-hairline/70"><td className="py-1 pr-3">{r.age}</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(r.exams)}</td>{r.share.map((v, i) => <td key={i} className="py-1 pr-3 text-right tabular-nums">{v}%</td>)}{r.per1000.map((v, i) => <td key={i} className="py-1 pr-3 text-right tabular-nums">{v}</td>)}</tr>)}</tbody>
        </table>
      </div>

      <h2 className="display mt-12 text-2xl font-medium">BCSC benchmarks, {st.bcsc_bench.years}</h2>
      <p className="mt-1 text-sm text-ink-3">{st.bcsc_bench.note}</p>
      {(['dm', 'dbt'] as const).map(k => {
        const b = st.bcsc_bench[k]
        return (
          <div key={k} className="table-wrap mt-3">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-ink-3"><th className="py-1 pr-3">{k === 'dm' ? 'Digital mammography' : 'Tomosynthesis'}</th><th className="py-1 pr-3 text-right">Exams</th><th className="py-1 pr-3 text-right">Share</th><th className="py-1 pr-3 text-right">Exams with cancer</th><th className="py-1 pr-3 text-right">Share of cancers</th><th className="py-1 pr-3 text-right">Cancers per 1,000</th></tr></thead>
              <tbody>
                {b.by_density.map(r => <tr key={r.density} className="border-t border-hairline/70"><td className="py-1 pr-3">{LETTER[r.density]} {SHORT[r.density]}</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(r.exams)}</td><td className="py-1 pr-3 text-right tabular-nums">{(100 * r.exams / b.exams).toFixed(1)}%</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(r.cancers)}</td><td className="py-1 pr-3 text-right tabular-nums">{(100 * r.cancers / b.cancers).toFixed(1)}%</td><td className="py-1 pr-3 text-right tabular-nums">{(1000 * r.cancers / r.exams).toFixed(1)}</td></tr>)}
                <tr className="border-t border-hairline/70 text-ink-3"><td className="py-1 pr-3">Unknown</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(b.unknown[0])}</td><td /><td className="py-1 pr-3 text-right tabular-nums">{fmtN(b.unknown[1])}</td><td /><td /></tr>
                <tr className="border-t border-hairline/70 font-semibold"><td className="py-1 pr-3">All · sensitivity {b.sensitivity}%, specificity {b.specificity}%, recall {b.recall}%, detection {b.cdr}/1,000</td><td className="py-1 pr-3 text-right tabular-nums">{fmtN(b.exams)}</td><td /><td className="py-1 pr-3 text-right tabular-nums">{fmtN(b.cancers)}</td><td /><td className="py-1 pr-3 text-right tabular-nums">{(1000 * b.cancers / b.exams).toFixed(1)}</td></tr>
              </tbody>
            </table>
          </div>
        )
      })}

      <h2 className="display mt-12 text-2xl font-medium">Interval cancers, Kerlikowske et al. 2015</h2>
      <p className="mt-1 text-sm text-ink-3">{st.interval.note} {fmtN(st.interval.exams)} mammograms, {fmtN(st.interval.women)} women, {st.interval.years}.</p>
      <div className="table-wrap mt-3">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-ink-3"><th className="py-1 pr-3">Group</th>{DENSITIES.map(d => <th key={d} className="py-1 pr-3 text-right">{LETTER[d]} {SHORT[d]}</th>)}</tr></thead>
          <tbody>
            {st.interval.by_age.map(r => <tr key={r.age} className="border-t border-hairline/70"><td className="py-1 pr-3">Age {r.age}</td>{r.v.map((v, i) => <td key={i} className="py-1 pr-3 text-right tabular-nums">{v ?? 'n/a'}</td>)}</tr>)}
            {st.interval.by_risk.map(r => <tr key={r.risk} className="border-t border-hairline/70"><td className="py-1 pr-3">5-year risk {r.risk}</td>{r.v.map((v, i) => <td key={i} className="py-1 pr-3 text-right tabular-nums">{v ?? 'n/a'}</td>)}</tr>)}
            <tr className="border-t border-hairline/70 text-ink-3"><td className="py-1 pr-3">Share of mammograms</td>{st.interval.share.map((v, i) => <td key={i} className="py-1 pr-3 text-right tabular-nums">{v}%</td>)}</tr>
          </tbody>
        </table>
      </div>

      <h2 className="display mt-12 text-2xl font-medium">Digital sensitivity by density, Kerlikowske et al. 2011</h2>
      <p className="mt-1 text-sm text-ink-3">{st.sens2011.note} {st.sens2011.years}.</p>
      <div className="table-wrap mt-3">
        <table className="w-full text-xs">
          <thead><tr className="text-left text-ink-3"><th className="py-1 pr-3">Density</th><th className="py-1 pr-3 text-right">Cancers</th><th className="py-1 pr-3 text-right">Sensitivity</th><th className="py-1 pr-3 text-right">95% CI</th><th className="py-1 pr-3 text-right">Specificity</th></tr></thead>
          <tbody>{st.sens2011.rows.map(r => <tr key={r.density} className="border-t border-hairline/70"><td className="py-1 pr-3">{LETTER[r.density]} {SHORT[r.density]}</td><td className="py-1 pr-3 text-right tabular-nums">{r.n}</td><td className="py-1 pr-3 text-right tabular-nums">{r.sens}%</td><td className="py-1 pr-3 text-right tabular-nums">{r.lo} to {r.hi}</td><td className="py-1 pr-3 text-right tabular-nums">{r.spec}%</td></tr>)}</tbody>
        </table>
      </div>

      <h2 className="display mt-12 text-2xl font-medium">Sources</h2>
      <div className="mt-3"><SourceList sources={data.sources} /></div>
      <p className="mt-12 text-sm text-ink-3">Back to <Link to="/dense-breast" className="text-berry underline underline-offset-2">the experiment</Link>.</p>
    </div>
  )
}
