import { useEffect, useRef, useState } from 'react'
import { Niivue, NVImage, SLICE_TYPE, DRAG_MODE } from '@niivue/niivue'
import { brainUrl } from '../lib/data'

export type View = 'coronal' | 'axial' | 'sagittal' | 'multi'
const SLICE: Record<View, SLICE_TYPE> = {
  coronal: SLICE_TYPE.CORONAL, axial: SLICE_TYPE.AXIAL, sagittal: SLICE_TYPE.SAGITTAL, multi: SLICE_TYPE.MULTIPLANAR,
}

type Props = {
  day: number
  /** label ids (UNesT 133 atlas) to paint; everything else stays transparent */
  highlight: number[]
  labelNames: Record<string, string>
  /** MNI305 mm; the crosshair jumps here when it changes */
  center?: number[]
  view: View
  onLoading?: (loading: boolean) => void
}

const ROSE = [224, 90, 138]

function labelColormap(highlight: number[], names: Record<string, string>) {
  const n = 133
  const I: number[] = [], R: number[] = [], G: number[] = [], B: number[] = [], A: number[] = [], labels: string[] = []
  const on = new Set(highlight)
  for (let i = 0; i < n; i++) {
    I.push(i); labels.push(names[String(i)] ?? String(i))
    if (on.has(i)) { R.push(ROSE[0]); G.push(ROSE[1]); B.push(ROSE[2]); A.push(200) }
    else { R.push(0); G.push(0); B.push(0); A.push(0) }
  }
  return { R, G, B, A, I, labels }
}

/**
 * NiiVue canvas showing one day's T1w scan in MNI305 space with the chosen
 * region painted over it. Volumes are decoded once and cached, so scrubbing
 * the day slider swaps already-loaded images rather than refetching.
 */
export default function BrainViewer({ day, highlight, labelNames, center, view, onLoading }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const nvRef = useRef<Niivue | null>(null)
  const cache = useRef(new Map<string, Promise<NVImage>>())
  const centerRef = useRef(center)
  centerRef.current = center
  const shown = useRef<number | null>(null)
  const [ready, setReady] = useState(false)

  const load = (url: string) => {
    let p = cache.current.get(url)
    if (!p) { p = NVImage.loadFromUrl({ url, name: url.split('/').pop() }); cache.current.set(url, p) }
    return p
  }

  // create the viewer once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || nvRef.current) return
    const nv = new Niivue({
      backColor: [0.082, 0.035, 0.059, 1],
      crosshairColor: [0.88, 0.35, 0.54, 0.75],
      crosshairWidth: 0,
      isColorbar: false,
      isOrientCube: false,
      isRadiologicalConvention: false,
      dragMode: DRAG_MODE.none,
      isResizeCanvas: true,
      multiplanarForceRender: false,
      logLevel: 'warn',
    })
    nvRef.current = nv
    // no cancellation flag: under StrictMode the effect runs twice and the second
    // pass bails out above, so the first pass must be the one to flip `ready`
    nv.attachToCanvas(canvas).then(() => setReady(true))
  }, [])

  // swap the day's images in
  useEffect(() => {
    const nv = nvRef.current
    if (!nv || !ready) return
    let cancelled = false
    onLoading?.(true)
    Promise.all([load(brainUrl(day, 't1')), load(brainUrl(day, 'labels'))]).then(([t1, lab]) => {
      if (cancelled) return
      const keep = Array.from(nv.scene.crosshairPos) as [number, number, number]
      while (nv.volumes.length) nv.removeVolume(nv.volumes[0])
      lab.opacity = 0.85
      nv.addVolume(t1)
      nv.addVolume(lab)
      lab.setColormapLabel(labelColormap(highlight, labelNames))
      // first load: slice through the region; later loads: stay where the reader left the view
      const c = centerRef.current
      nv.scene.crosshairPos = shown.current === null && c ? nv.mm2frac([c[0], c[1], c[2]]) : keep
      nv.updateGLVolume()
      shown.current = day
      onLoading?.(false)
      // quietly warm the cache for the neighbouring days, then the rest
      const order = [day + 1, day - 1, day + 2, day - 2, ...Array.from({ length: 30 }, (_, i) => i + 1)]
      const seen = new Set<number>()
      const next = () => {
        const d = order.find(x => x >= 1 && x <= 30 && !seen.has(x) && !cache.current.has(brainUrl(x, 't1')))
        if (d === undefined) return
        seen.add(d)
        Promise.all([load(brainUrl(d, 't1')), load(brainUrl(d, 'labels'))]).finally(() => setTimeout(next, 60))
      }
      setTimeout(next, 300)
    }).catch(() => onLoading?.(false))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, ready])

  // repaint the region without reloading
  useEffect(() => {
    const nv = nvRef.current
    if (!nv || !ready || nv.volumes.length < 2) return
    nv.volumes[1].setColormapLabel(labelColormap(highlight, labelNames))
    nv.updateGLVolume()
  }, [highlight, labelNames, ready])

  useEffect(() => {
    const nv = nvRef.current
    if (!nv || !ready) return
    nv.setSliceType(SLICE[view])
  }, [view, ready])

  useEffect(() => {
    const nv = nvRef.current
    if (!nv || !ready || !center || nv.volumes.length === 0) return
    nv.scene.crosshairPos = nv.mm2frac([center[0], center[1], center[2]])
    nv.drawScene()
  }, [center, ready, day])

  return <canvas ref={canvasRef} />
}
