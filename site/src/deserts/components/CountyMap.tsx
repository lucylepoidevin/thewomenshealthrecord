import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import { feature, mesh } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { useSize } from '../../lib/useSize'
import { fmtN, km, type County } from '../lib/data'

export type Metric = 'per10k' | 'nearest'
type Props = { topo: Topology; counties: County[]; metric: Metric }

/**
 * Every county coloured by certified mammography facilities per 10,000 women aged 40 to 74, or, for counties
 * with none, by the distance from the county's population centre to the nearest facility. Albers USA projection.
 */
export default function CountyMap({ topo, counties, metric }: Props) {
  const { ref, width } = useSize<HTMLDivElement>()
  const w = Math.max(320, width), h = w * 0.62
  const [hover, setHover] = useState<County | null>(null)
  const [pos, setPos] = useState<[number, number]>([0, 0])
  const byFips = useMemo(() => new Map(counties.map(c => [c.fips, c])), [counties])
  const geo = useMemo(() => ({
    counties: feature(topo, topo.objects.counties as GeometryCollection),
    states: mesh(topo, topo.objects.states as GeometryCollection, (a, b) => a !== b),
    nation: mesh(topo, topo.objects.states as GeometryCollection, (a, b) => a === b),
  }), [topo])
  const path = useMemo(() => d3.geoPath(d3.geoAlbersUsa().fitSize([w, h], geo.nation)), [w, h, geo])
  const perScale = d3.scaleThreshold<number, string>().domain([0.5, 1, 1.5, 2.5, 4]).range(['#3B3238', '#5C4A54', '#8A6B7A', '#B98CA3', '#D9A8BF', '#F2CFDD'])
  const kmScale = d3.scaleThreshold<number, string>().domain([25, 50, 100]).range(['#4A3E45', '#8A6B7A', '#C9A0B3', '#F2CFDD'])
  const fill = (c: County | undefined) => {
    if (!c) return '#1A171B'
    if (metric === 'per10k') return c.facilities === 0 ? '#1A171B' : perScale(c.per10k ?? 0)
    return c.facilities === 0 && c.nearest_km != null ? kmScale(c.nearest_km) : '#26222A'
  }
  const legend = metric === 'per10k'
    ? [['none', '#1A171B'], ['under 0.5', '#3B3238'], ['0.5 to 1', '#5C4A54'], ['1 to 1.5', '#8A6B7A'], ['1.5 to 2.5', '#B98CA3'], ['2.5 to 4', '#D9A8BF'], ['4 or more', '#F2CFDD']]
    : [['has a facility', '#26222A'], ['under 25 km', '#4A3E45'], ['25 to 50 km', '#8A6B7A'], ['50 to 100 km', '#C9A0B3'], ['over 100 km', '#F2CFDD']]
  return (
    <div ref={ref} className="relative w-full select-none">
      <svg width={w} height={h} onPointerLeave={() => setHover(null)}>
        {geo.counties.features.map(f => {
          const c = byFips.get(String(f.id))
          return <path key={String(f.id)} d={path(f) ?? ''} fill={fill(c)} stroke="#121014" strokeWidth={0.3}
            onPointerMove={e => { setHover(c ?? null); const r = e.currentTarget.ownerSVGElement!.getBoundingClientRect(); setPos([e.clientX - r.left, e.clientY - r.top]) }} />
        })}
        <path d={path(geo.states) ?? ''} fill="none" stroke="#7F7479" strokeWidth={0.6} pointerEvents="none" />
        <path d={path(geo.nation) ?? ''} fill="none" stroke="#B9AEB4" strokeWidth={0.8} pointerEvents="none" />
      </svg>
      {hover && (
        <div className="chart-tooltip" style={{ left: Math.min(pos[0] + 12, w - 220), top: pos[1] + 12, width: 210 }}>
          <div className="font-semibold">{hover.name}, {hover.state}</div>
          <div>{fmtN(hover.women)} women aged 40 to 74</div>
          <div>{hover.facilities === 0 ? 'No certified facility' : `${hover.facilities} certified ${hover.facilities === 1 ? 'facility' : 'facilities'}`}{hover.per10k != null && hover.facilities > 0 ? ` · ${hover.per10k.toFixed(2)} per 10,000` : ''}</div>
          {hover.facilities === 0 && hover.nearest_km != null && <div>Nearest: {km(hover.nearest_km)} from the county's population centre</div>}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-ink-2">
        {legend.map(([l, c]) => <span key={l} className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm border border-hairline" style={{ background: c }} />{l}</span>)}
        <span className="text-ink-3">{metric === 'per10k' ? 'facilities per 10,000 women aged 40 to 74' : 'distance to the nearest certified facility, counties with none'}</span>
      </div>
    </div>
  )
}
