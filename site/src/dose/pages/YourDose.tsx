import { Link } from 'react-router-dom'
import Story, { type Block } from '../../components/Story'
import Simulator from '../components/Simulator'
import { Cite, SourceList } from '../components/Cite'
import { useDrugs, type DrugsFile } from '../lib/data'
import { jumpTo } from '../../cycling/lib/jump'
import ExperimentNav from '../../experiments/ExperimentNav'

function C({ file, id }: { file: DrugsFile; id: string }) { return <Cite file={file} id={id} /> }

export default function YourDose() {
  const { data, error } = useDrugs()
  const blocks: Block[] = data ? [
    { type: 'text', id: 't1', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Sex differences in the published pharmacokinetics</h2>
        <p>
          In January 2013 the US Food and Drug Administration, for the first time, recommended a lower dose of a drug for women: the recommended dose of zolpidem, the hypnotic sold as Ambien, was reduced from
          10 mg to 5 mg. Women cleared the drug more slowly, and the following morning their blood concentrations remained high enough to impair driving. The dose had been set, as most doses are, on trials in which
          men predominated.<C file={data} id="fdazolpidem2013" />
        </p>
        <p>
          Zolpidem was the most widely reported case, but not an isolated one. A 2020 review identified every drug with published sex-specific pharmacokinetics and found 86. In 76 of them,
          women had higher blood concentrations or slower clearance on the same dose, and where the drug had known adverse effects, that difference predicted which sex experienced them. Women report
          adverse drug reactions nearly twice as often as men.<C file={data} id="zucker2020" />
        </p>
        <p>
          The simulator above takes three widely used drugs and plots what the published parameters imply: the same dose, in a woman and in a man, over one day.
          Body weight, oral contraceptive use and, for caffeine, pregnancy can be adjusted. Every curve is derived from a cited study, listed under the chart.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">The model</h2>
        <p>
          An orally administered drug is absorbed into the blood, distributes into the body's water and fat, and is cleared by the liver and kidneys. For most drugs, three parameters describe this process: the rate of
          absorption, the space into which the drug distributes (the volume of distribution), and the rate of clearance. The volume determines the height of the peak; the clearance determines the rate of decline; the two
          together determine the half-life. Repeated doses are superimposed on what remains of the previous ones.
        </p>
        <p>
          Each of those parameters has been measured separately in men and women for the drugs included here. The simulator substitutes the women's values and the men's values,
          scaled by body weight where the studies report them per kilogram, and plots both curves. The equations are on the <Link to="/your-dose/methods">methods page</Link>. It is a teaching model rather than a
          clinical one: variation between individuals within a sex exceeds the difference between the sex means.
        </p>
      </>
    ) },
    { type: 'text', id: 't3', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">The three drugs</h2>
        <p>
          <strong>Acetaminophen.</strong> Men clear it faster and have a larger volume of distribution, so on the same 1,000 mg dose a woman's blood concentration is higher and remains higher. In the
          study behind these curves, a 55 kg woman's clearance was 227 mL a minute against 323 for a 71 kg man.<C file={data} id="abernethy1982" /> Oral contraceptives
          induce the hepatic enzyme that metabolises acetaminophen, and women taking them cleared it 49% faster than women not taking them, and faster than the men.<C file={data} id="miners1983" />
        </p>
        <p>
          <strong>Caffeine.</strong> Between men and women not using hormonal contraception the difference is small; the principal factor is oestrogen. Oral contraception slowed caffeine clearance by 40% and extended its
          half-life from 5.4 to 7.9 hours;<C file={data} id="abernethy1985" /> late pregnancy extended it from 3 to 10.5 hours.<C file={data} id="knutti1982" /> With the state set to pregnancy,
          caffeine from a 1 pm dose remains in the blood at bedtime, and the next morning. The late luteal phase of an ordinary cycle also slows clearance, in step with progesterone.<C file={data} id="lane1992" />
          In <Link to="/cycling-brain">Experiment 1, the menstrual cycle</Link>, the same hormone is followed day by day across a cycle.
        </p>
        <p>
          <strong>Metoprolol.</strong> A beta-blocker taken by millions for blood pressure and after heart attacks. Twenty healthy volunteers took 100 mg twice a day; the women had about
          twice the exposure of the men, and their heart rates fell further on exercise, because a larger fraction of the dose escaped first-pass metabolism in the liver.<C file={data} id="luzier1999" /> A later
          modelling study concluded that 50 mg in a woman gives roughly the exposure of 100 mg in a man; tick the box to see that curve.<C file={data} id="eugene2016" /> The immediate-release label describes a single dose
          irrespective of sex,<C file={data} id="lopressor2023" /> and the extended-release label states that sex has no significant effect on the drug's kinetics.<C file={data} id="toprol2024" />
        </p>
      </>
    ) },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Limitations</h2>
        <p><strong>Averages, not individuals.</strong> Each curve is the mean of eight to ten healthy volunteers. An individual's liver enzymes, kidney function, age, other medicines and genes matter more than their sex. The spread between individuals is wider than the gap between the curves.</p>
        <p><strong>A simple model.</strong> One compartment, with first-order absorption and elimination. It captures the shape of the daily curve for these drugs but omits detail: metoprolol's first-pass metabolism saturates at higher doses, and acetaminophen's absorption depends on food intake.</p>
        <p><strong>Not advice.</strong> Nothing here indicates what dose any individual should take. The purpose is to show that sex differences in exposure at the same dose are measurable, and that for most drugs they have not been published. Of thousands of approved drugs, the 2020 review could find usable sex-specific data for 86.<C file={data} id="zucker2020" /></p>
      </>
    ) },
    { type: 'text', id: 't5', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">Method</h2>
        <p>
          The parameter table was built by hand from the primary studies and the FDA labels, with every value carrying its citation and, where derived, the arithmetic. It is published as a single
          data file on the <Link to="/your-dose/data">data page</Link>. The model runs in the browser; the maths is on the <Link to="/your-dose/methods">methods page</Link>.
          A clinical pharmacologist or pharmacist has not yet reviewed it; until one has, it should be read as a draft.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f3', size: 'flow', body: (<><h3 className="display text-xl font-medium mb-4">Sources</h3><SourceList file={data} /></>) },
  ] : []

  return (
    <div>
      <section className="mx-auto max-w-[42rem] px-4 pt-14 pb-8">
        <p className="eyebrow">Experiment 4</p>
        <h1 className="display mt-2 text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">
          Drug levels in the blood, by sex and body weight
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2 leading-relaxed">
          A pharmacokinetic simulator for acetaminophen, caffeine and metoprolol. Each curve uses published sex-specific parameters from the original studies,
          adjustable for body weight, oral contraception and pregnancy.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#simulator" onClick={jumpTo('simulator')} className="btn btn-solid">Open the simulator</a>
          <Link to="/your-dose/methods" className="btn">Methods</Link>
        </div>
      </section>
      {error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-berry">Could not load the data: {error}</p>}
      {!data && !error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-ink-3">Loading…</p>}
      {data && <Simulator file={data} />}
      <div className="mt-16"><Story blocks={blocks} /></div>
      <ExperimentNav current="/your-dose" />
    </div>
  )
}
