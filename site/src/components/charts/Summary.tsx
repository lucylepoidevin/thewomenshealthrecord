import ChartFrame from './ChartFrame'

export default function Summary({ items, source }: { items: { value: string; label: string }[]; source: string }) {
  return (
    <ChartFrame title="Chapter 1 in four numbers" source={source}>
      <div className="h-full grid grid-cols-2 gap-3 content-center">
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
