import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import Lollipop from '../components/charts/Lollipop'
import MultiLine from '../components/charts/MultiLine'
import ChartFrame from '../components/charts/ChartFrame'

type Pt = { year: number; n: number; n_sexed: number; male_only_pct: number; female_only_pct: number; both_pct: number; includes_female_pct?: number; sexed_pct?: number }
type Drug = { slug: string; brand: string; year: number | null; category: string; trial_female_pct: number; faers_female_pct: number | null; label_date: string | null; male_only_pk: boolean; quantified: boolean; difference: boolean; no_difference: boolean; not_evaluated: boolean; mentions_sex: boolean; no_preg_data: boolean; no_lact_data: boolean; sex_dose: boolean; sex_statement: string; example: string | null }
type Cat = { n: number; no_preg_data_pct: number; no_lact_data_pct: number; no_difference_pct: number; quantified_pct: number; male_only_pk_pct: number; trial_female_pct_median: number }
type Data = {
  generated: string
  labels: { n: number; statements: Record<string, number>; male_only_pk_pct: number; male_only_pk_n: number; quantified_pct: number; difference_pct: number; no_difference_pct: number; not_evaluated_pct: number; no_preg_data_pct: number; no_lact_data_pct: number; sex_dose_pct: number; sex_dose_n: number; sex_dose_brands: string[]; quantified_brands: { brand: string; example: string | null; trial_female_pct: number }[]; male_only_brands: { brand: string; trial_female_pct: number; category: string }[]; by_trial_share: Record<string, { n: number; no_difference_pct: number; quantified_pct: number; not_evaluated_pct: number; silent_pct: number }>; by_category: Record<string, Cat>; by_year: { year: number; n: number; no_preg_data_pct: number; no_lact_data_pct: number; no_difference_pct: number; quantified_pct: number }[]; drugs: Drug[] }
  pubmed: { fields: Record<string, Pt[]>; nih: Pt[]; human: Record<string, Pt[]>; latest: Record<string, Pt>; years: [number, number] }
}
const FIELD_COLORS: Record<string, string> = { 'All rodent studies': 'var(--c-ink, #2A1F26)', Pain: 'var(--c-female)', Cardiovascular: '#C2567E', Neuroscience: 'var(--c-male)', Pharmacology: '#B08A4A', 'Behaviour and psychiatry': '#6B5B95', Immunology: '#5A8F7B', 'Metabolism and endocrine': '#D08C60', 'Reproduction and urogenital': 'var(--c-muted)' }

