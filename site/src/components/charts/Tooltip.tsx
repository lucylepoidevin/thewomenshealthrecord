import type { ReactNode } from 'react'

export type Tip = { x: number; y: number; content: ReactNode } | null

export default function Tooltip({ tip, width }: { tip: Tip; width: number }) {
  if (!tip) return null
  const flip = tip.x > width * 0.6
  return (
    <div
      className="chart-tooltip"
      style={{ left: flip ? undefined : tip.x + 12, right: flip ? width - tip.x + 12 : undefined, top: tip.y - 10 }}
    >
      {tip.content}
    </div>
  )
}
