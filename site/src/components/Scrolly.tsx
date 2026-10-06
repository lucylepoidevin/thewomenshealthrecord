import { useEffect, useRef, useState, type ReactNode } from 'react'

export type Step = { id: string; text: ReactNode }

type Props = {
  steps: Step[]
  /** Renders the sticky graphic for the active step index. */
  graphic: (activeIndex: number) => ReactNode
}

/**
 * Scrollytelling primitive: text steps scroll on the left, a sticky graphic on
 * the right updates to the step currently crossing the middle of the viewport.
 * On narrow screens the graphic sticks to the top and steps scroll beneath it.
 */
export default function Scrolly({ steps, graphic }: Props) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.index)
            setActive(i)
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    refs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [steps.length])

  return (
    <div className="relative mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      {/* graphic: sticky on both layouts; order-first on mobile */}
      <div className="sticky top-14 z-10 lg:order-2 lg:top-20 lg:h-[calc(100vh-6rem)] h-[52vh] bg-blush">
        <div className="h-full w-full rounded-2xl border border-hairline bg-white/70 p-3 sm:p-5 overflow-hidden">
          {graphic(active)}
        </div>
      </div>
      <div className="lg:order-1">
        {steps.map((s, i) => (
          <div
            key={s.id}
            data-index={i}
            ref={el => { refs.current[i] = el }}
            className={`prose-step min-h-[60vh] lg:min-h-[85vh] flex items-center py-10 transition-opacity duration-300 ${i === active ? 'opacity-100' : 'opacity-35'}`}
          >
            <div className="text-[17px] leading-relaxed text-ink max-w-prose">{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
