import type { ReactNode } from 'react'

/** Title, subtitle, plot area, and a source line: the anatomy every chart shares. */
export default function ChartFrame({ title, subtitle, source, children }: { title: string; subtitle?: string; source: string; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2">
        <h3 className="display text-lg sm:text-xl font-medium leading-tight text-ink">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-ink-2 mt-1">{subtitle}</p>}
      </div>
      <div className="relative flex-1 min-h-0">{children}</div>
      <p className="mt-2 text-[11px] text-ink-3 leading-snug">{source}</p>
    </div>
  )
}
