import { useEffect, useState } from 'react'

export type Source = { id: string; title: string; publisher: string; url: string; retrieved?: string; note?: string }

let cache: Source[] | null = null
const listeners = new Set<() => void>()

async function load() {
  if (cache) return cache
  const r = await fetch(`${import.meta.env.BASE_URL}data/sources.json`)
  cache = (await r.json()) as Source[]
  listeners.forEach(l => l())
  return cache
}

export function useSources() {
  const [sources, setSources] = useState<Source[]>(cache ?? [])
  useEffect(() => {
    if (cache) { setSources(cache); return }
    const l = () => setSources(cache!)
    listeners.add(l)
    load()
    return () => { listeners.delete(l) }
  }, [])
  const index: Record<string, number> = {}
  sources.forEach((s, i) => { index[s.id] = i + 1 })
  return { sources, index }
}
