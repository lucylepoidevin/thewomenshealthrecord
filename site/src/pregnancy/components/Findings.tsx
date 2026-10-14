import { fmt, type Pregnancy, type Session } from '../lib/data'

const SHOW = ['total_brain', 'cortical_gm', 'cerebral_wm', 'lateral_ventricles', 'third_fourth_ventricles', 'hippocampus', 'entorhinal', 'parahippocampal', 'amygdala', 'thalamus', 'caudate', 'putamen', 'pallidum', 'accumbens',
  'superior_frontal', 'middle_frontal', 'precentral', 'postcentral', 'precuneus', 'posterior_cingulate', 'anterior_cingulate', 'insula_anterior', 'superior_temporal', 'fusiform', 'calcarine', 'cerebellum', 'brainstem']

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
/** % change of a group of sessions' region volume against a reference volume. */
function pct(ss: Session[], key: string, ref: number) { return (mean(ss.map(s => s.volumes[key])) / ref - 1) * 100 }

/** Sentences written from the numbers, so the prose cannot drift from the data. */
export function FindingsProse({ data }: { data: Pregnancy }) {
  const st = data.stats
  const tb = st.total_brain, gm = st.cortical_gm, wm = st.cerebral_wm, lv = st.lateral_ventricles, hip = st.hippocampus
  if (!tb || !gm || !wm || !lv || !hip) return <p>Volumes have not been measured yet.</p>
  const ss = data.sessions.filter(s => s.has_scan)
  const by = (f: (s: Session) => boolean) => ss.filter(f)
  // same-scanner comparison: the first three Irvine scans (weeks 9-14) as the reference
  const uciRef = by(s => [7, 8, 9].includes(s.session))
  const t3 = by(s => s.trimester === 'third')
  const firstPost = by(s => s.session === 20)
  const twoYears = by(s => s.week >= 90 && s.session !== 27)
  const refOf = (key: string) => mean(uciRef.map(s => s.volumes[key]))
  const nadir = (key: string) => ss.filter(s => s.site === 'UCI').reduce((a, b) => (b.volumes[key] < a.volumes[key] ? b : a))
  const tbN = nadir('total_brain')
  return (
    <>
      <p>
        We begin with whole-brain volume, ventricles excluded, because it is the one measure on which the two scanners agree (the next-day retest differed by {fmt.pct(tb.retest_diff_pct ?? 0)}).
        Against the four scans before conception it was <strong>{fmt.pct(tb.third_trimester_pct ?? 0)}</strong> across the third trimester, with its lowest reading at week {tb.min_pregnancy?.week}
        ({fmt.pct(tb.min_pregnancy?.pct ?? 0)}). In the first three months after the birth it was {fmt.pct(tb.early_postpartum_pct ?? 0)}; two years on, {fmt.pct(tb.two_years_pct ?? 0)}.
        A brain of {fmt.cm3(tb.baseline)} cm³ lost roughly {Math.round(Math.abs(tb.min_pregnancy?.pct ?? 0) / 100 * tb.baseline / 1000)} cm³ at its minimum and subsequently recovered most of that volume.
      </p>
      <p>
        Grey and white matter require a more careful comparison. Between the two scanners, the retest put cortical grey matter at {fmt.pct(gm.retest_diff_pct ?? 0)} and white matter at {fmt.pct(wm.retest_diff_pct ?? 0)}:
        the Santa Barbara scanner places the boundary between the two tissues slightly further out than the Irvine scanner, and the pre-conception scans were all acquired in Santa Barbara.
        We therefore compare within the Irvine scans. Against the first three of them (weeks 9 to 14), cortical grey matter was {fmt.pct(pct(t3, 'cortical_gm', refOf('cortical_gm')))} in the third
        trimester, {fmt.pct(pct(firstPost, 'cortical_gm', refOf('cortical_gm')))} at the first visit after the birth, and {fmt.pct(pct(twoYears, 'cortical_gm', refOf('cortical_gm')))} two years later.
        White matter was {fmt.pct(pct(t3, 'cerebral_wm', refOf('cerebral_wm')))} by the third trimester and had returned to {fmt.pct(pct(twoYears, 'cerebral_wm', refOf('cerebral_wm')))} at two years.
      </p>
      <p>
        The hippocampus, which varied by half a percent across a month in Experiment 1, measured {fmt.pct(pct(t3, 'hippocampus', refOf('hippocampus')))} in the third trimester on the same-scanner
        comparison and {fmt.pct(pct(twoYears, 'hippocampus', refOf('hippocampus')))} at two years. The lateral ventricles, with a spread of {lv.baseline_cv_pct?.toFixed(1)}% even between the baseline scans, are too
        variable at this resolution for a trend to be inferred; the published paper, with higher-resolution methods, found them enlarging. Whole-brain volume reached its minimum at week {tbN.week}, scan {tbN.session}.
      </p>
    </>
  )
}

export function FindingsTable({ data }: { data: Pregnancy }) {
  const rows = SHOW.filter(k => data.stats[k]).map(k => ({ k, name: data.regions[k].name, s: data.stats[k] }))
  const cell = (v?: number) => (v == null ? '–' : fmt.pct(v))
  return (
    <div className="table-wrap">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[12px] text-ink-3">
            <th className="py-2 pr-3 font-semibold">Region</th>
            <th className="py-2 pr-3 font-semibold text-right">Before cm³</th>
            <th className="py-2 pr-3 font-semibold text-right">3rd trimester</th>
            <th className="py-2 pr-3 font-semibold text-right">Lowest (week)</th>
            <th className="py-2 pr-3 font-semibold text-right">Months 1–3 after</th>
            <th className="py-2 pr-3 font-semibold text-right">2 years after</th>
            <th className="py-2 pr-3 font-semibold text-right">Site retest</th>
            <th className="py-2 font-semibold text-right">ρ · progesterone</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ k, name, s }) => (
            <tr key={k} className={`border-t border-hairline/70`}>
              <td className="py-2 pr-3 font-semibold text-ink">{name}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fmt.cm3(s.baseline)}</td>
              <td className={`py-2 pr-3 text-right tabular-nums ${Math.abs(s.third_trimester_pct ?? 0) > 2 * Math.abs(s.retest_diff_pct ?? 1) ? 'font-semibold text-berry' : ''}`}>{cell(s.third_trimester_pct)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{s.min_pregnancy ? `${fmt.pct(s.min_pregnancy.pct)} (${s.min_pregnancy.week})` : '–'}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{cell(s.early_postpartum_pct)}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{cell(s.two_years_pct)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-ink-2">{cell(s.retest_diff_pct)}</td>
              <td className="py-2 text-right tabular-nums">{s.rho_progesterone != null ? fmt.r(s.rho_progesterone) : '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-ink-3 leading-relaxed">
        Percent change from the mean of the four pre-conception scans, measured in the brain's own space. "Site retest" is scan 27 against scan 26, a day apart on the two scanners: a pure
        measurement difference, and for grey and white matter it is as large as the pregnancy change, which is why the text above compares within one scanner. Bold where the third-trimester
        change is more than twice the retest difference. ρ is the Spearman rank correlation with same-visit progesterone over the scans that had an assay; with 27 regions, a few will pass
        p &lt; 0.05 by chance.
      </p>
    </div>
  )
}
