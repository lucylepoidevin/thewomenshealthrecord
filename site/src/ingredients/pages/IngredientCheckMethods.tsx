import { Link } from 'react-router-dom'
import { useIngredients } from '../lib/data'

export default function IngredientCheckMethods() {
  const { data } = useIngredients()
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24">
      <p className="eyebrow">Methods · Experiment 5</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl font-light leading-tight">Methods: ingredient check</h1>
      <ol className="mt-10 space-y-8">
        {[
          ['Sources', 'Three lists. California\'s Safe Cosmetics Program "Chemicals in Cosmetics" dataset (CHHS open data), which records products companies have reported as containing chemicals identified as causing cancer or reproductive harm. The EU member-state Endocrine Disruptor Lists I, II and III (edlists.org), read from the list pages because the site\'s export link returns a bot-check page. California\'s Proposition 65 list from OEHHA, with basis and listing date.'],
          ['Join', 'EU rows are grouped by CAS number; a substance appearing on several lists keeps every listing. California-reported chemicals are joined to Proposition 65 by CAS number; the handful of cosmetic-relevant Prop 65 entries that carry no CAS number (titanium dioxide, carbon black, talc, retinol and its esters, cocamide DEA, lead) are mapped by hand with the listing\'s own qualifier kept. Reported chemicals that are not on Proposition 65 are left out of the California grade, and two listings whose context cannot apply to a product on the skin (airborne crystalline silica; ethanol in alcoholic beverages) are dropped.'],
          ['Grades', 'Confirmed = EU List I. Under review = EU List II. Flagged by one authority = EU List III. Reportable in California = on Proposition 65 and reported to the Safe Cosmetics Program. An ingredient\'s headline grade is its highest; every listing is shown underneath with status, year, regulatory field and source.'],
          ['Names', 'For every CAS number, synonyms are fetched from PubChem and filtered to drop registry identifiers and product names. A hand-checked table of common INCI label names is placed first, so ambiguous synonyms resolve to the right chemical. Matching is on the whole ingredient token after normalisation (lower case, accents and punctuation removed), including parenthetical names, never on substrings.'],
          ['Notes', 'The plain-language notes cover the listed ingredients that appear in ordinary products. They state regulatory facts (restrictions, bans, scientific committee opinions, listing qualifiers) and avoid verdicts. They have not yet been reviewed by a toxicologist or dermatologist.'],
          ['Test', 'The matcher was run over several hundred real ingredient lists from Open Beauty Facts to check for false matches before launch; that is what caught the silica and ethanol listings.'],
        ].map(([t, b], i) => (
          <li key={t} className="flex gap-5"><span className="display mt-0.5 w-8 shrink-0 text-2xl font-light text-berry tabular-nums">{i + 1}</span><div><h2 className="display text-2xl font-medium">{t}</h2><p className="mt-2 text-ink-2 leading-relaxed">{b}</p></div></li>
        ))}
      </ol>
      <h2 className="display mt-14 text-2xl font-medium">What to be careful about</h2>
      <ul className="mt-3 space-y-3 text-ink-2 leading-relaxed list-disc pl-5">
        <li><strong className="text-ink">Hazard, not risk.</strong> Every list is a hazard list. Dose, route and concentration decide risk, and cosmetics regulators set concentration limits for exactly that reason.</li>
        <li><strong className="text-ink">Short lists.</strong> About three hundred chemicals against tens of thousands of ingredients. A clean result is not an assessment.</li>
        <li><strong className="text-ink">Fragrance is opaque.</strong> "Parfum" may hide listed ingredients and cannot be checked.</li>
        <li><strong className="text-ink">Lists change.</strong> The EU lists update at least twice a year; the table is dated and the script re-runs in minutes.</li>
        <li><strong className="text-ink">Names are the weak point.</strong> A label spelling the synonym table has not met is simply not matched. Tell us and it gets added.</li>
      </ul>
      <h2 className="display mt-14 text-2xl font-medium">Run it</h2>
      <pre className="panel mt-3 overflow-x-auto text-sm leading-relaxed text-ink"><code>{`cd "ingredient check project/pipeline"
python3 build_lists.py     # downloads nothing itself; reads data/raw/ and writes site/public/data/ingredients/ingredients.json`}</code></pre>
      {data && <p className="mt-6 text-sm text-ink-3">Table generated {data.generated}.</p>}
      <p className="mt-12 text-sm text-ink-3">Back to <Link to="/ingredient-check" className="text-berry underline underline-offset-2">the checker</Link>.</p>
    </div>
  )
}
