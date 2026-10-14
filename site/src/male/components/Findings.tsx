import { fmt, type HerStats, type Male } from '../lib/data'

const SHOW = ['total_brain', 'cortical_gm', 'cerebral_wm', 'lateral_ventricles', 'third_fourth_ventricles', 'hippocampus', 'entorhinal', 'parahippocampal', 'amygdala', 'thalamus', 'caudate', 'putamen', 'pallidum',
  'precuneus', 'superior_parietal', 'occipital_pole', 'calcarine', 'posterior_cingulate', 'anterior_cingulate', 'superior_frontal', 'insula_anterior', 'fusiform', 'temporal_pole', 'cerebellum', 'brainstem']

/** Sentences written from the numbers. */
export function FindingsProse({ data, her }: { data: Male; her: HerStats | null }) {
  const s = data.stats
  const tb = s.total_brain, gm = s.cortical_gm, lv = s.lateral_ventricles, hip = s.hippocampus, wm = s.cerebral_wm
  if (!tb || !gm || !lv || !hip || !wm) return <p>Volumes have not been measured yet.</p>
  const hs = data.hormone_summary
  const ratio = (k: keyof typeof hs) => (hs[k].am_median / hs[k].pm_median).toFixed(1)
  const movers = Object.entries(s)
    .filter(([k, v]) => !['total_brain', 'cortical_gm', 'cerebral_wm', 'all_ventricles', 'lateral_ventricles', 'third_fourth_ventricles', 'accumbens'].includes(k) && (v.ampm_n_down ?? 0) >= 8 && (v.ampm_p ?? 1) < 0.05)
    .sort((a, b) => (a[1].ampm_mean_pct ?? 0) - (b[1].ampm_mean_pct ?? 0)).slice(0, 4)
    .map(([k, v]) => ({ k, name: data.regions[k].name, pct: v.ampm_mean_pct ?? 0 }))
  return (
    <>
      <p>
        First, the rhythm itself. His morning testosterone ran at a median of {fmt.n(hs.testosterone.am_median)} ng/dL and his evening testosterone at {fmt.n(hs.testosterone.pm_median)}:
        {' '}{ratio('testosterone')} times higher at 7 am. Cortisol swung harder, {fmt.n(hs.cortisol.am_median)} to {fmt.n(hs.cortisol.pm_median)} µg/dL, {ratio('cortisol')} times. Even his estradiol
        kept time, {fmt.n(hs.estradiol.am_median)} in the morning against {fmt.n(hs.estradiol.pm_median)} at night. Every day, twice a day, for a month.
      </p>
      <p>
        Now the brain. On the ten days he was scanned at both ends of the day, his whole brain, ventricles excluded, measured <strong>{fmt.pct(tb.ampm_mean_pct ?? 0, 2)}</strong> at 8 pm against 7 am
        (it was smaller in the evening on {tb.ampm_n_down} of {tb.ampm_n} days; {fmt.p(tb.ampm_p ?? 1)}). Cortical grey matter went {fmt.pct(gm.ampm_mean_pct ?? 0, 2)}, white matter {fmt.pct(wm.ampm_mean_pct ?? 0, 2)},
        and the lateral ventricles {fmt.pct(lv.ampm_mean_pct ?? 0, 2)}: the fluid spaces grew as the tissue around them shrank. The hippocampus read {fmt.pct(hip.ampm_mean_pct ?? 0, 2)}.
      </p>
      <p>
        Across all forty scans, his whole-brain volume varied by {tb.cv_pct.toFixed(2)}% and his hippocampus by {hip.cv_pct.toFixed(2)}%. Take only the mornings, so that time of day is held fixed,
        and the spread falls to {tb.am_cv_pct?.toFixed(2)}% and {hip.am_cv_pct?.toFixed(2)}%.
        {her && her.total_brain && her.hippocampus && (
          <> Her thirty mornings, on the same scanner with the same pipeline, came out at {her.total_brain.cv_pct.toFixed(2)}% and {her.hippocampus.cv_pct.toFixed(2)}%. Morning to morning,
          the two brains sit in the same narrow band, a few tenths of a percent, and his is if anything the steadier. The thing that moved his was the clock.</>
        )}
      </p>
      <p>
        Region by region, the evening shrinkage was not even. The clearest falls, down on at least eight of the ten days, were in {movers.map((m, i) => (
          <span key={m.k}>{i > 0 && (i === movers.length - 1 ? ' and ' : ', ')}the {m.name.toLowerCase()} ({fmt.pct(m.pct, 2)})</span>
        ))}, while the ventricles went the other way ({fmt.pct(lv.ampm_mean_pct ?? 0, 2)}). That is the pattern the lab reported with finer tools: a parietal and occipital lead, fluid filling in.
      </p>
    </>
  )
}

/** Her month beside his: day-to-day spread, region by region, mornings only on both sides. */
export function CompareTable({ data, her }: { data: Male; her: HerStats }) {
  const rows = SHOW.filter(k => data.stats[k] && her[k]).map(k => ({ k, name: data.regions[k].name, him: data.stats[k], she: her[k] }))
  return (
    <div className="table-wrap">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[12px] text-ink-3">
            <th className="py-2 pr-3 font-semibold">Region</th>
            <th className="py-2 pr-3 font-semibold text-right">Her mean cm³</th>
            <th className="py-2 pr-3 font-semibold text-right">His mean cm³</th>
            <th className="py-2 pr-3 font-semibold text-right">Her day-to-day spread</th>
            <th className="py-2 pr-3 font-semibold text-right">His, mornings</th>
            <th className="py-2 pr-3 font-semibold text-right">His, all 40</th>
            <th className="py-2 font-semibold text-right">His 7 am → 8 pm</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ k, name, him, she }) => (
            <tr key={k} className={`border-t border-hairline/70`}>
              <td className="py-2 pr-3 font-semibold text-ink">{name}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt.cm3(she.mean)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt.cm3(him.mean)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{she.cv_pct.toFixed(2)}%</td>
              <td className="py-2 pr-3 text-right tabular-nums">{him.am_cv_pct?.toFixed(2)}%</td>
              <td className="py-2 pr-3 text-right tabular-nums text-ink-2">{him.cv_pct.toFixed(2)}%</td>
              <td className={`py-2 text-right tabular-nums ${him.ampm_p != null && him.ampm_p < 0.01 ? 'font-semibold text-berry' : ''}`}>{him.ampm_mean_pct != null ? fmt.pct(him.ampm_mean_pct, 2) : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-ink-3 leading-relaxed">
        Spread is the coefficient of variation across scans. Her column is the cycling brain's 30 mornings; his "mornings" column is his 20 scans at 7 am, so the two are like for like. "7 am → 8 pm" is the
        mean paired change on the ten double days, bold where p &lt; 0.01 (one-sample t-test on ten pairs). Same scanner, same model, same pipeline for both people; different heads, so absolute sizes are not comparable.
      </p>
    </div>
  )
}
