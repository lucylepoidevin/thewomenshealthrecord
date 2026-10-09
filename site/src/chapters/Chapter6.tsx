import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { chapterRef } from '../lib/chapters'
import Story, { type Block } from '../components/Story'
import Cite from '../components/Cite'
import SourceList from '../components/SourceList'
import NextChapter from '../components/NextChapter'
import MultiLine from '../components/charts/MultiLine'
import ChartFrame from '../components/charts/ChartFrame'
import SmallMultiples from '../components/charts/SmallMultiples'
import StackedArea from '../components/charts/StackedArea'
import Waffle from '../components/charts/Waffle'
import Heatmap from '../components/charts/Heatmap'

type Pt = { year: number; n: number; n_sexed: number; male_only_pct: number; female_only_pct: number; both_pct: number; includes_female_pct?: number; sexed_pct?: number }
type Drug = { weight_based: boolean; weight_effect: string; weight_example: string | null; slug: string; brand: string; year: number | null; category: string; trial_female_pct: number; faers_female_pct: number | null; label_date: string | null; male_only_pk: boolean; quantified: boolean; difference: boolean; no_difference: boolean; not_evaluated: boolean; mentions_sex: boolean; no_preg_data: boolean; no_lact_data: boolean; sex_dose: boolean; sex_statement: string; example: string | null }
type Cat = { n: number; no_preg_data_pct: number; no_lact_data_pct: number; no_difference_pct: number; quantified_pct: number; male_only_pk_pct: number; trial_female_pct_median: number }
type Data = {
  generated: string
  labels: { dosing: { n: number; weight_based_n: number; flat_n: number; flat_pct: number; flat_weight_affects_n: number; flat_weight_no_n: number; flat_weight_affects_no_sex_diff_n: number; flat_weight_affects_brands: { brand: string; trial_female_pct: number; no_difference: boolean; example: string | null }[]; by_category_flat_pct: Record<string, number> }; n: number; statements: Record<string, number>; male_only_pk_pct: number; male_only_pk_n: number; quantified_pct: number; difference_pct: number; no_difference_pct: number; not_evaluated_pct: number; no_preg_data_pct: number; no_lact_data_pct: number; sex_dose_pct: number; sex_dose_n: number; sex_dose_brands: string[]; quantified_brands: { brand: string; example: string | null; trial_female_pct: number }[]; male_only_brands: { brand: string; trial_female_pct: number; category: string }[]; by_trial_share: Record<string, { n: number; no_difference_pct: number; quantified_pct: number; not_evaluated_pct: number; silent_pct: number }>; by_category: Record<string, Cat>; by_year: { year: number; n: number; no_preg_data_pct: number; no_lact_data_pct: number; no_difference_pct: number; quantified_pct: number }[]; drugs: Drug[] }
  pubmed: { sexfactors: { year: number; rct_both_sexes: number; sex_factors: number; pct: number }[]; fields: Record<string, Pt[]>; nih: Pt[]; human: Record<string, Pt[]>; latest: Record<string, Pt>; years: [number, number] }
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
  const srcP = `Source: PubMed, records indexed with the Mice or Rats heading and the Male or Female check tag, by publication year ${P.years[0]}–${y1}; field subsets by MeSH heading (methods page). Analysis by The Women's Health Record.`
  const srcL = `Source: openFDA drug labeling (current prescribing information) for ${L.n} new drugs approved 2015–2026 with an FDA Drug Trials Snapshot; sections 8 and 12.3 text-mined with published rules. Analysis by The Women's Health Record.`
  const T = (id: string, body: React.ReactNode): Block => ({ type: 'text', id, body })
  const F = (id: string, body: React.ReactNode, size: 'chart' | 'tall' | 'flow' = 'flow', wide = true): Block => ({ type: 'figure', id, body, size, wide })
  const pct = (v: number | null | undefined, d = 0) => v == null ? '–' : `${v.toFixed(d)}%`
  const stmt = L.statements
  const trial = L.by_trial_share
  const human = P.human['Randomised trials (humans)'] ?? []
  const cats = Object.entries(L.by_category).sort((a, b) => b[1].no_preg_data_pct - a[1].no_preg_data_pct)
  const bothSexDrugs = L.drugs.filter(d => d.trial_female_pct > 0 && d.trial_female_pct < 100)
  const sexDoseBoth = bothSexDrugs.filter(d => d.sex_dose).map(d => d.brand)
  const DS = L.dosing, SF = P.sexfactors ?? []
  const KG = { men: 90.3, women: 77.9 } // NCHS, adults 20 and over, August 2021–August 2023
  const perKg = Math.round((KG.men / KG.women - 1) * 100)

  const blocks: Block[] = [
    T('open', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">Most medicines are tested in animals before they are tested in people. For most of the last century, the animals were mostly male, and so were the people.</p>
      <p>Neither is true any more in the way it once was, and that is the point: the male default is not a slogan but a quantity, and it has been moving. It is also the hardest claim in women's health to pin down, because it lives upstream of the datasets, in the mice, the cell lines and the reference ranges. This chapter measures it in the three places where it leaves a written trace. The research papers, where every indexed study of mice or rats records the sex of the animals. The trials, where the index records who was enrolled and whether sex was analysed. And the drug label, the document the FDA writes for every medicine you are prescribed, which has a section on what the drug does in women, a section on pregnancy, and a dose.</p>
    </>),

    T('mice', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The animals.</p>
      <p>In 2011 two biologists hand-counted a year of papers in ten biological fields and found a male bias in eight of them, worst in neuroscience, where studies of male animals alone outnumbered studies of females five and a half to one.<Cite id="beery-2011" /> We repeated the count for every year since {P.years[0]}, for every paper the National Library of Medicine has indexed on mice or rats and tagged with the animals' sex: {all.length ? all.reduce((a, p) => a + p.n_sexed, 0).toLocaleString() : '…'} papers.<Cite id="pubmed" /> The panels show the share that used males only, field by field.</p>
    </>),
    F('mice-fig', <SmallMultiples panels={['Pain', 'Cardiovascular', 'Neuroscience', 'Behaviour and psychiatry', 'Pharmacology', 'Metabolism and endocrine', 'All rodent studies', 'Immunology', 'Reproduction and urogenital'].filter(f => P.fields[f]?.length).map(f => ({ label: f, color: FIELD_COLORS[f] ?? 'var(--c-male)', points: P.fields[f].filter(p => p.year >= y0 && p.year <= y1).map(p => ({ x: p.year, y: p.male_only_pct })) }))} title="Rodent studies that used males only, field by field" subtitle={`Share of indexed mouse and rat papers tagged with sex that are tagged Male and not Female, ${y0}–${y1}. One panel per field; first and last values printed.`} source={srcP} yLabel="Male-only share of sexed rodent papers" reference={{ value: 50, label: 'half' }} />),
    T('mice-text', <>
      <p>Pain research has studied the male body hardest. In {y0}, {pct(at(pain, y0)?.male_only_pct)} of sexed rodent pain studies used males only; in {y1} it was {pct(lastFull(pain)?.male_only_pct)}. Cardiovascular research went from {pct(at(cardio, y0)?.male_only_pct)} to {pct(lastFull(cardio)?.male_only_pct)}, neuroscience from {pct(at(neuro, y0)?.male_only_pct)} to {pct(lastFull(neuro)?.male_only_pct)}, and all rodent research from {pct(at(all, y0)?.male_only_pct)} to {pct(lastFull(all)?.male_only_pct)}. The lines bend the right way, slowly. Only immunology and reproductive biology, where the subject forced the question, have ever studied females in equal numbers.</p>
      <p>In 2016 the National Institutes of Health began requiring every grant it funds to consider sex as a biological variable.<Cite id="nih-sabv" /> Papers that acknowledge NIH funding are tagged, so the policy can be watched. Among NIH-funded rodent studies the male-only share was {pct(at(nih, 2015)?.male_only_pct)} in 2015 and {pct(lastFull(nih)?.male_only_pct)} in {lastFull(nih)?.year}; put the other way, {pct(lastFull(nih)?.includes_female_pct)} of NIH-funded studies included females by {lastFull(nih)?.year}, against {pct(lastFull(all)?.includes_female_pct)} of rodent studies overall. The policy moved the number faster than the field moved on its own.</p>
    </>),
    F('nih-fig', <MultiLine series={[{ label: 'NIH-funded rodent studies', color: 'var(--c-female)', points: nih.filter(p => p.year >= y0 && p.year <= y1).map(p => ({ x: p.year, y: p.includes_female_pct ?? 0 })) }, { label: 'All rodent studies', color: 'var(--c-male)', points: all.filter(p => p.year >= y0 && p.year <= y1).map(p => ({ x: p.year, y: p.includes_female_pct ?? 0 })) }]} title="Studies that included any females" subtitle="Share of sexed rodent papers tagged Female (alone or with Male), NIH-acknowledged papers against all papers. The sex-as-a-biological-variable policy took effect in January 2016." source={srcP} yLabel="share including females" fmt={v => `${v.toFixed(0)}%`} reference={{ value: 50, label: 'half' }} />, 'chart'),
    T('why', <>
      <p>Why it matters is not fairness to mice. In 2015 a pain laboratory found that the immune cells which carry chronic pain in the spinal cord differ by sex: microglia in male mice, T cells in female mice. Block microglia and a male mouse's pain goes away; the female mouse's does not.<Cite id="sorge-2015" /> A painkiller aimed at microglia, designed and screened in male animals, would work in the sex that was tested and fail in the sex that carries most chronic pain. A review in Science this month traces how far this now extends, through gut pain, hormone signalling and the microbiome.<Cite id="science-2026-pain" /> {chapterRef('pain-gap')} and {chapterRef('funding-vs-burden')} find pain to be where women are rated lowest and funded least. This is where its drugs were designed around the wrong cells.</p>
    </>),

    T('human', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The trials.</p>
      <p>The same tags exist for human trials, and here the picture is better at the door. Among published randomised trials indexed with participants' sex, {pct(lastFull(human)?.male_only_pct, 1)} in {lastFull(human)?.year} enrolled men only and {pct(lastFull(human)?.female_only_pct, 1)} women only; the single-sex trial is now mostly a women's trial, in obstetrics, gynaecology and breast cancer. But counted in is not the same as looked at. The index also records when a trial report analysed sex as a factor in its results. Among trials that enrolled both sexes, {SF.length ? SF[SF.length - 1].pct.toFixed(1) : '…'}% were indexed that way in {SF.length ? SF[SF.length - 1].year : ''}, down from a peak of {SF.length ? Math.max(...SF.map(x => x.pct)).toFixed(1) : '…'}%. The trials got bigger and more mixed; the share that asked whether the answer differed for women got smaller. {chapterRef('who-gets-studied')} finds the same thing in the registry: fewer than one trial in five hundred reports a result by sex.</p>
    </>),
    F('human-fig', <StackedArea points={human.filter(p => p.year >= y0 && p.year <= y1).map(p => ({ x: p.year, values: { both: p.both_pct, women: p.female_only_pct, men: p.male_only_pct } }))} series={[{ key: 'both', label: 'Both sexes enrolled', color: '#C9B3BC' }, { key: 'women', label: 'Women only', color: 'var(--c-female)' }, { key: 'men', label: 'Men only', color: 'var(--c-male)' }]} title="Who published randomised trials enrolled" subtitle="Indexed randomised controlled trial reports tagged with sex, divided into both sexes, women only and men only, by publication year" source={srcP.replace('Mice or Rats heading', 'Randomized Controlled Trial publication type, Humans heading')} yLabel="share of sexed trial reports" />, 'chart'),
    F('sexfactors-fig', <MultiLine series={[{ label: 'Trials with both sexes, indexed as analysing sex', color: 'var(--c-female)', points: SF.map(x => ({ x: x.year, y: x.pct })) }]} title="Published trials that analysed sex as a factor" subtitle="Share of indexed randomised controlled trial reports tagged with both Male and Female that also carry the Sex Factors or Sex Characteristics heading" source={srcP.replace('Mice or Rats heading', 'Randomized Controlled Trial publication type, Humans heading')} yLabel="share of mixed-sex trial reports" fmt={v => `${v.toFixed(1)}%`} />, 'chart'),

    T('label', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The label.</p>
      <p>Every prescription drug carries a label written to an FDA template. Section 12.3 describes how the drug moves through the body and is meant to say whether that differs by sex. Section 8 covers pregnancy and breastfeeding. For the {L.n} new medicines approved since 2015 whose trials {chapterRef('tested-on-men')} scores, we pulled the current label and read those sections.<Cite id="openfda-label" /> Each square below is one drug.</p>
    </>),
    F('stmt-fig', <Waffle items={L.drugs.map(d => ({ id: d.slug, label: `${d.brand} (${d.year}, ${d.category}, trials ${d.trial_female_pct.toFixed(0)}% women)`, category: d.sex_statement, detail: d.example ?? undefined }))} categories={[{ key: 'no difference asserted', label: 'States no clinically significant difference by sex', color: 'var(--c-male)' }, { key: 'one-sex drug', label: 'One-sex drug, no comparison possible', color: '#EBD5DC' }, { key: 'silent', label: 'Says nothing about sex', color: '#C9B3BC' }, { key: 'mentioned, unclear', label: 'Mentions sex, no clear statement', color: '#D9C1C9' }, { key: 'quantified difference', label: 'Quantifies a difference', color: 'var(--c-emphasis)' }, { key: 'difference noted', label: 'Notes a difference, no number', color: 'var(--c-female)' }, { key: 'not evaluated', label: 'States sex was not evaluated', color: '#2A1F26' }]} title={`${L.n} labels, one square each: what the pharmacology section says about sex`} subtitle="New drugs approved 2015–2026, current FDA label, section 12.3. Hover a square." source={srcL} />),
    T('label-2', <>
      <p>Setting aside the {stmt['one-sex drug'] ?? 0} drugs trialled in one sex, where no comparison is possible, {pct(100 * (stmt['no difference asserted'] ?? 0) / (L.n - (stmt['one-sex drug'] ?? 0)))} of labels state that sex makes no clinically significant difference. {pct(100 * (stmt['quantified difference'] ?? 0) / (L.n - (stmt['one-sex drug'] ?? 0)))} quantify one. {pct(100 * (stmt['silent'] ?? 0) / (L.n - (stmt['one-sex drug'] ?? 0)))} say nothing about sex at all. {L.male_only_pk_n} describe at least one pharmacokinetic study done in healthy men only. The assertion of no difference is the one to watch, because it is made whatever the evidence: among drugs whose pivotal trials were under 30% women, {pct(trial['under 30% women'].no_difference_pct)} of labels assert it; among drugs whose trials were at least half women, {pct(trial['50% or more women'].no_difference_pct)}. In most labels it rests on a population pharmacokinetic model, a statistical fit across whoever was enrolled, which cannot find a difference in a group it barely contains.</p>
      <p>Then section 8. {pct(L.no_preg_data_pct)} of these labels say that human data on use in pregnancy are absent, limited or insufficient; {pct(L.no_lact_data_pct)} say the same of breastfeeding. For a woman who is pregnant or nursing, the label of a drug approved in the last decade almost always says the same thing: we do not know.</p>
    </>),
    F('preg-fig', <Heatmap rows={cats.map(([c, v]) => ({ label: c, sub: `${v.n} drugs · trials ${v.trial_female_pct_median.toFixed(0)}% women`, values: [v.no_preg_data_pct, v.no_lact_data_pct, v.no_difference_pct, v.quantified_pct, v.male_only_pk_pct] }))} columns={['No or insufficient pregnancy data', 'No or insufficient breastfeeding data', 'Asserts no sex difference', 'Quantifies a sex difference', 'Pharmacokinetics in healthy men']} title="What labels say, by therapeutic area" subtitle="Share of each area's labels making each statement; areas with at least eight new drugs. Darker is more." source={srcL} />),
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

    T('dose', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">The same pill, a smaller body.</p>
      <p>Here is the mechanism the labels describe without naming it. The average American man weighs {KG.men} kilograms; the average woman {KG.women}.<Cite id="nchs-anthro" /> {DS.flat_pct}% of these {DS.n} drugs are given as a flat dose, the same tablet or injection for everyone, so the same prescription is {perKg}% more drug per kilogram for the average woman before any difference in how her body handles it. {DS.flat_weight_affects_n} of the flat-dosed labels say, in their own pharmacology section, that exposure rises as body weight falls. {DS.flat_weight_affects_no_sex_diff_n} of those same labels also state that sex makes no clinically significant difference. Both can be true at once, because "sex" in a population model is what is left after weight has been accounted for. For the woman taking the pill, weight is not accounted for. And of the {bothSexDrugs.length} drugs taken by both sexes, {sexDoseBoth.length === 0 ? 'none sets' : `${sexDoseBoth.length} set${sexDoseBoth.length === 1 ? 's' : ''}`} a different dose for women{sexDoseBoth.length ? ` (${sexDoseBoth.join(', ')})` : ''}.</p>
      <p>This is zolpidem's story generalised. The 2013 halving of the women's dose, a story {chapterRef('tested-on-men')} tells in full, was made because women's blood levels the next morning were higher at the same dose, and the label had said nothing about it for twenty years. The labels below say it now, in the sentence the rule matched, and then set a single dose anyway.</p>
    </>),
    F('dose-fig', (
      <ChartFrame title="Flat-dosed drugs whose label says exposure rises as weight falls" subtitle={`${DS.flat_weight_affects_n} new drugs. Bold: the label also asserts no clinically significant difference by sex.`} source={srcL}>
        <div className="overflow-x-auto max-h-[32rem] overflow-y-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead><tr className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3"><th className="py-2 pr-3 text-left font-bold">Drug</th><th className="py-2 pr-3 text-right font-bold">Women in trials</th><th className="py-2 text-left font-bold">What the label says</th></tr></thead>
            <tbody>{DS.flat_weight_affects_brands.map(b => (
              <tr key={b.brand} className={`border-t border-hairline/60 align-top ${b.no_difference ? 'font-semibold' : ''}`}><td className="py-2 pr-3 text-ink whitespace-nowrap">{b.brand}</td><td className="py-2 pr-3 text-right tabular-nums">{b.trial_female_pct.toFixed(0)}%</td><td className="py-2 text-ink-2 text-[12px] font-normal">{b.example}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </ChartFrame>
    )),

    T('caveats', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this does not settle.</p>
      <p>The PubMed count depends on indexers tagging the sex of the animals, which they do when the paper states it; about half of rodent papers carry no tag and are outside the shares shown. The series stop at 2020 because the National Library of Medicine moved to automated indexing after that and the tags are not comparable; the raw later counts are in the data file. The label reading is done with published rules over text written to a template but not to ours; every matched sentence is shown in the lookup so you can judge it. "No clinically significant difference" is a regulatory phrase with a definition; we report that it was asserted, not that it was wrong.</p>
    </>),
    T('for-you', <>
      <p className="display text-2xl sm:text-[2rem] font-medium leading-snug mb-5 text-ink">What this means for you.</p>
      <p>Your drug's label is public, and the two sections that matter are short. Section 12.3, "Specific populations", says whether sex was found to change the dose you absorb, and on what evidence. Sections 8.1 and 8.2 say what is known in pregnancy and breastfeeding, which for most new drugs is nothing. Look yours up below, then read the sentence it matched. If the label asserts no difference and the trial was a quarter women, you now know what that assertion is worth. If it is flat-dosed and you are small, that is a conversation worth having.</p>
    </>),
    F('lookup', <LabelLookup drugs={L.drugs} />),
  ]

  return (
    <article>
      <header className="mx-auto max-w-3xl px-4 pt-20 pb-14 text-center fade-up">
        <p className="eyebrow">{chapterRef('male-default')}</p>
        <h1 className="display mt-4 text-4xl sm:text-6xl font-light leading-[1.05]">The male <span className="italic font-medium text-berry">default</span> body</h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2 leading-relaxed">The animals drugs are tested on, the trials that follow, and the label you are handed: three places where the male body is still the standard, measured.</p>
        <p className="mt-5 text-xs tracking-wide text-ink-3">PubMed {P.years[0]}–{y1}, openFDA labels retrieved {data.generated} · <Link to="/methods" className="underline underline-offset-4 decoration-hairline hover:text-berry">methods</Link></p>
      </header>
      <Story blocks={blocks} />
      <NextChapter slug='male-default' />
      <section className="mx-auto max-w-3xl px-4 pt-16">
        <h2 className="display text-2xl font-medium mb-4">Sources</h2>
        <SourceList only={['pubmed', 'beery-2011', 'nih-sabv', 'sorge-2015', 'science-2026-pain', 'openfda-label', 'fda-snapshots', 'nchs-anthro']} />
      </section>
    </article>
  )
}
