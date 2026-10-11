import { useMemo, useState } from 'react'
import ConcChart, { type Series } from './charts/ConcChart'
import Params from './Params'
import { PROFILE_COLOR, clock, fmt, paramsFor, type DrugsFile } from '../lib/data'
import { at, auc, halfLife, peak, simulateDay } from '../lib/pk'

const FEMALE_STATES: Record<string, string> = { female: 'No hormonal contraception', female_pill: 'On the pill', female_pregnant: 'Late pregnancy' }

/** The simulator: a drug, a sex, a body weight, a hormonal state, and the curves they imply. */
export default function Simulator({ file }: { file: DrugsFile }) {
  const [drugKey, setDrugKey] = useState(file.drugs[0].key)
  const [weight, setWeight] = useState(65)
  const [state, setState] = useState('female')
  const [showMale, setShowMale] = useState(true)
  const [showAlt, setShowAlt] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const drug = file.drugs.find(d => d.key === drugKey)!
  const states = Object.keys(drug.profiles).filter(k => k.startsWith('female'))
  const femaleKey = drug.profiles[state] ? state : 'female'
  const hasMale = !!drug.profiles.male

  const series: Series[] = useMemo(() => {
    const out: Series[] = []
    const w = drug.weight_scaling ? weight : 70
    const { dose_mg, times } = drug.regimen
    out.push({ key: femaleKey, name: drug.profiles[femaleKey].name, curve: simulateDay(paramsFor(drug, femaleKey, w), times, dose_mg) })
    if (hasMale && showMale) out.push({ key: 'male', name: drug.profiles.male.name, curve: simulateDay(paramsFor(drug, 'male', w), times, dose_mg) })
    if (drug.alt_dose && showAlt) out.push({ key: `${drug.alt_dose.profile}_alt`, name: drug.alt_dose.label, dashed: true, color: PROFILE_COLOR[drug.alt_dose.profile], curve: simulateDay(paramsFor(drug, drug.alt_dose.profile, w), times, drug.alt_dose.dose_mg) })
    return out
  }, [drug, femaleKey, weight, showMale, showAlt, hasMale])

  const her = series[0], him = series.find(s => s.key === 'male')
  const pHer = paramsFor(drug, femaleKey, drug.weight_scaling ? weight : 70)
  const bedtime = 23, morning = 7
  const herPeak = peak(her.curve)
  const ratio = him ? auc(her.curve) / auc(him.curve) : null
  const mgInBody = (c: number) => c * pHer.V

  return (
    <section id="simulator" className="mx-auto max-w-6xl px-4">
      <div className="mb-4 border-l-2 border-berry pl-4 py-1 text-sm text-ink-2">
        <strong className="text-berry">Educational only.</strong> These curves are population averages from small studies of healthy adults, drawn with a simple model. They are not dosing advice. Never change a dose without your doctor or pharmacist.
      </div>
      <div className="graphic-card p-4 sm:p-6">
        <div className="flex flex-wrap mb-4 rule pt-1">
          {file.drugs.map(d => (
            <button key={d.key} type="button" onClick={() => { setDrugKey(d.key); setState('female'); setShowAlt(false) }}
              className={`tab ${d.key === drugKey ? 'is-active' : ''}`}>{d.short}</button>
          ))}
        </div>
        <p className="text-sm text-ink-2 mb-4 max-w-3xl">{drug.what} <span className="text-ink">Shown: {drug.regimen.label}.</span></p>
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Her hormonal state</span>
              <select value={femaleKey} onChange={e => setState(e.target.value)} className="ctl">
                {states.map(k => <option key={k} value={k}>{FEMALE_STATES[k] ?? drug.profiles[k].name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Body weight · {weight} kg {!drug.weight_scaling && <span className="normal-case tracking-normal text-ink-3">(not used for this drug)</span>}</span>
              <input type="range" min={45} max={120} step={1} value={weight} onChange={e => setWeight(Number(e.target.value))} className="day-slider mt-3 mb-1" disabled={!drug.weight_scaling} aria-label="Body weight in kilograms" />
              <span className="text-[11px] text-ink-3">Volume and clearance scale with weight, as the studies report them per kilogram.</span>
            </label>
            {hasMale && (
              <label className="flex items-center gap-2 text-sm text-ink-2"><input type="checkbox" checked={showMale} onChange={e => setShowMale(e.target.checked)} /> Show the men's curve (the body most doses were set on)</label>
            )}
            {drug.alt_dose && (
              <label className="flex items-center gap-2 text-sm text-ink-2"><input type="checkbox" checked={showAlt} onChange={e => setShowAlt(e.target.checked)} /> {drug.alt_dose.label}</label>
            )}
            <div className="panel text-sm leading-relaxed">
              <p className="eyebrow mb-2">Read-outs · {drug.profiles[femaleKey].name.toLowerCase()}</p>
              <p>Half-life <strong className="text-ink">{fmt.h(halfLife(pHer))}</strong></p>
              <p>Peak <strong className="text-ink">{fmt.conc(herPeak.c, drug.unit)}</strong> at {clock(herPeak.t)}</p>
              <p>At bedtime (11 pm) <strong className="text-ink">{fmt.conc(at(her.curve, bedtime), drug.unit)}</strong>{drug.key === 'caffeine' && <span className="text-ink-2"> ≈ {Math.round(mgInBody(at(her.curve, bedtime)))} mg still in the body, {(mgInBody(at(her.curve, bedtime)) / drug.regimen.dose_mg).toFixed(1)} cups' worth</span>}</p>
              <p>Next morning (7 am) <strong className="text-ink">{fmt.conc(at(her.curve, morning), drug.unit)}</strong></p>
              {ratio != null && <p className="mt-2 border-t border-hairline/60 pt-2">Her day's total exposure vs the men's curve: <strong className="text-berry">{fmt.x(ratio)}</strong></p>}
            </div>
          </div>
          <div>
            <ConcChart drug={drug} series={series} hoverHour={hover} onHover={setHover} />
          </div>
        </div>
        <div className="mt-5"><Params file={file} drug={drug} profiles={[femaleKey, ...(hasMale ? ['male'] : [])]} /></div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-3">Hover or tap the chart to read every curve. The day shown is the fifth identical day, so repeated doses have settled. Night shaded 11 pm to 7 am.</p>
    </section>
  )
}
