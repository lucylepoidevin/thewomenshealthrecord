import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type F = { file: string; rows: number; description: string; columns: Record<string, string> }

export default function Data() {
  const [idx, setIdx] = useState<{ generated: string; files: F[] } | null>(null)
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data/data_index.json`).then(r => r.json()).then(setIdx) }, [])
  const base = `${import.meta.env.BASE_URL}data/csv/`
  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-16 fade-up">
      <header className="text-center pb-10">
        <p className="eyebrow">Data</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">Take the numbers</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">Every chart on this site is drawn from these files. Download them, check them, build on them. The code that produces them is in the repository.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-[11rem_1fr] sm:gap-10 py-8 border-t border-hairline/70">
        <h2 className="eyebrow pt-1">How to cite</h2>
        <div className="text-[16px] leading-[1.7] text-ink space-y-3">
          <p>Lepoidevin L., <i>The Women's Health Record</i>, chapter and figure name, retrieved {idx?.generated ?? 'date'}, https://lucylepoidevin.github.io/thewomenshealthrecord/. Please also cite the underlying public sources named under each chart; they did the hard part.</p>
          <p className="text-sm text-ink-2">The analysis, text and charts are released for reuse with attribution. The underlying FDA, NIH, WHO, CDC and AHRQ data are public.</p>
        </div>
      </section>
      {idx?.files.map(f => (
        <section key={f.file} className="grid gap-3 sm:grid-cols-[11rem_1fr] sm:gap-10 py-8 border-t border-hairline/70">
          <div><a href={base + f.file} download className="inline-flex items-center gap-2 rounded-full bg-berry px-4 py-2 text-xs font-semibold text-white hover:bg-rose">Download CSV</a><div className="mt-2 text-[11px] text-ink-3">{f.file} · {f.rows.toLocaleString()} rows</div></div>
          <div>
            <p className="text-[16px] leading-[1.7] text-ink">{f.description}</p>
            {Object.keys(f.columns).length > 0 && (
              <dl className="mt-3 grid gap-1 text-[13px]">
                {Object.entries(f.columns).map(([k, v]) => <div key={k} className="grid grid-cols-[10rem_1fr] gap-3"><dt className="font-mono text-[12px] text-berry">{k}</dt><dd className="text-ink-2">{v}</dd></div>)}
              </dl>
            )}
          </div>
        </section>
      ))}
      <section className="grid gap-3 sm:grid-cols-[11rem_1fr] sm:gap-10 py-8 border-t border-hairline/70">
        <h2 className="eyebrow pt-1">JSON</h2>
        <p className="text-[16px] leading-[1.7] text-ink">The site itself reads richer JSON files, one per chapter, with every estimate and interval: <a className="text-berry underline underline-offset-2" href={`${import.meta.env.BASE_URL}data/chapter1.json`}>chapter1.json</a>, <a className="text-berry underline underline-offset-2" href={`${import.meta.env.BASE_URL}data/chapter2.json`}>chapter2.json</a>, <a className="text-berry underline underline-offset-2" href={`${import.meta.env.BASE_URL}data/chapter2_models.json`}>chapter2_models.json</a>, <a className="text-berry underline underline-offset-2" href={`${import.meta.env.BASE_URL}data/chapter3.json`}>chapter3.json</a>, <a className="text-berry underline underline-offset-2" href={`${import.meta.env.BASE_URL}data/chapter3_sensitivity.json`}>chapter3_sensitivity.json</a>, <a className="text-berry underline underline-offset-2" href={`${import.meta.env.BASE_URL}data/chapter4.json`}>chapter4.json</a>, <a className="text-berry underline underline-offset-2" href={`${import.meta.env.BASE_URL}data/chapter5.json`}>chapter5.json</a>, <a className="text-berry underline underline-offset-2" href={`${import.meta.env.BASE_URL}data/chapter6.json`}>chapter6.json</a> and <a className="text-berry underline underline-offset-2" href={`${import.meta.env.BASE_URL}data/sources.json`}>sources.json</a>. Field definitions are on the <Link to="/methods" className="text-berry underline underline-offset-2">methods page</Link>.</p>
      </section>
    </div>
  )
}
