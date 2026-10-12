import { useState } from 'react'
import { Link } from 'react-router-dom'
import Story, { type Block } from '../../components/Story'
import ExperimentNav from '../../experiments/ExperimentNav'
import { jumpTo } from '../../cycling/lib/jump'
import CountyMap, { type Metric } from '../components/CountyMap'
import StateTable from '../components/StateTable'
import Cite, { SourceList } from '../components/Cite'
import { fmtN, km, useDeserts } from '../lib/data'

export default function MammographyAccess() {
  const { data, topo, error } = useDeserts()
  const [metric, setMetric] = useState<Metric>('per10k')
  const S = data?.sources ?? {}
  const n = data?.national
  const far = data ? [...data.counties].filter(c => c.facilities === 0 && c.nearest_km != null).sort((a, b) => b.nearest_km! - a.nearest_km!) : []
  const farBig = data ? [...data.counties].filter(c => c.facilities === 0).sort((a, b) => b.women - a.women).slice(0, 8) : []
  const top = data ? [...data.states].sort((a, b) => b.per10k - a.per10k) : []
  const blocks: Block[] = data && n ? [
    { type: 'text', id: 't1', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">What the map counts</h2>
        <p>
          Every mammography facility in the United States must hold a certificate under the Mammography Quality Standards Act, and the FDA publishes the list of certified facilities with their
          addresses every week.<Cite id="mqsa_list" sources={S} /> The file used here, dated {n.file_date}, holds {fmtN(n.facilities_in_file)} entries; the FDA's own scorecard counted 9,128 certified facilities with
          27,793 accredited units on 1 September 2026, reporting about 45 million mammography procedures a year.<Cite id="mqsa_stats" sources={S} />
        </p>
        <p>
          Each address was placed on the map with the Census Bureau's geocoder, or by its ZIP code where the street address did not match, and counted against the county it falls in.<Cite id="geocoder" sources={S} /><Cite id="zcta" sources={S} /> The
          denominator is the number of women aged 40 to 74 living in that county on 1 July 2023, from the Census Bureau's county population estimates, because those are the ages the
          US Preventive Services Task Force now recommends for screening every two years.<Cite id="popest" sources={S} /><Cite id="uspstf2024" sources={S} /> Nationally that is {fmtN(n.women_40_74)} women and{' '}
          {n.per10k_national} certified facilities for every ten thousand of them.
        </p>
      </>
    ) },
    { type: 'text', id: 't2', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">The counties with none</h2>
        <p>
          {fmtN(n.counties_without)} of the {fmtN(n.counties)} counties, {Math.round(100 * n.counties_without / n.counties)} percent, have no certified facility inside them. They are mostly small: together they hold{' '}
          {fmtN(n.women_without)} women aged 40 to 74, {n.women_without_pct} percent of the national total. Most of those women live within an hour of a facility in the next county, which is why a county
          with none is not automatically a desert. Distance is the better measure, so the second map colours each of those counties by the distance from its population centre to the
          nearest certified facility anywhere.<Cite id="cenpop" sources={S} />
        </p>
        <p>
          By that measure, {n.nearest_over_50km_counties} counties with {fmtN(n.nearest_over_50km_women)} women aged 40 to 74 are more than 50 kilometres, about 30 miles, from the nearest facility, and{' '}
          {n.nearest_over_100km_counties} counties with {fmtN(n.nearest_over_100km_women)} women are more than 100 kilometres away. The furthest outside Alaska is {far.find(c => c.state !== 'AK')?.name},{' '}
          {far.find(c => c.state !== 'AK')?.state}, at {km(far.find(c => c.state !== 'AK')!.nearest_km!)}. The largest county with no facility at all is {farBig[0].name}, {farBig[0].state}, with{' '}
          {fmtN(farBig[0].women)} women in the screening age range and the nearest facility {km(farBig[0].nearest_km!)} from its population centre.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f1', size: 'flow', body: (
      <>
        <p className="eyebrow mb-1">Counties with no certified facility</p>
        <h3 className="display text-xl font-medium mb-3">Furthest from a mammography facility, and most women without one</h3>
        <div className="grid gap-6 sm:grid-cols-2 text-xs">
          <table className="w-full"><thead><tr className="text-left text-ink-3"><th className="py-1 pr-2">Furthest (outside Alaska)</th><th className="py-1 pr-2 text-right">Women 40 to 74</th><th className="py-1 text-right">Nearest facility</th></tr></thead>
            <tbody>{far.filter(c => c.state !== 'AK').slice(0, 10).map(c => <tr key={c.fips} className="border-t border-hairline/70"><td className="py-1 pr-2">{c.name}, {c.state}</td><td className="py-1 pr-2 text-right tabular-nums">{fmtN(c.women)}</td><td className="py-1 text-right tabular-nums">{km(c.nearest_km!)}</td></tr>)}</tbody></table>
          <table className="w-full"><thead><tr className="text-left text-ink-3"><th className="py-1 pr-2">Most women, no facility</th><th className="py-1 pr-2 text-right">Women 40 to 74</th><th className="py-1 text-right">Nearest facility</th></tr></thead>
            <tbody>{farBig.map(c => <tr key={c.fips} className="border-t border-hairline/70"><td className="py-1 pr-2">{c.name}, {c.state}</td><td className="py-1 pr-2 text-right tabular-nums">{fmtN(c.women)}</td><td className="py-1 text-right tabular-nums">{km(c.nearest_km!)}</td></tr>)}</tbody></table>
        </div>
        <p className="mt-3 text-xs text-ink-3">Alaska's census areas are the furthest of all: {far[0].name} is {km(far[0].nearest_km!)} from the nearest certified facility. Distances are straight lines from the county's 2020 population centre, not road miles.</p>
      </>
    ) },
    { type: 'text', id: 't3', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">States</h2>
        <p>
          Per woman, the rural states come out ahead: {top[0].name} has {top[0].per10k} certified facilities per ten thousand women aged 40 to 74 and {top[top.length - 1].name} has{' '}
          {top[top.length - 1].per10k}. That is a count of sites, not of capacity or hours, and a facility in a town of five thousand serves a small denominator. Read the per-ten-thousand column as
          how thinly facilities are spread, and the last two columns as where the gaps are.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f2', size: 'flow', body: (
      <>
        <p className="eyebrow mb-1">All fifty states and DC</p>
        <h3 className="display text-xl font-medium mb-3">Certified facilities against women aged 40 to 74</h3>
        <StateTable rows={data.states} />
      </>
    ) },
    { type: 'text', id: 't4', body: (
      <>
        <h2 className="display text-3xl font-medium mb-4">How it was made, and what it cannot say</h2>
        <p>
          A script downloads the FDA list, geocodes every address, assigns each point to its 2023 county boundary, joins the county population by age and sex, and measures the distance from
          every county's population centre to the nearest facility. {fmtN(n.facilities_placed.address)} facilities were placed by street address, {fmtN(n.facilities_placed.zip)} by ZIP code, and{' '}
          {n.facilities_placed.unplaced} could not be placed; {n.excluded['outside the 50 states and DC']} entries outside the fifty states and DC, mostly Puerto Rico and military bases abroad, are
          left out because the population file does not cover them. Details on the <Link to="/mammography-access/methods">methods page</Link>; every county on the{' '}
          <Link to="/mammography-access/data">data page</Link>.
        </p>
        <p className="text-sm text-ink-2">
          Limits: a certificate says a site may perform mammography, not how many machines it runs, how many days it opens, whether it takes a given insurance or whether it is a mobile unit
          parked at that address. Distances are straight lines, not drives. County lines are administrative; women cross them. And the map shows supply, not use: the share of women who
          actually get screened varies for reasons that are not about distance.
        </p>
      </>
    ) },
    { type: 'figure', id: 'f3', size: 'flow', body: (<><h3 className="display text-xl font-medium mb-4">Sources</h3><SourceList sources={S} /></>) },
  ] : []
  return (
    <div>
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-12 sm:pt-28 text-center">
        <p className="eyebrow">Experiment 7</p>
        <h1 className="display mt-5 text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.02]">Mammography facilities by county, and the counties with none</h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg text-ink-2 leading-relaxed">
          Every FDA-certified mammography facility, placed on the map and counted against the women aged 40 to 74 who live in each county. Then the counties with no facility at all, and
          how far their women have to go.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a href="#map" onClick={jumpTo('map')} className="btn btn-solid">See the map</a>
          <Link to="/mammography-access/methods" className="btn">Methods</Link>
        </div>
      </section>
      {error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-berry">Could not load the data: {error}</p>}
      {(!data || !topo) && !error && <p className="mx-auto max-w-2xl px-4 text-center text-sm text-ink-3">Loading the map…</p>}
      {data && topo && (
        <section id="map" className="mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
            <span className="eyebrow mr-3">Colour by</span>
            <button type="button" className={`tab ${metric === 'per10k' ? 'is-active' : ''}`} onClick={() => setMetric('per10k')}>Facilities per 10,000 women</button>
            <button type="button" className={`tab ${metric === 'nearest' ? 'is-active' : ''}`} onClick={() => setMetric('nearest')}>Distance where there are none</button>
          </div>
          <div className="mt-4"><CountyMap topo={topo} counties={data.counties} metric={metric} /></div>
          <p className="mt-2 text-xs text-ink-3">{fmtN(data.national.facilities_in_file)} certified facilities in the FDA list of {data.national.file_date}; women aged 40 to 74 by county, 1 July 2023. Hover a county.</p>
        </section>
      )}
      <div className="mt-16"><Story blocks={blocks} /></div>
      <ExperimentNav current="/mammography-access" />
    </div>
  )
}
