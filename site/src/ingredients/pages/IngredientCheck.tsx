import { Link } from 'react-router-dom'
import Story, { type Block } from '../../components/Story'
import Checker from '../components/Checker'
import ExperimentNav from '../../experiments/ExperimentNav'
import { jumpTo } from '../../cycling/lib/jump'
import { useIngredients, type IngredientsFile } from '../lib/data'

function Src({ file, id }: { file: IngredientsFile; id: string }) {
  const s = file.sources[id]
  return s ? <sup className="cite"><a href={s.url} target="_blank" rel="noreferrer" title={s.text}>[{Object.keys(file.sources).indexOf(id) + 1}]</a></sup> : null
}

export default function IngredientCheck() {
  const { data, error } = useIngredients()
  const n = data ? { confirmed: data.ingredients.filter(i => i.top_grade === 'confirmed').length, review: data.ingredients.filter(i => i.top_grade === 'review').length, flagged: data.ingredients.filter(i => i.top_grade === 'flagged').length, california: data.ingredients.filter(i => i.top_grade === 'california').length } : null
  const blocks: Block[] = data ? [
    { type: 'text', id: 't1', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What the lists are</h2>
        <p>
          Three official lists sit behind the checker. The first three grades come from the EU member states' endocrine disruptor lists, run by the authorities of Belgium, Denmark,
          France, the Netherlands, Spain and Sweden.<Src file={data} id="edlist1" /> <strong>List I</strong> holds substances formally identified as endocrine disruptors at EU level
          after a full evaluation. <strong>List II</strong> holds substances currently under evaluation because of an explicit concern; that is a question being asked, not an answer.
          <strong> List III</strong> holds substances one participating national authority considers endocrine disruptors but which have not been confirmed EU-wide.
        </p>
        <p>
          The fourth grade is Californian. Under the state's Safe Cosmetics Program, companies must report products sold in California that contain chemicals identified by
          authoritative bodies as causing cancer or reproductive harm.<Src file={data} id="california" /> The checker shows that grade only where the chemical is on the state's own
          Proposition 65 list, with the basis and the date of listing.<Src file={data} id="prop65" /> The program's own words: inclusion does not mean the product has been shown to cause harm.
        </p>
        <p>
          Right now the table holds {data.ingredients.length} chemicals: {n!.confirmed} confirmed, {n!.review} under review, {n!.flagged} flagged by one authority and {n!.california} on Proposition 65 only.
          Lists dated {data.generated}; they are updated twice a year and the date is shown with every result.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What a listing means, and what it doesn't</h2>
        <p>
          A hazard is what a chemical can do. A risk is what it does at the dose you meet. Every list here is a hazard list. Being on one says a substance can interfere with hormones,
          or cause cancer or reproductive harm, under some conditions, usually at doses far above what a cosmetic delivers. It does not say that a product containing it is harmful.
          Several listings carry conditions that the checker spells out: California's titanium dioxide and carbon black entries concern inhaling loose particles; its retinol entry
          concerns daily intake above 10,000 IU; its talc entry concerns talc with asbestos fibres.
        </p>
        <p>
          The lists also lag and disagree. Butylphenyl methylpropional has been banned in EU cosmetics since 2022 and is still permitted in the US. The EU's scientific committee has
          judged several List II and III substances safe at cosmetic concentrations, and said so; the listing records the question, the opinion records the answer. The checker shows both
          where it can.
        </p>
        <p>
          And the lists are short. About three hundred chemicals, against tens of thousands of cosmetic ingredients. A clean result means none of the ingredients the checker could read
          is on these three lists. It does not mean the product has been assessed.
        </p>
      </>
    ) },
    { type: 'text', id: 't3', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">How the matching works</h2>
        <p>
          Labels use INCI names ("Butylphenyl Methylpropional"); regulators use chemical names and CAS registry numbers ("2-(4-tert-butylbenzyl)propionaldehyde, 80-54-6"). The three lists
          were joined on CAS number, then every listed chemical's names were pulled from PubChem,<Src file={data} id="pubchem" /> giving about fourteen thousand synonyms, and a hand-checked
          table of common label names was placed on top. Each ingredient on a pasted label is matched whole, after stripping punctuation and accents, including anything in brackets.
          Nothing is matched by a word inside a longer name, so "Sodium Benzoate" does not trip "Benzophenone" and "Silica" does not trip the airborne crystalline silica listing.
        </p>
        <p>
          Two things the checker cannot see: anything behind the word "parfum" or "fragrance", which the law allows to stay unlisted, and any ingredient written in a way the synonym table
          has not met. Both are said on screen when they apply. The whole lookup runs in your browser; what you paste is not sent anywhere.
        </p>
      </>
    ) },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">How it was made</h2>
        <p>
          A script downloads the California dataset and the Proposition 65 list, reads the three EU list pages, joins them on CAS number, fetches synonyms from PubChem and writes one dated
          table with every source. The plain-language notes were written by hand from the regulations and scientific committee opinions they cite, and have not yet been reviewed by a
          toxicologist or dermatologist; until they have, read them as a careful draft. Details on the <Link to="/ingredient-check/methods">methods page</Link>; the table on the{' '}
          <Link to="/ingredient-check/data">data page</Link>.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f1', size: 'flow', body: (
      <>
        <h3 className="display text-xl font-medium mb-4">Sources</h3>
        <ol className="space-y-2 text-sm text-ink-2 leading-relaxed">
          {Object.entries(data.sources).map(([id, s], k) => (
            <li key={id} className="flex gap-3"><span className="w-5 shrink-0 text-right font-semibold text-berry">{k + 1}</span><span>{s.text} <a href={s.url} target="_blank" rel="noreferrer" className="text-berry underline underline-offset-2 break-all">{s.url.replace(/^https?:\/\//, '').slice(0, 70)}</a> Retrieved {s.retrieved}.</span></li>
          ))}
        </ol>
      </>
    ) },
  ] : []
  return (
    <div>
      <section className="mx-auto max-w-[42rem] px-4 pt-14 pb-8">
        <p className="eyebrow">Experiment 5</p>
        <h1 className="display mt-2 text-3xl sm:text-[2.5rem] font-medium leading-[1.15]">Cosmetic ingredients against the official hormone-disruptor lists</h1>
        <p className="mt-4 max-w-2xl text-[17px] text-ink-2 leading-relaxed">
          Paste the ingredient list from any beauty or personal care product. Each ingredient on the EU endocrine disruptor lists or California's Proposition 65 list comes back with the
          list's own grade, a one-line note and the source. No scores, no rankings.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#checker" onClick={jumpTo('checker')} className="btn btn-solid">Open the checker</a>
          <Link to="/ingredient-check/methods" className="btn">Methods</Link>
        </div>
      </section>
      {error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-berry">Could not load the data: {error}</p>}
      {!data && !error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-ink-3">Loading the lists…</p>}
      {data && <Checker file={data} />}
      <div className="mt-16"><Story blocks={blocks} /></div>
      <ExperimentNav current="/ingredient-check" />
    </div>
  )
}
