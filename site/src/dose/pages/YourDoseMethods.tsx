import { Link } from 'react-router-dom'
import { SourceList } from '../components/Cite'
import { useDrugs } from '../lib/data'

export default function YourDoseMethods() {
  const { data } = useDrugs()
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24">
      <p className="eyebrow">Methods · Experiment 4</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl font-medium leading-tight">Methods: drug level simulator</h1>
      <p className="mt-6 text-lg text-ink-2 leading-relaxed">A one-compartment model with first-order absorption and elimination, the standard teaching model of oral pharmacokinetics, fed with published sex-specific parameters.</p>
      <h2 className="display mt-12 text-2xl font-medium">The model</h2>
      <p className="mt-3 text-ink-2 leading-relaxed">For a single oral dose D with bioavailability F, absorption rate k<sub>a</sub>, volume of distribution V and clearance CL (so elimination rate k<sub>e</sub> = CL / V), the plasma concentration at time t after the dose is</p>
      <pre className="panel mt-3 overflow-x-auto text-sm leading-relaxed text-ink"><code>{`C(t) = F · D / V · ka / (ka − ke) · ( e^(−ke·t) − e^(−ka·t) )`}</code></pre>
      <p className="mt-3 text-ink-2 leading-relaxed">Repeated doses are added together (superposition), which is exact for a linear model. Where a study reports a lag before absorption starts, t is shifted by it. The simulator runs five identical days and shows the fifth, so that drugs with longer half-lives have reached steady state. Half-life is ln 2 · V / CL.</p>
      <h2 className="display mt-12 text-2xl font-medium">The parameters</h2>
      <ul className="mt-3 space-y-3 text-ink-2 leading-relaxed list-disc pl-5">
        <li><strong className="text-ink">Acetaminophen.</strong> Volume and clearance by sex from an intravenous study (so they are true values, not apparent ones), expressed per kilogram using that study's group weights and scaled to the chosen body weight. Oral bioavailability 0.89 from a separate study at 1,000 mg. The absorption rate is an assumption (absorption half-life of 30 minutes, consistent with the 30 to 60 minute peak seen in oral studies) and is flagged as such. Oral contraceptive use multiplies clearance by 1.49.</li>
        <li><strong className="text-ink">Caffeine.</strong> Clearance, volume and time-to-peak for women not using and using oral contraception from one oral study; the absorption rate is solved from the reported time-to-peak. Men from the control arm of an intravenous study, with volume derived from clearance and half-life and the women's absorption rate applied. Late pregnancy divides clearance by 3.5, the ratio of reported half-lives, with volume held constant, as that study reported.</li>
        <li><strong className="text-ink">Metoprolol.</strong> Apparent oral clearance for S-metoprolol by sex derived directly from the original volunteers' steady-state exposure (dose over the 12-hour AUC: 240 L/h in men, 115 L/h in women); a 3.5 hour half-life from the label, which that study found did not differ by sex; volume from the two; and the absorption rate solved from the time-to-peak in a later published fit to the same data. That fit's own volume figures are inconsistent with its half-lives and are not used. Because clearance and volume are apparent values (already divided by bioavailability) F is set to 1, and because the study did not report body weights, the weight slider is disabled.</li>
      </ul>
      <h2 className="display mt-12 text-2xl font-medium">Limitations</h2>
      <ul className="mt-3 space-y-3 text-ink-2 leading-relaxed list-disc pl-5">
        <li>Each parameter set comes from eight to ten people. Individual variation is larger than the sex difference.</li>
        <li>Linear scaling with body weight is a modelling convention; the acetaminophen study itself found distribution into weight above ideal weight is less than proportional.</li>
        <li>A one-compartment model simplifies observed curves: it ignores the second, slower distribution phase and any saturation of first-pass metabolism.</li>
        <li>Published values may be revised. The parameter file is dated, and every value can be traced and replaced.</li>
        <li>Not yet reviewed by a pharmacist or clinical pharmacologist. Not medical advice.</li>
      </ul>
      <h2 className="display mt-12 text-2xl font-medium">Reproduce</h2>
      <pre className="panel mt-3 overflow-x-auto text-sm leading-relaxed text-ink"><code>{`cd "your dose project/pipeline"
python3 build_drugs.py     # writes site/public/data/dose/drugs.json with every value's citation`}</code></pre>
      {data && (<><h2 className="display mt-12 text-2xl font-medium">Sources</h2><div className="mt-4"><SourceList file={data} /></div></>)}
      <p className="mt-12 text-sm text-ink-3">Back to <Link to="/your-dose" className="text-berry underline underline-offset-2">Experiment 4</Link>.</p>
    </div>
  )
}
