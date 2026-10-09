import type { Region } from '../lib/data'

type Props = { regions: Record<string, Region>; value: string; onChange: (k: string) => void }

const ORDER = ['medial temporal lobe', 'subcortical', 'temporal', 'cortex', 'whole brain', 'fluid']

export default function RegionPicker({ regions, value, onChange }: Props) {
  const groups = ORDER.map(g => ({ g, keys: Object.keys(regions).filter(k => regions[k].group === g) })).filter(x => x.keys.length)
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold tracking-wide text-ink-2">
      <span className="eyebrow">Highlight</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-full border border-berry/30 bg-white/70 px-4 py-2 text-sm font-semibold text-berry outline-none focus:ring-2 focus:ring-rose/40"
      >
        {groups.map(({ g, keys }) => (
          <optgroup key={g} label={g[0].toUpperCase() + g.slice(1)}>
            {keys.map(k => <option key={k} value={k}>{regions[k].name}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
