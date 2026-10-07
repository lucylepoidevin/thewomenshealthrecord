import ChartFrame from './ChartFrame'

type Item = { value: string; label: string } | { women: string; men: string; label: string }

export default function Summary({ items, source, title = 'In four numbers' }: { items: Item[]; source: string; title?: string }) {
  return (
    <ChartFrame title={title} source={source}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-2">
        {items.map(i => (
          <div key={i.label} className="rounded-xl bg-blush-2/60 p-4">
            {'women' in i ? (
              <div className="flex items-end gap-4">
                <div><div className="display text-3xl sm:text-4xl font-light leading-none text-berry">{i.women}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose">women</div></div>
                <div><div className="display text-3xl sm:text-4xl font-light leading-none text-bronze">{i.men}</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-bronze">men</div></div>
              </div>
            ) : (
              <div className="display text-3xl sm:text-5xl font-light text-berry leading-none">{i.value}</div>
            )}
            <div className="mt-3 text-xs sm:text-sm text-ink-2 leading-snug">{i.label}</div>
          </div>
        ))}
      </div>
    </ChartFrame>
  )
}
