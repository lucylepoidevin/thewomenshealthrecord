import { useState } from 'react'
import { DENSITIES, LETTER, SHORT, img, type Density, type DensityFile } from '../lib/data'

/** The same phantom, same 7 mm mass, imaged at the clinical dose and at a fifth of it. */
export default function DosePair({ file }: { file: DensityFile }) {
  const [density, setDensity] = useState<Density>('scattered')
  const [show, setShow] = useState(true)
  const pair = (dose: number) => file.msynth.cases.find(c => c.density === density && c.size_mm === 7 && c.dose === dose && c.phantom === 1)
  const a = pair(100), b = pair(20)
  if (!a || !b) return null
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {DENSITIES.map(d => <button key={d} type="button" className={`tab ${d === density ? 'is-active' : ''}`} onClick={() => setDensity(d)}>{LETTER[d]} · {SHORT[d]}</button>)}
        <label className="ml-auto flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /> circle the mass</label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[['Clinical dose', a], ['One fifth of the dose', b]].map(([label, c]) => typeof c === 'string' ? null : (
          <figure key={c.id}>
            <div className="relative inline-block max-w-full bg-black rounded-md overflow-hidden" style={{ lineHeight: 0 }}>
              <img src={img(c)} alt={`${label as string}, ${SHORT[density].toLowerCase()} breast`} className="block w-full" draggable={false} />
              {show && c.lesion && c.radius_frac != null && <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90" style={{ left: `${c.lesion.x * 100}%`, top: `${c.lesion.y * 100}%`, width: `${c.radius_frac * 2 * 1.6 * 100}%`, aspectRatio: '1 / 1' }} />}
            </div>
            <figcaption className="mt-2 text-xs text-ink-2">{label as string} · same phantom, same 7 mm mass</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
