import { DATA, GRADE_ORDER, useIngredients } from '../lib/data'

export default function IngredientCheckData() {
  const { data } = useIngredients()
  return (
    <div className="mx-auto max-w-5xl px-4 pt-16 pb-24">
      <p className="eyebrow">Data · Experiment 5</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl font-medium leading-tight">Ingredient table</h1>
      <p className="mt-6 max-w-3xl text-lg text-ink-2 leading-relaxed">One JSON file holds every listed chemical, its CAS numbers, every listing with status, year and source, the label names that match it, and the plain-language notes. Free to reuse with attribution to this page and to the lists.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        <li className="panel"><a href={`${DATA}ingredients.json`} download className="font-semibold text-berry underline underline-offset-2">ingredients.json</a><p className="mt-1 text-sm text-ink-2">{data ? `${data.ingredients.length} chemicals, generated ${data.generated}.` : ''}</p></li>
      </ul>
      {data && (
        <div className="table-wrap mt-10 rule pt-4">
          <table className="w-full text-xs sm:text-sm">
            <thead><tr className="text-left text-[12px] text-ink-3"><th className="py-2 pr-3 font-semibold">Chemical</th><th className="py-2 pr-3 font-semibold">Label name</th><th className="py-2 pr-3 font-semibold">CAS</th><th className="py-2 pr-3 font-semibold">Grade</th><th className="py-2 font-semibold text-right">Listings</th></tr></thead>
            <tbody>
              {[...data.ingredients].sort((a, b) => GRADE_ORDER.indexOf(a.top_grade) - GRADE_ORDER.indexOf(b.top_grade) || a.name.localeCompare(b.name)).map(i => (
                <tr key={i.id} className="border-t border-hairline/70 align-top">
                  <td className="py-1.5 pr-3 text-ink">{i.name}</td><td className="py-1.5 pr-3 text-ink-2">{i.inci_hint ?? ''}</td><td className="py-1.5 pr-3 tabular-nums text-ink-2">{i.cas.join(', ')}</td>
                  <td className="py-1.5 pr-3"><span className={`grade grade-${i.top_grade}`}>{data.grade_names[i.top_grade]}</span></td><td className="py-1.5 text-right tabular-nums">{i.grades.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
