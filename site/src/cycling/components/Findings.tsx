import { fmt, type Cycle } from '../lib/data'

const MTL = ['hippocampus', 'entorhinal', 'parahippocampal', 'amygdala']
const SHOW = [...MTL, 'fusiform', 'temporal_pole', 'thalamus', 'caudate', 'putamen', 'pallidum', 'accumbens', 'ventral_dc', 'anterior_cingulate', 'posterior_cingulate', 'precuneus', 'insula_anterior', 'superior_frontal', 'cerebral_wm', 'cortical_gm', 'cerebellum', 'brainstem', 'total_brain', 'lateral_ventricles', 'third_fourth_ventricles']

/**
 * Sentences and a table written from the numbers in cycle.json, so the text
 * can never drift from the data. Correlations are same-day Pearson r across
 * the scanned days in one person: descriptive, not a test of anything.
 */
export function FindingsProse({ cycle }: { cycle: Cycle }) {
  const s = cycle.stats
  const h = s.hippocampus, tb = s.total_brain, lv = s.lateral_ventricles
  if (!h || !tb || !lv) return <p>Volumes have not been measured yet.</p>
  const dayVol = (k: string, d: number) => cycle.days[d - 1].volumes[k]
  const devPct = (k: string, d: number) => (dayVol(k, d) / s[k].mean - 1) * 100
  return (
    <>
      <p>
        Across her {h.n} scans, her hippocampus (both sides together) measured <strong>{fmt.cm3(h.mean)} cm³</strong> on average.
        From one morning to the next it moved by about {h.cv_pct.toFixed(1)}% (that is its coefficient of variation). Its smallest reading came on
        day {h.min_day} ({fmt.pct(devPct('hippocampus', h.min_day))}) and its largest on day {h.max_day} ({fmt.pct(devPct('hippocampus', h.max_day))}).
        Her whole brain, ventricles excluded, averaged {fmt.cm3(tb.mean)} cm³ and wobbled by {tb.cv_pct.toFixed(2)}% day to day; her lateral ventricles,
        the fluid-filled spaces that are the most sensitive gauge of hydration and time of day, moved by {lv.cv_pct.toFixed(1)}%.
      </p>
      <p>
        Lined up against the same morning's blood draw, the same-day correlation between progesterone and hippocampal volume was
        r = {fmt.r(h.r_progesterone ?? 0)} ({fmt.p(h.p_progesterone ?? 1)}); with estradiol it was r = {fmt.r(h.r_estradiol ?? 0)} ({fmt.p(h.p_estradiol ?? 1)}).
        The table below gives the same figures for every region you can highlight above.
      </p>
    </>
  )
}

export function FindingsTable({ cycle }: { cycle: Cycle }) {
  const rows = SHOW.filter(k => cycle.stats[k]).map(k => ({ k, name: cycle.regions[k].name, s: cycle.stats[k] }))
  const strong = (p?: number) => p != null && p < 0.01
  return (
    <div className="table-wrap">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-ink-3">
            <th className="py-2 pr-3 font-semibold">Region</th>
            <th className="py-2 pr-3 font-semibold text-right">Mean cm³</th>
            <th className="py-2 pr-3 font-semibold text-right">Day-to-day CV</th>
            <th className="py-2 pr-3 font-semibold text-right">Range</th>
            <th className="py-2 pr-3 font-semibold text-right">r · progesterone</th>
            <th className="py-2 pr-3 font-semibold text-right">r · estradiol</th>
            <th className="py-2 font-semibold text-right">Lowest · highest day</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ k, name, s }) => (
            <tr key={k} className={`border-t border-hairline/70 ${MTL.includes(k) ? 'bg-white/40' : ''}`}>
              <td className="py-2 pr-3 font-semibold text-ink">{name}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt.cm3(s.mean)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{s.cv_pct.toFixed(2)}%</td>
              <td className="py-2 pr-3 text-right tabular-nums">{s.range_pct.toFixed(1)}%</td>
              <td className={`py-2 pr-3 text-right tabular-nums ${strong(s.p_progesterone) ? 'font-semibold text-berry' : ''}`}>{s.r_progesterone != null ? fmt.r(s.r_progesterone) : '–'}</td>
              <td className={`py-2 pr-3 text-right tabular-nums ${strong(s.p_estradiol) ? 'font-semibold text-berry' : ''}`}>{s.r_estradiol != null ? fmt.r(s.r_estradiol) : '–'}</td>
              <td className="py-2 text-right tabular-nums text-ink-2">{s.min_day} · {s.max_day}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-ink-3 leading-relaxed">
        Volumes measured in the brain's own space after inverting each day's affine. Same-day Pearson r across the scanned days; bold where p &lt; 0.01, uncorrected.
        With about a hundred region-by-hormone pairs in one person, a few will pass that line by chance. Treat them as things to look at again, not findings.
      </p>
    </div>
  )
}
