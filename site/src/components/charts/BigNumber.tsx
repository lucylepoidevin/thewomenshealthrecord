import ChartFrame from './ChartFrame'

export default function BigNumber({ value, label, detail, source }: { value: string; label: string; detail?: string; source: string }) {
  return (
    <ChartFrame title={label} source={source}>
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="display text-[clamp(4rem,14vw,9rem)] font-light leading-none text-berry">{value}</div>
        {detail && <p className="mt-4 max-w-xs text-sm text-ink-2 leading-relaxed">{detail}</p>}
      </div>
    </ChartFrame>
  )
}
