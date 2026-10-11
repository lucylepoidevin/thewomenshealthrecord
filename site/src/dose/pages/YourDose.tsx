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
        <h2 className="display text-3xl font-medium mb-4">The dose was set on a body that may not be yours</h2>
        <p>
          In January 2013 the US Food and Drug Administration, for the first time, told doctors to prescribe a lower dose of a drug to women: zolpidem, the sleeping pill sold as Ambien, went from
          10 mg to 5 mg. Women cleared it more slowly, so the next morning they still had enough in their blood to impair driving. The dose had been set, like most doses, on trials dominated by
          men's results.<C file={data} id="fdazolpidem2013" />
        </p>
        <p>
          Zolpidem was the case that made the news. It was not the exception. A 2020 review went looking for every drug with published sex-specific pharmacokinetics and found 86. In 76 of them,
          women ended up with higher blood levels or slower clearance on the same dose, and where the drug had known side effects, that difference predicted which sex suffered them. Women report
          adverse drug reactions nearly twice as often as men.<C file={data} id="zucker2020" />
        </p>
        <p>
          The simulator above takes three drugs almost everyone has taken and draws what the published numbers imply: the same tablet, in a woman's body and in a man's, across one day.
          Change her weight. Put her on the pill. For caffeine, make her pregnant. Every curve traces back to a study, listed under the chart.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">How the model works, simply</h2>
        <p>
          A swallowed drug is absorbed into the blood, spreads into the body's water and fat, and is cleared by the liver and kidneys. Three numbers describe that for most drugs: how fast it is
          absorbed, how much space it spreads into (the volume of distribution), and how fast it is cleared. The volume sets how high the peak is; the clearance sets how fast it falls; the two
          together set the half-life. Repeated doses stack on top of what is left from the last one.
        </p>
        <p>
          Each of those numbers has been measured separately in men and women for the drugs here, and that is all the simulator does: it plugs in the women's numbers and the men's numbers,
          scaled by body weight where the studies report them per kilogram, and draws both. The maths is on the <Link to="/your-dose/methods">methods page</Link>. It is a teaching model, not a
          clinical one: real people vary more within a sex than the averages differ between them.
        </p>
      </>
    ) },
    { type: 'text', id: 't3', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What each drug shows</h2>
        <p>
          <strong>Acetaminophen.</strong> Men clear it faster and have more body to spread it into, so on the same 1,000 mg a woman's blood level runs higher and stays higher. In the
          study behind these curves, a 55 kg woman's clearance was 227 mL a minute against 323 for a 71 kg man.<C file={data} id="abernethy1982" /> The twist is the pill: oral contraceptives
          induce the liver enzyme that handles acetaminophen, and women on them cleared it 49% faster than women off them, faster even than the men.<C file={data} id="miners1983" /> Same tablet,
          three different bodies.
        </p>
        <p>
          <strong>Caffeine.</strong> Between men and women off hormonal contraception the difference is small. Oestrogen is what matters. The pill slowed caffeine clearance by 40% and stretched its
          half-life from 5.4 to 7.9 hours;<C file={data} id="abernethy1985" /> late pregnancy stretched it from 3 to 10.5 hours.<C file={data} id="knutti1982" /> Set the state to pregnancy and
          watch a 1 pm coffee still sitting in the blood at bedtime, and the next morning. Even the late luteal phase of an ordinary cycle slows it, in step with progesterone.<C file={data} id="lane1992" />
          If you have read <Link to="/cycling-brain">the cycling brain</Link>, this is the same hormone, doing something else.
        </p>
        <p>
          <strong>Metoprolol.</strong> A beta-blocker taken by millions for blood pressure and after heart attacks. Twenty healthy volunteers took 100 mg twice a day; the women ended up with about
          twice the exposure of the men, and their heart rates fell further on exercise, because more of the drug got through the liver's first pass.<C file={data} id="luzier1999" /> A later
          modelling study concluded that 50 mg in a woman gives roughly the exposure of 100 mg in a man; tick the box to see that curve.<C file={data} id="eugene2016" /> The immediate-release label describes one dose for
          everyone,<C file={data} id="lopressor2023" /> and the extended-release label states that sex has no significant effect on the drug's kinetics.<C file={data} id="toprol2024" />
        </p>
      </>
    ) },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What this can and cannot tell you</h2>
        <p><strong>Averages, not you.</strong> Each curve is the mean of eight to ten healthy volunteers. Your own liver enzymes, kidney function, age, other medicines and genes matter more than your sex. The spread between people is wider than the gap between the curves.</p>
        <p><strong>A simple model.</strong> One compartment, first-order everything. It captures the shape of the day well for these drugs and misses the detail: metoprolol's first pass saturates at higher doses, acetaminophen's absorption depends on what you ate.</p>
        <p><strong>Not advice.</strong> Nothing here says what dose anyone should take. The point is that the question "the same dose for whom?" has measurable answers, and that for most drugs nobody has published them. Of thousands of approved drugs, the 2020 review could find usable sex-specific data for 86.<C file={data} id="zucker2020" /></p>
      </>
    ) },
    { type: 'text', id: 't5', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">How it was made</h2>
        <p>
          The parameter table was built by hand from the primary studies and the FDA labels, with every value carrying its citation and, where derived, the arithmetic. It is published as a single
          data file on the <Link to="/your-dose/data">data page</Link>. The model runs in the browser; the maths is on the <Link to="/your-dose/methods">methods page</Link>.
          A clinical pharmacologist or pharmacist has not yet reviewed it; until one has, read it as a draft.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f3', size: 'flow', body: (<><h3 className="display text-xl font-medium mb-4">Sources</h3><SourceList file={data} /></>) },
  ] : []

  return (
    <div>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-28 text-center">
        <p className="eyebrow">Experiment 4</p>
        <h1 className="display mt-5 text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.02]">
          Same pill, different body.<br />
          <span className="italic font-medium text-berry">Your body, your dose,</span> drawn from the published numbers.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg text-ink-2 leading-relaxed">
          Pick a drug, set a body, and watch its level in the blood rise and fall over a day beside the body the dose was designed around. Acetaminophen, caffeine and a common heart drug,
          each with sex-specific numbers from the original studies.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a href="#simulator" onClick={jumpTo('simulator')} className="btn btn-solid">Open the simulator <span aria-hidden>↓</span></a>
          <Link to="/your-dose/methods" className="btn">How it was made</Link>
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
