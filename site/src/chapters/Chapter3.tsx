import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import FundingScatter from '../components/charts/FundingScatter'
import Lollipop from '../components/charts/Lollipop'
import MultiLine from '../components/charts/MultiLine'
import ChartFrame from '../components/charts/ChartFrame'
import DiseaseExplorer from '../components/DiseaseExplorer'
import type { Chapter3Data } from '../lib/types3'

const money = (m: number) => m >= 1000 ? `$${(m / 1000).toFixed(1)} billion` : `$${m.toFixed(0)} million`
const col = (s: string) => (s === 'female' ? 'var(--c-female)' : s === 'male' ? 'var(--c-male)' : 'var(--c-muted)')

export default function Chapter3() {
  const [data, setData] = useState<Chapter3Data | null>(null)
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data/chapter3.json`).then(r => r.json()).then(setData) }, [])
  if (!data) return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-3">Loading data…</div>
  const D = data.diseases, S = data.summary
  const get = (name: string) => D.find(d => d.disease === name)!
  const mig = get('Migraine'), gyn = get('Gynaecological diseases'), bre = get('Breast cancer'), alz = get("Alzheimer's and other dementias")
  const src = `Sources: NIH RCDC category estimates, FY${data.funding_fy}; WHO Global Health Estimates ${data.burden_year}, United States, DALYs by cause and sex. Analysis by The Women's Health Record.`
  const skewed = D.filter(d => d.skew !== 'balanced').sort((a, b) => a.ratio_to_expected - b.ratio_to_expected)
  const uncountedTotal = data.uncounted.reduce((a, u) => a + u.funding_m, 0)
  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'flow', wide = true): Block => ({ type: 'figure', id, body, size, wide })
  const trendF = data.trend.map(t => ({ x: t.year, y: t.share_underfunded.female ?? 0 })), trendM = data.trend.map(t => ({ x: t.year, y: t.share_underfunded.male ?? 0 }))

  const blocks: Block[] = [
    T('open', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Every year the National Institutes of Health decides how roughly {money(S.total_funding_m)} of research money is split between the diseases on this page.</p>
      <p>In 2021 a study put NIH's disease funding against how much each disease actually costs Americans in healthy years of life, and found that when a disease fell mostly on one sex, the money favoured men: female-skewed diseases were underfunded for their burden and male-skewed diseases overfunded, with the shortfall nearly twice as large on the women's side.<Cite id="mirin-2021" /> It used burden data from 2016 and funding from 2019.</p>
      <p>We rebuilt it with the newest numbers from both sources, for {S.n} diseases, and then asked what the 2021 paper could not: how this has moved since 2010, which specific diseases carry the gap, and which conditions never make it into the accounting at all.</p>
    </>),
    T('method', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Dollars against years.</p>
      <p>NIH publishes how much it spends on each of about 330 research categories every fiscal year.<Cite id="nih-rcdc" /> The World Health Organization estimates, for every country and cause, the number of healthy years lost to death and disability, split by sex: disability-adjusted life years, or DALYs.<Cite id="who-ghe" /> Where an NIH category and a WHO cause describe the same disease, we matched them. That gives {S.n} diseases with both a price tag and a burden, {S.n_female} of them falling mostly on women, {S.n_male} mostly on men.</p>
      <p>Bigger diseases get more money, so the fair comparison is not dollars but dollars for the burden. The dotted line below is what funding a disease of a given size usually gets. Above it, a disease is funded beyond its burden; below it, short.</p>
    </>),
    F('scatter', <FundingScatter diseases={D} fit={data.fit} title="Funding against burden, 67 diseases" subtitle="Each dot is one disease. Dotted line: the funding a disease of that burden typically gets. Hover for the numbers." source={src} labels={['Migraine', 'HIV/AIDS', "Alzheimer's and other dementias", 'Breast cancer', 'Gynaecological diseases', 'Coronary heart disease', 'Interpersonal violence']} />, 'tall'),
    T('scatter-text', <>
      <p>The first thing the chart says is that the 2021 pattern has not held at the level of averages. The typical female-skewed disease now sits at {S.median_ratio_to_expected.female?.toFixed(2)}× the funding its burden predicts; the typical male-skewed disease at {S.median_ratio_to_expected.male?.toFixed(2)}×. Half of each group is below the line. That is a real change from the 2016 picture, and part of it is one disease: Alzheimer's, which falls mostly on women and whose budget rose to {money(alz.funding_m)}, {alz.ratio_to_expected.toFixed(0)} times what its burden alone would predict.</p>
      <p>The second thing it says is that averages are the wrong place to look. The gap did not close; it moved into specific diseases.</p>
    </>),
    F('ratio', <Lollipop rows={skewed.map(d => ({ label: d.disease, sub: `${d.female_share.toFixed(0)}% women · ${d.dalys_k >= 1000 ? (d.dalys_k / 1000).toFixed(1) + 'M' : d.dalys_k.toFixed(0) + 'k'} DALYs`, value: d.ratio_to_expected, color: col(d.skew), tip: <><b>{d.disease}</b><br />{money(d.funding_m)} against an expected {money(d.expected_m)}<br />${d.dollars_per_daly.toLocaleString()} per DALY</> }))} title="Funding relative to what the burden predicts" subtitle={`The ${skewed.length} diseases that fall at least 60% on one sex, ranked. 1× is on the line.`} source={src} axisLabel="funding ÷ expected funding (log scale)" fmt={v => `${v}×`} log reference={{ value: 1, label: 'on the line' }} legend={[{ label: 'Mostly women', color: 'var(--c-female)' }, { label: 'Mostly men', color: 'var(--c-male)' }]} />),
    T('ratio-text', <>
      <p>Look at the bottom of the women's half of that chart. The diseases there disable people rather than kill them.</p>
      <p>The clearest case is migraine. It costs Americans about {(mig.dalys_k / 1000).toFixed(1)} million healthy years every year, and {mig.female_share.toFixed(0)}% of those years are women's. NIH spent {money(mig.funding_m)} on it in {data.funding_fy}. That works out to ${mig.dollars_per_daly.toFixed(0)} for each healthy year lost, about {Math.round(1 / mig.ratio_to_expected) === 7 ? 'one-seventh' : `one-${Math.round(1 / mig.ratio_to_expected)}th`} of what a disease that size usually gets. Only {mig.rank_by_ratio - 1} of the {S.n} diseases are funded further below their burden.</p>
      <p>Next come gynaecological diseases such as endometriosis and fibroids, at about {Math.round(gyn.ratio_to_expected * 100)}% of expected funding. Then uterine cancer, eating disorders and rheumatoid arthritis.</p>
      <p>At the top of the women's list are the women's cancers. Breast cancer is funded at {bre.ratio_to_expected.toFixed(1)}× its burden; cervical and ovarian are above the line too. Where women's diseases are fatal and have a constituency, they are funded. Where they are chronic, painful and survivable, they are not.</p>
      <p>The men's list has its own underfunded tail: interpersonal violence, hepatitis C, stomach and oesophageal cancer, suicide. And its top is distorted by two diseases NIH funds as global problems rather than American ones, HIV and tuberculosis, which is why the overall medians say so little.</p>
    </>),
    T('pairs', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Same burden, different money.</p>
      <p>The clearest way to see a funding gap is to hold the burden still. For each of the five most underfunded female-skewed diseases, here are the diseases of similar size and what each gets per year of health lost.</p>
    </>),
    F('pairs-fig', (
      <ChartFrame title="Diseases of similar burden, dollars per DALY" subtitle="Each row: an underfunded female-skewed disease and the diseases within 60% of its burden" source={src}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px] sm:text-[14px]">
            <tbody>
              {data.comparators.map(c => (
                <tr key={c.disease} className="border-t border-hairline/60 align-top">
                  <td className="py-3 pr-4 w-[14rem]"><div className="font-semibold text-berry">{c.disease}</div><div className="text-[11px] text-ink-3">{(c.dalys_k / 1000).toFixed(c.dalys_k >= 1000 ? 1 : 2)}M DALYs · {c.female_share.toFixed(0)}% women · <b>${c.per_daly.toFixed(0)}</b> per DALY</div></td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {c.others.map(o => <span key={o.disease} className="rounded-full bg-blush-2/70 px-3 py-1 text-[12px] text-ink"><span className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle" style={{ background: col(o.skew) }} />{o.disease} <b>${o.per_daly.toLocaleString()}</b></span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-ink-3">Dot colour: rose mostly women, bronze mostly men, grey mixed.</p>
        </div>
      </ChartFrame>
    )),
    T('uncounted', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The conditions that are not counted.</p>
      <p>A funding-to-burden comparison can only include diseases whose burden has been estimated. For {data.uncounted.length} conditions NIH funds, together worth {money(uncountedTotal)} a year, the WHO has no burden estimate at all. The list is not random: fibromyalgia, chronic fatigue syndrome, lupus, interstitial cystitis, jaw disorders, postural tachycardia syndrome, osteoporosis, endometriosis, vulvodynia, polycystic ovary syndrome. Nearly every one falls mostly on women.</p>
      <p>These conditions cannot be shown to be underfunded relative to burden, because nobody has measured the burden. That is a different kind of gap, and in some ways a worse one.</p>
    </>),
    F('uncounted-fig', <Lollipop rows={[...data.uncounted].sort((a, b) => b.funding_m - a.funding_m).map(u => ({ label: u.label, value: u.funding_m, color: 'var(--c-female)' }))} title="Funded, but not measured" subtitle={`NIH funding, FY${data.funding_fy}, for conditions with no WHO burden estimate`} source={`Source: NIH RCDC category estimates, FY${data.funding_fy}. WHO Global Health Estimates has no cause for these conditions.`} axisLabel="NIH funding, $ millions" fmt={v => `$${v.toFixed(0)}M`} />),
    T('trend', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Has it moved?</p>
      <p>The WHO has burden estimates for 2010, 2015, 2019, 2021 and 2023, and NIH funding for each of those years, so the comparison can be repeated across thirteen years. The share of female-skewed diseases sitting below the line was {data.trend[0].share_underfunded.female}% in 2010 and {data.trend[data.trend.length - 1].share_underfunded.female}% in 2023. For male-skewed diseases it was {data.trend[0].share_underfunded.male}% and {data.trend[data.trend.length - 1].share_underfunded.male}%. Thirteen years, a decade of NIH policy on sex as a biological variable, and the women's line has drifted the wrong way to meet the men's, not the other way round.</p>
    </>),
    F('trend-fig', <MultiLine series={[{ label: 'Mostly-women diseases', color: 'var(--c-female)', points: trendF }, { label: 'Mostly-men diseases', color: 'var(--c-male)', points: trendM }]} title="Share of diseases funded below their burden" subtitle="Diseases falling at least 60% on one sex, by burden year, with that year's NIH funding" source="Sources: NIH RCDC category estimates FY2010–FY2023; WHO Global Health Estimates 2010, 2015, 2019, 2021 and 2023, United States. The funding line is refitted for each year. Analysis by The Women's Health Record." yLabel="share below the line" fmt={v => `${v.toFixed(0)}%`} reference={{ value: 50, label: 'half' }} />, 'chart'),
    T('caveats', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this does not settle.</p>
      <p>Matching NIH categories to WHO causes is a judgement, and we show every match in the data file. NIH categories overlap, so a dollar can count towards more than one. A DALY is one way to weigh a disease, and it weighs disability by a schedule that is itself argued over. Some diseases are funded for reasons that have nothing to do with American burden: HIV and tuberculosis research is global, and we say so rather than drop them. A burden line fitted across 67 diseases is a description of what NIH does, not a rule for what it should do.</p>
      <p>What the data can say is narrower and firmer: at the same burden, the money varies by more than twenty-fold, the lowest-funded diseases on the women's side are the chronic painful ones, and the list of conditions nobody has measured is a list of women's conditions.</p>
    </>),
    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this means for you.</p>
      <p>If you live with one of these diseases, the number that matters when you write to a representative, a foundation or a journalist is dollars per year of health lost, set beside a disease everyone knows. Look yours up below. The funding history is there too; NIH's own figures, not ours.</p>
    </>),
    F('explorer', <DiseaseExplorer diseases={D} n={S.n} source={src} />),
    T('for-you-2', <>
      <p>And if your condition is one of the uncounted, the first ask is not money. It is a burden estimate. A condition without one cannot be shown to be underfunded, and so it never is.</p>
    </>),
  ]

  return (
    <article>
      <header className="mx-auto max-w-3xl px-4 pt-20 pb-14 text-center fade-up">
        <p className="eyebrow">Chapter 3</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">The <span className="italic font-medium text-berry">research</span> dollar</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">{S.n} diseases, their NIH budgets and the healthy years they cost Americans: where the money follows the burden, where it doesn't, and which conditions are never measured.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">NIH FY{data.funding_fy}, WHO {data.burden_year} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['mirin-2021', 'nih-rcdc', 'who-ghe']} />
      </section>
    </article>
  )
}
