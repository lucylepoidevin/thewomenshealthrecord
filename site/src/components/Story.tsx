import type { ReactNode } from 'react'

export type Block =
  | { type: 'text'; id: string; body: ReactNode }
  | { type: 'figure'; id: string; body: ReactNode; /** 'chart' gets a fixed height; 'flow' grows with content (tables) */ size?: 'chart' | 'tall' | 'flow'; wide?: boolean }


/** Long-form story: one column of prose, with each figure as its own wider section between paragraphs. */
export default function Story({ blocks }: { blocks: Block[] }) {
  return (
    <div>
      {blocks.map(b =>
        b.type === 'text' ? (
          <div key={b.id} className="prose-step mx-auto max-w-[42rem] px-4 py-6 text-[18px] leading-[1.75] text-ink">
            {b.body}
          </div>
        ) : (
          <div key={b.id} className={`mx-auto px-4 py-8 sm:py-10 ${b.wide ? 'max-w-6xl' : 'max-w-5xl'}`}>
            <div className={`graphic-card p-4 sm:p-7 ${b.size === 'flow' ? '' : b.size === 'tall' ? 'h-[520px] sm:h-[640px]' : 'h-[440px] sm:h-[560px]'}`}>
              {b.body}
            </div>
          </div>
        ),
      )}
    </div>
  )
}
