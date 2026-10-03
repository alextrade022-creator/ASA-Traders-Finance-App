import { num } from '../../lib/format'

/** Stock check for one grade line of a sale: what's available excluding this sale's own qty. */
export function saleLine(k, sale, gradeKey) {
  const l = (sale.lines || {})[gradeKey] || {}
  const q = num(l.kg)
  const g = k.g[gradeKey]
  const avail = g.kg - (g.skg - q)
  return { line: l, q, avail, after: avail - q, over: q > avail + 1e-9 }
}
