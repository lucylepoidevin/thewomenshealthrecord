import { useMemo, useRef, useState } from 'react'
import { DENSITIES, LETTER, SHORT, img, type Case, type Density, type DensityFile } from '../lib/data'

type Guess = { x: number; y: number } | 'none' | null
type Tally = Record<Density, { shown: number; masses: number; found: number; falseAlarms: number }>
const emptyTally = (): Tally => ({ fatty: z(), scattered: z(), hetero: z(), dense: z() })
const z = () => ({ shown: 0, masses: 0, found: 0, falseAlarms: 0 })

/** Hit if the click lands within the mass or a short margin around it (1.5 radii plus 2% of the width). */
function hit(c: Case, g: { x: number; y: number }, aspect: number) {
  if (!c.lesion || c.radius_frac == null) return false
  const dx = g.x - c.lesion.x, dy = (g.y - c.lesion.y) / aspect   // y fractions scaled into x units
  return Math.hypot(dx, dy) <= c.radius_frac * 1.5 + 0.02
}

/**
 * Pick a density, look at one synthetic mammogram, click where you think the mass is or say there is
 * none, then see the answer. Cases are drawn at the clinical dose without repeats until every case
 * in that density has been shown. The tally is per density, for this session only.
 */
export default function Finder({ file }: { file: DensityFile }) {
  const [density, setDensity] = useState<Density>('fatty')
  const [cur, setCur] = useState<Case | null>(() => { const p = file.msynth.cases.filter(c => c.density === 'fatty' && c.dose === 100); return p[Math.floor(Math.random() * p.length)] })
  const [seen, setSeen] = useState<Record<string, true>>(() => (cur ? { [cur.id]: true } : {}))
  const [guess, setGuess] = useState<Guess>(null)
  const [revealed, setRevealed] = useState(false)
  const [tally, setTally] = useState<Tally>(emptyTally)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const pool = useMemo(() => file.msynth.cases.filter(c => c.density === density && c.dose === 100), [file, density])

  const next = (d: Density = density) => {
    const p = file.msynth.cases.filter(c => c.density === d && c.dose === 100)
    let fresh = p.filter(c => !seen[c.id])
    if (fresh.length === 0) { fresh = p; setSeen({}) }
    const c = fresh[Math.floor(Math.random() * fresh.length)]
    setCur(c); setGuess(null); setRevealed(false)
    setSeen(s => ({ ...s, [c.id]: true }))
  }

  const choose = (d: Density) => { setDensity(d); next(d) }
  const onClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (revealed || !cur) return
    const r = e.currentTarget.getBoundingClientRect()
    setGuess({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height })
  }
  const aspect = cur ? cur.h / cur.w : 1
  const reveal = () => {
    if (!cur || guess == null) return
    const found = guess !== 'none' && hit(cur, guess, aspect)
    const falseAlarm = guess !== 'none' && !found
    setTally(t => ({ ...t, [density]: { shown: t[density].shown + 1, masses: t[density].masses + (cur.lesion ? 1 : 0), found: t[density].found + (found ? 1 : 0), falseAlarms: t[density].falseAlarms + (falseAlarm ? 1 : 0) } }))
    setRevealed(true)
  }
  const verdict = () => {
    if (!cur || guess == null) return ''
    if (cur.lesion) {
      if (guess === 'none') return `There was a ${cur.size_mm} mm mass. It is circled.`
      return hit(cur, guess, aspect) ? `Found it: a ${cur.size_mm} mm mass.` : `Missed. The ${cur.size_mm} mm mass is circled; your mark is the small dot.`
    }
    return guess === 'none' ? 'Correct: no mass in this image.' : 'There was no mass in this image. The marked region is ordinary fibroglandular tissue, which is how false alarms arise.'
  }
  const t = tally[density]
  return (
    <section id="finder" className="mx-auto max-w-5xl px-4">
      <div className="mb-4 border-l-2 border-berry pl-4 py-1 text-sm text-ink-2">
        <strong className="text-ink">What this is.</strong> Synthetic mammograms simulated by the US FDA (M-SYNTH); they are not images of patients. Some contain one round mass of 5, 7 or 9 mm; some contain none. Click where you think the mass is, or indicate that there is none, then reveal the answer. The exercise demonstrates the effect of density on an image; it is not a test of the reader or of mammography.
      </div>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        <span className="eyebrow mr-3">Density</span>
        {DENSITIES.map(d => <button key={d} type="button" className={`tab ${d === density ? 'is-active' : ''}`} onClick={() => choose(d)}>{LETTER[d]} · {SHORT[d]}</button>)}
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="relative inline-block max-w-full bg-black rounded-md overflow-hidden select-none" style={{ lineHeight: 0 }}>
            {cur && (
              <img ref={imgRef} src={img(cur)} alt={`Synthetic mammogram, ${SHORT[cur.density].toLowerCase()} breast`} onClick={onClick} draggable={false}
                className="block max-h-[72vh] w-auto max-w-full" style={{ cursor: revealed ? 'default' : 'crosshair' }} />
            )}
            {guess && guess !== 'none' && (
              <span className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-berry" style={{ left: `${guess.x * 100}%`, top: `${guess.y * 100}%`, background: revealed ? 'transparent' : 'var(--color-berry)' }} />
            )}
            {revealed && cur?.lesion && cur.radius_frac != null && (
              <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90" style={{ left: `${cur.lesion.x * 100}%`, top: `${cur.lesion.y * 100}%`, width: `${cur.radius_frac * 2 * 1.6 * 100}%`, aspectRatio: '1 / 1' }} />
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {!revealed ? (
              <>
                <button type="button" className={`btn ${guess === 'none' ? 'btn-solid' : ''}`} onClick={() => setGuess('none')}>No mass here</button>
                <button type="button" className="btn btn-solid" disabled={guess == null} style={{ opacity: guess == null ? 0.45 : 1 }} onClick={reveal}>Show the answer</button>
                <span className="text-xs text-ink-3">{guess == null ? 'Click the image to mark a location.' : guess === 'none' ? 'Marked as no mass.' : 'Location marked. Click again to move it.'}</span>
              </>
            ) : (
              <>
                <p className="text-sm text-ink"><strong>{verdict()}</strong> <span className="text-ink-3">Breast {LETTER[cur!.density]}, {SHORT[cur!.density].toLowerCase()}. M-SYNTH phantom {cur!.phantom}, clinical dose.</span></p>
                <button type="button" className="btn btn-solid" onClick={() => next()}>Next image</button>
              </>
            )}
          </div>
        </div>
        <aside className="text-sm">
          <p className="eyebrow">Tally for this density</p>
          <p className="mt-2 text-ink"><span className="display text-3xl font-light">{t.found}</span> <span className="text-ink-2">of {t.masses} masses found</span></p>
          <p className="text-ink-2">{t.falseAlarms} false alarm{t.falseAlarms === 1 ? '' : 's'} · {t.shown} of {pool.length} images seen</p>
          <div className="rule mt-4 pt-3">
            <p className="eyebrow">All four</p>
            <table className="mt-2 w-full text-xs">
              <tbody>
                {DENSITIES.map(d => (
                  <tr key={d} className={d === density ? 'text-ink' : 'text-ink-2'}>
                    <td className="py-1 pr-2">{LETTER[d]} {SHORT[d]}</td>
                    <td className="py-1 text-right tabular-nums">{tally[d].found} / {tally[d].masses}</td>
                    <td className="py-1 pl-2 text-right tabular-nums text-ink-3">{tally[d].falseAlarms} false</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="rule mt-4 pt-3 text-xs leading-relaxed text-ink-3">
            Radiologists read two views per breast at full resolution with magnification, on calibrated monitors, with reference to prior examinations. This single compressed view is a demonstration and not a clinical reading.
          </p>
        </aside>
      </div>
    </section>
  )
}
