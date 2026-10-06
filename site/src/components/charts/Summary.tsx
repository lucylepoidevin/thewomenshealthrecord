import ChartFrame from './ChartFrame'

export default function Summary({ items, source }: { items: { value: string; label: string }[]; source: string }) {
  return (
    <ChartFrame title="Chapter 1 in four numbers" source={source}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-2">
        {items.map(i => (
          <div key={i.label} className="rounded-xl bg-blush-2/60 p-4">
            <div className="display text-3xl sm:text-5xl font-light text-berry leading-none">{i.value}</div>
            <div className="mt-2 text-xs sm:text-sm text-ink-2 leading-snug">{i.label}</div>
          </div>
        ))}
      </div>
    </ChartFrame>
  )
}
