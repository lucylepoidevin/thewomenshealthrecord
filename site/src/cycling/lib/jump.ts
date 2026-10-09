import type { MouseEvent } from 'react'

/** In-page anchors can't use href="#id" under a hash router, so scroll by hand. */
export function jumpTo(id: string) {
  return (e: MouseEvent) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