function LabelLookup({ drugs }: { drugs: Drug[] }) {
  const [q, setQ] = useState('')
  const hits = q.length >= 2 ? drugs.filter(d => d.brand.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : []
  const [pick, setPick] = useState<Drug | null>(null)
  const d = pick
  const yes = (b: boolean) => b ? <span className="font-semibold text-berry">yes</span> : <span className="text-ink-3">no</span>
  return (
    <ChartFrame title="What your drug's label says about you" subtitle="Any new drug approved since 2015. What its current FDA label states about sex, pregnancy and breastfeeding." source="Source: openFDA drug labeling, current prescribing information; FDA Drug Trials Snapshots for the trial share. Text-mined with published rules; read the label itself before relying on this.">
      <input value={q} onChange={e => { setQ(e.target.value); setPick(null) }} placeholder="Type a brand name, e.g. Ozempic" aria-label="Search drug labels" className="w-full sm:w-80 rounded-full border border-hairline bg-white px-4 py-2 text-[15px] outline-none focus:border-rose focus:ring-4 focus:ring-rose/10" />
      {hits.length > 0 && !pick && <ul className="mt-2 flex flex-wrap gap-2">{hits.map(h => <li key={h.slug}><button onClick={() => setPick(h)} className="rounded-full bg-blush-2/70 px-3 py-1 text-[13px] hover:bg-blush-2">{h.brand}</button></li>)}</ul>}
      {d && (
        <div className="mt-4 grid gap-2 text-[15px] leading-relaxed">
          <p><b className="text-berry">{d.brand}</b> <span className="text-ink-3">· approved {d.year} · {d.category} · pivotal trials {d.trial_female_pct.toFixed(0)}% women</span></p>
          <p>Pharmacokinetics reported from healthy male subjects: {yes(d.male_only_pk)}. States a sex difference in exposure: {yes(d.quantified || d.difference)}. Asserts no clinically significant sex difference: {yes(d.no_difference)}. Says nothing about sex in its pharmacology section: {yes(d.sex_statement === 'silent')}.</p>
          <p>Label says human data in pregnancy are absent or insufficient: {yes(d.no_preg_data)}. Says data in breastfeeding are absent or insufficient: {yes(d.no_lact_data)}. Sets a different dose for women: {yes(d.sex_dose)}.</p>
          {d.example && <p className="text-[13px] text-ink-2 border-l-2 border-hairline pl-3">From the label: "{d.example}"</p>}
        </div>
      )}
    </ChartFrame>
  )
}

export default function Chapter6() {
  const [data, setData] = useState<Data | null>(null)
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}data/chapter6.json`).then(r => r.json()).then(setData) }, [])
  if (!data) return <div className="mx-auto max-w-6xl px-4 py-24 text-ink-3">Loading data…</div>
  const L = data.labels, P = data.pubmed
  const all = P.fields['All rodent studies'] ?? [], pain = P.fields.Pain ?? [], neuro = P.fields.Neuroscience ?? [], cardio = P.fields.Cardiovascular ?? [], nih = P.nih ?? []
  const at = (s: Pt[], y: number) => s.find(p => p.year === y) ?? s[0]
  const lastFull = (s: Pt[]) => s[s.length - 1]
  const y0 = 2000, y1 = lastFull(all)?.year ?? P.years[1]
  const srcP = `Source: PubMed, records indexed with the Mice or Rats heading and the Male or Female check tag, by publication year ${P.years[0]}–${y1}; field subsets by MeSH heading (methods page). Analysis by Lucca Labs.`
  const srcL = `Source: openFDA drug labeling (current prescribing information) for ${L.n} new drugs approved 2015–2026 with an FDA Drug Trials Snapshot; sections 8 and 12.3 text-mined with published rules. Analysis by Lucca Labs.`
  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'flow', wide = true): Block => ({ type: 'figure', id, body, size, wide })
  const pct = (v: number | null | undefined, d = 0) => v == null ? '–' : `${v.toFixed(d)}%`
  const stmt = L.statements
  const trial = L.by_trial_share
  const human = P.human['Randomised trials (humans)'] ?? []
  const cats = Object.entries(L.by_category).sort((a, b) => b[1].no_preg_data_pct - a[1].no_preg_data_pct)
  const bothSexDrugs = L.drugs.filter(d => d.trial_female_pct > 0 && d.trial_female_pct < 100)
  const sexDoseBoth = bothSexDrugs.filter(d => d.sex_dose).map(d => d.brand)

  const blocks: Block[] = [
    T('open', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Before a drug is tested on a man, it is tested on a male mouse. Before that, it is designed around a body that has, for most of the history of medicine, been assumed to be his.</p>
      <p>The male default is the oldest claim in women's health and the hardest to measure, because it lives upstream of every dataset: in the animals, the cell lines, the reference values and the assumptions. This chapter measures the two places it leaves a written record. The first is the research literature, where every indexed paper on mice or rats is tagged with the sex of the animals. The second is the drug label, the document the FDA writes for every medicine you are prescribed, which has a section on what the drug does in women and a section on what is known in pregnancy. We read all of them.</p>
    </>),
    T('mice', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Three decades of mice.</p>
      <p>In 2011 two biologists hand-counted a year of papers in ten fields and found that most animal studies used males only, with neuroscience, pharmacology and physiology the worst.<Cite id="beery-2011" /> We repeated the count for every year since {P.years[0]}, for every paper the National Library of Medicine has indexed on mice or rats and tagged with the animals' sex: {all.length ? all.reduce((a, p) => a + p.n_sexed, 0).toLocaleString() : '…'} papers.<Cite id="pubmed" /> The chart shows the share that used males only, field by field.</p>
    </>),
    F('mice-fig', <MultiLine series={['Pain', 'Cardiovascular', 'Neuroscience', 'Behaviour and psychiatry', 'Pharmacology', 'Metabolism and endocrine', 'All rodent studies', 'Immunology'].filter(f => P.fields[f]?.length).map(f => ({ label: f, color: FIELD_COLORS[f], points: P.fields[f].filter(p => p.year >= y0 && p.year <= y1).map(p => ({ x: p.year, y: p.male_only_pct })) }))} title="Rodent studies that used males only" subtitle="Share of indexed mouse and rat papers tagged with sex that are tagged Male and not Female, by field and publication year" source={srcP} yLabel="male-only share" fmt={v => `${v.toFixed(0)}%`} reference={{ value: 50, label: 'half' }} />, 'tall'),
    T('mice-text', <>
      <p>Pain research is the field that has studied the male body hardest. In {y0}, {pct(at(pain, y0)?.male_only_pct)} of sexed pain studies in rodents used males only; in {y1} it was {pct(lastFull(pain)?.male_only_pct)}. Cardiovascular research: {pct(at(cardio, y0)?.male_only_pct)} to {pct(lastFull(cardio)?.male_only_pct)}. Neuroscience: {pct(at(neuro, y0)?.male_only_pct)} to {pct(lastFull(neuro)?.male_only_pct)}. Across all rodent research the male-only share went from {pct(at(all, y0)?.male_only_pct)} to {pct(lastFull(all)?.male_only_pct)}. The line bends in the right direction, and it bends slowly. Only immunology and reproduction, the fields whose subject matter forced the question, have ever studied females in equal numbers.</p>
      <p>In 2016 the National Institutes of Health began requiring every grant it funds to consider sex as a biological variable.<Cite id="nih-sabv" /> Papers that acknowledge NIH funding are tagged, so the policy can be watched: among NIH-funded rodent studies the male-only share was {pct(at(nih, 2015)?.male_only_pct)} in 2015 and {pct(lastFull(nih)?.male_only_pct)} in {lastFull(nih)?.year}. The policy moved the number, faster than the field as a whole. It had not reached half by the last year the count can be trusted.</p>
    </>),
    F('nih-fig', <MultiLine series={[{ label: 'NIH-funded rodent studies', color: 'var(--c-female)', points: nih.filter(p => p.year >= y0 && p.year <= y1).map(p => ({ x: p.year, y: p.includes_female_pct ?? 0 })) }, { label: 'All rodent studies', color: 'var(--c-male)', points: all.filter(p => p.year >= y0 && p.year <= y1).map(p => ({ x: p.year, y: p.includes_female_pct ?? 0 })) }]} title="Studies that included any females" subtitle="Share of sexed rodent papers tagged Female (alone or with Male), NIH-acknowledged papers against all papers. The sex-as-a-biological-variable policy took effect in January 2016." source={srcP} yLabel="share including females" fmt={v => `${v.toFixed(0)}%`} reference={{ value: 50, label: 'half' }} />, 'chart'),
    T('why', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Why a male mouse is not a smaller man.</p>
      <p>The reason this matters is not fairness to mice. It is that the biology can differ at the level of mechanism. In 2015, a pain laboratory found that the immune cells which carry chronic pain signals in the spinal cord are different in the two sexes: microglia in male mice, T cells in female mice. Block microglia and a male mouse's pain goes away; the female mouse's does not.<Cite id="sorge-2015" /> Every candidate painkiller aimed at microglia, designed and screened in male animals, would have worked in the sex that was tested and failed in the sex that carries most chronic pain. A review in Science this month lays out how far this now extends, through gut pain, hormone signalling and the microbiome, and dates the field's turn to the 2016 policy.<Cite id="science-2026-pain" /> Chapters 2 and 3 of this record showed pain as the place where women are rated lower and funded least. This is the place where the drugs for it were designed around the wrong cells.</p>
    </>),
    T('human', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">And then the humans.</p>
      <p>The same tags exist for human trials. Among published randomised trials indexed with participants' sex, {pct(lastFull(human)?.male_only_pct, 1)} in {lastFull(human)?.year} enrolled men only and {pct(lastFull(human)?.female_only_pct, 1)} women only. The single-sex trial is now mostly a women's trial, in obstetrics, gynaecology and breast cancer. That is progress at the door. Chapter 4 showed what happens inside: women are counted in, and then almost never reported on.</p>
    </>),
    F('human-fig', <MultiLine series={[{ label: 'Men only', color: 'var(--c-male)', points: human.filter(p => p.year >= y0 && p.year <= y1).map(p => ({ x: p.year, y: p.male_only_pct })) }, { label: 'Women only', color: 'var(--c-female)', points: human.filter(p => p.year >= y0 && p.year <= y1).map(p => ({ x: p.year, y: p.female_only_pct })) }]} title="Single-sex human trials" subtitle="Share of indexed randomised controlled trial reports tagged with one sex only, by publication year" source={srcP.replace('Mice or Rats heading', 'Randomized Controlled Trial publication type, Humans heading')} yLabel="share of sexed trial reports" fmt={v => `${v.toFixed(0)}%`} />, 'chart'),
    T('label', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What the label says about her.</p>
      <p>Every prescription drug carries a label written to an FDA template. Section 12.3 describes how the drug moves through the body and is required to say whether that differs by sex. Section 8 covers pregnancy and breastfeeding. For the {L.n} drugs of Chapter 1, new medicines approved since 2015 whose trials we have already scored, we pulled the current label and read those sections.<Cite id="openfda-label" /></p>
      <p>{pct(100 * (stmt['no difference asserted'] ?? 0) / L.n)} of labels state that sex makes no clinically significant difference. {pct(L.quantified_pct)} quantify one: a {L.quantified_brands.length ? '' : ''}higher or lower exposure in women, by a stated amount. {pct(100 * (stmt['silent'] ?? 0) / L.n)} say nothing about sex at all in their pharmacology. {L.male_only_pk_n} report their pharmacokinetics from studies in healthy male subjects. And of the {bothSexDrugs.length} drugs taken by both sexes, {sexDoseBoth.length === 0 ? 'none sets' : `${sexDoseBoth.length} set${sexDoseBoth.length === 1 ? 's' : ''}`} a different dose for women{sexDoseBoth.length ? ` (${sexDoseBoth.join(', ')})` : ''}. Zolpidem's 2013 halving of the dose for women, the case Chapter 1 opened with, remains the exception the template allows for and almost never uses.</p>
    </>),
    F('stmt-fig', <Lollipop rows={[['no difference asserted', 'States no clinically significant difference by sex'], ['silent', 'Says nothing about sex'], ['mentioned, unclear', 'Mentions sex without a clear statement'], ['quantified difference', 'Quantifies a difference in exposure'], ['difference noted', 'Notes a difference without a number'], ['not evaluated', 'States sex was not evaluated']].map(([k, label]) => ({ label, sub: `${stmt[k] ?? 0} drugs`, value: 100 * (stmt[k] ?? 0) / L.n, color: k === 'no difference asserted' ? 'var(--c-male)' : k.startsWith('quantified') || k.startsWith('difference') ? 'var(--c-female)' : 'var(--c-muted)' }))} title="What the pharmacology section says about sex" subtitle={`${L.n} new drugs approved 2015–2026, current FDA label, section 12.3`} source={srcL} axisLabel="share of labels" fmt={v => `${v.toFixed(0)}%`} />, 'chart'),
    T('label-2', <>
      <p>The assertion of no difference is the interesting one, because it is made whatever the evidence. Among drugs whose pivotal trials were under 30% women, {pct(trial['under 30% women'].no_difference_pct)} of labels assert no sex difference. Among drugs whose trials were at least half women, {pct(trial['50% or more women'].no_difference_pct)}. The claim does not track the number of women who were studied. In most labels it rests on a population pharmacokinetic model, a statistical fit across whoever was enrolled, which cannot find a difference in a group it barely contains.</p>
      <p>Then section 8. {pct(L.no_preg_data_pct)} of these labels say that human data on use in pregnancy are absent, limited or insufficient. {pct(L.no_lact_data_pct)} say the same of breastfeeding. For a woman who is pregnant or nursing, which at any moment is several million Americans, the label of a drug approved in the last decade almost always says the same thing: we do not know.</p>
    </>),
    F('preg-fig', <Lollipop rows={cats.map(([c, v]) => ({ label: c, sub: `${v.n} drugs · trials ${v.trial_female_pct_median.toFixed(0)}% women`, value: v.no_preg_data_pct, color: 'var(--c-female)', tip: <><b>{c}</b><br />No or insufficient pregnancy data: {v.no_preg_data_pct}%<br />No or insufficient breastfeeding data: {v.no_lact_data_pct}%<br />Asserts no sex difference: {v.no_difference_pct}% · quantifies one: {v.quantified_pct}%</> }))} title="Labels that say pregnancy data are absent or insufficient" subtitle="By therapeutic area, new drugs approved 2015–2026 with at least eight labels" source={srcL} axisLabel="share of labels" fmt={v => `${v.toFixed(0)}%`} />, 'tall'),
    F('quant-table', (
      <ChartFrame title="The labels that found a difference" subtitle="New drugs whose label quantifies a sex difference in exposure, with the share of women in their pivotal trials" source={srcL}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px] sm:text-[14px]">
            <thead><tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3"><th className="py-2 pr-3 text-left font-bold">Drug</th><th className="py-2 pr-3 text-right font-bold">Women in trials</th><th className="py-2 text-left font-bold">What the label says</th></tr></thead>
            <tbody>{L.quantified_brands.filter((b, i, a) => a.findIndex(x => x.brand === b.brand) === i).map(b => (
              <tr key={b.brand} className="border-t border-hairline/60 align-top"><td className="py-2 pr-3 font-medium text-ink whitespace-nowrap">{b.brand}</td><td className="py-2 pr-3 text-right tabular-nums">{b.trial_female_pct.toFixed(0)}%</td><td className="py-2 text-ink-2 text-[13px]">{b.example}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </ChartFrame>
    )),
    T('caveats', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this does not settle.</p>
      <p>The PubMed count depends on indexers tagging the sex of the animals, which they do when the paper states it; roughly half of rodent papers carry no sex tag at all, and the share that do is itself rising. Our lines describe the tagged half. Field subsets are defined by subject headings and overlap. The series stop at 2020 because the National Library of Medicine moved to automated indexing after that, and the sex tags it assigns are not comparable with the human-indexed years; the raw counts for 2021 to 2025 are in the data file so the break can be seen. The label reading is done with rules over text that was written to a template but not to ours; the rules are published, every match is in the data file, and the lookup above shows the sentence it matched so you can judge it. "No clinically significant difference" is a regulatory phrase with a definition; we report that it was asserted, not that it was wrong.</p>
    </>),
    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this means for you.</p>
      <p>Your drug's label is public, and the two sections that matter are short. Section 12.3, "Specific populations", says whether sex was found to change the dose you absorb, and on what evidence. Section 8.1 and 8.2 say what is known in pregnancy and breastfeeding, which for most new drugs is nothing. Look yours up below, then read the sentence it matched. If the label asserts no difference and the trial was a quarter women, you now know what that assertion is worth.</p>
    </>),
    F('lookup', <LabelLookup drugs={L.drugs} />),
  ]

  return (
    <article>
      <header className="mx-auto max-w-3xl px-4 pt-20 pb-14 text-center fade-up">
        <p className="eyebrow">Chapter 6</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">The male <span className="italic font-medium text-berry">default</span> body</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">Three decades of mouse studies by sex, field by field, and what the label of every new drug since 2015 says about women's bodies.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">Lucca Labs · PubMed {P.years[0]}–{y1}, openFDA labels retrieved {data.generated} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['pubmed', 'beery-2011', 'nih-sabv', 'sorge-2015', 'science-2026-pain', 'openfda-label', 'fda-snapshots']} />
      </section>
    </article>
  )
}
