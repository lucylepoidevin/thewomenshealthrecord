import { Link } from 'react-router-dom'
import { useDeserts } from '../lib/data'

export default function MammographyAccessMethods() {
  const { data } = useDeserts()
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-24">
      <p className="eyebrow">Methods · Experiment 7</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl font-light leading-tight">Methods: mammography access</h1>
      <ol className="mt-10 space-y-8">
        {[
          ['Facilities', 'The FDA\'s MQSA certified facility file (public.zip on the "search for a certified facility" page), a pipe-delimited list of facility name, three address lines, city, state, ZIP, phone and fax, replaced weekly. The version used is dated 5 October 2026. Entries in Puerto Rico, the territories and overseas military post offices are excluded because the county population file does not cover them.'],
          ['Geocoding', 'Addresses were submitted to the Census Bureau batch geocoder (benchmark Public_AR_Current, vintage Current_Current), first with address line 1, then, for the unmatched, with whichever other line contains a street number. Facilities still unmatched were placed at the internal point of their ZIP code tabulation area and assigned to the county holding the largest share of that ZCTA\'s land area. Twelve facilities could not be placed either way.'],
          ['Counties', 'Each placed point is assigned to a county by point-in-polygon against the Census Bureau\'s 2023 cartographic county boundaries (1:20m). This matters for Connecticut, whose 2023 population estimates use the new planning regions rather than the historical counties the geocoder returns.'],
          ['Women', 'Women aged 40 to 74 on 1 July 2023 from the Census Bureau\'s county population estimates by age and sex (CC-EST2023-AGESEX, year code 5), summed over the 40 to 44 through 70 to 74 bands. The age range follows the 2024 USPSTF recommendation for biennial screening.'],
          ['Distance', 'For every county, the great-circle distance from its 2020 Census population centre to the nearest placed facility anywhere in the fifty states and DC, shown in miles (stored in kilometres in the data file). The map shows it only for counties with no facility of their own. These are straight lines, not road distances.'],
          ['Rates', 'Facilities per 10,000 women aged 40 to 74, by county and by state. A facility is one certificate, whatever its size, hours or number of units.'],
        ].map(([t, b], i) => (
          <li key={t} className="flex gap-5"><span className="display mt-0.5 w-8 shrink-0 text-2xl font-light text-berry tabular-nums">{i + 1}</span><div><h2 className="display text-2xl font-medium">{t}</h2><p className="mt-2 text-ink-2 leading-relaxed">{b}</p></div></li>
        ))}
      </ol>
      <h2 className="display mt-14 text-2xl font-medium">What to be careful about</h2>
      <ul className="mt-3 space-y-3 text-ink-2 leading-relaxed list-disc pl-5">
        <li><strong className="text-ink">A certificate is not capacity.</strong> One mobile unit and a hospital with six machines each count once. The FDA does not publish units or volume per facility.</li>
        <li><strong className="text-ink">Mobile units.</strong> The file does not flag them; some carry "Mobile" in the name. A mobile unit's listed address is its base, not where it screens.</li>
        <li><strong className="text-ink">Straight lines.</strong> In mountains and on islands the road is much longer than the line; in cities the nearest facility may not be the one a woman can use.</li>
        <li><strong className="text-ink">Supply, not use.</strong> Screening rates depend on insurance, hours, language, transport and trust as well as distance. This page measures only where the facilities are.</li>
        <li><strong className="text-ink">Geocoding errors.</strong> About twelve percent of addresses were placed by ZIP code; a ZIP that straddles a county line can put a facility in the wrong county.</li>
      </ul>
      <h2 className="display mt-14 text-2xl font-medium">Run it</h2>
      <pre className="panel mt-3 overflow-x-auto text-sm leading-relaxed text-ink"><code>{`cd "mammography deserts project/pipeline"
python3 build_deserts.py   # reads data/raw (FDA list, geocoder output, Census files) and writes site/public/data/deserts/deserts.json and us.json`}</code></pre>
      {data && <p className="mt-6 text-sm text-ink-3">Data generated {data.generated}.</p>}
      <p className="mt-12 text-sm text-ink-3">Back to <Link to="/mammography-access" className="text-berry underline underline-offset-2">the map</Link>.</p>
    </div>
  )
}
