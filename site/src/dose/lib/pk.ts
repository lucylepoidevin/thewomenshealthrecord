/**
 * One-compartment pharmacokinetic model with first-order absorption and
 * first-order elimination, doses added by superposition.
 *
 *   C(t) = Σ_doses  F·D / V · ka / (ka − ke) · ( e^{−ke·τ} − e^{−ka·τ} ),  τ = t − t_dose − t_lag > 0
 *
 * Units: D in mg, V in L, CL in L/h, ka and ke in 1/h → C in mg/L (= µg/mL).
 * Population averages only. This is a teaching model, not a dosing tool.
 */
export type Params = { F: number; V: number; CL: number; ka: number; tlag: number }

export function ke(p: Params) { return p.CL / p.V }
export function halfLife(p: Params) { return Math.LN2 / ke(p) }

/** Concentration at clock hour `t` (hours from the start of the simulation). */
export function conc(p: Params, doses: { t: number; mg: number }[], t: number): number {
  const k = ke(p)
  let c = 0
  for (const d of doses) {
    const tau = t - d.t - p.tlag
    if (tau <= 0) continue
    if (Math.abs(p.ka - k) < 1e-6) c += (p.F * d.mg / p.V) * k * tau * Math.exp(-k * tau)
    else c += (p.F * d.mg / p.V) * (p.ka / (p.ka - k)) * (Math.exp(-k * tau) - Math.exp(-p.ka * tau))
  }
  return c
}

/** Repeat a daily schedule for `days` days; return doses with absolute hours. */
export function schedule(times: number[], mg: number, days: number) {
  const out: { t: number; mg: number }[] = []
  for (let d = 0; d < days; d++) for (const h of times) out.push({ t: d * 24 + h, mg })
  return out
}

export type Curve = { t: number[]; c: number[] }

/** Simulate `days` days and return the last 24 h on a fine grid, clock hours 0..24. */
export function simulateDay(p: Params, times: number[], mg: number, days = 5, step = 0.1): Curve {
  const doses = schedule(times, mg, days)
  const t: number[] = [], c: number[] = []
  const t0 = (days - 1) * 24
  for (let h = 0; h <= 24 + 1e-9; h += step) { t.push(h); c.push(conc(p, doses, t0 + h)) }
  return { t, c }
}

export function auc(curve: Curve) {
  let a = 0
  for (let i = 1; i < curve.t.length; i++) a += (curve.c[i] + curve.c[i - 1]) / 2 * (curve.t[i] - curve.t[i - 1])
  return a
}
export function at(curve: Curve, hour: number) {
  const i = curve.t.findIndex(x => x >= hour - 1e-9)
  return curve.c[i < 0 ? curve.c.length - 1 : i]
}
export function peak(curve: Curve) {
  let i = 0
  for (let j = 1; j < curve.c.length; j++) if (curve.c[j] > curve.c[i]) i = j
  return { c: curve.c[i], t: curve.t[i] }
}
