export const num = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

export const inr = (v) => {
  v = Math.round(num(v))
  return (v < 0 ? '−' : '') + '₹' + Math.abs(v).toLocaleString('en-IN')
}

export const inrShort = (v) => {
  const a = Math.abs(v)
  const s = v < 0 ? '−' : ''
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + 'Cr'
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + 'L'
  if (a >= 1e3) return s + '₹' + (a / 1e3).toFixed(1) + 'K'
  return s + '₹' + Math.round(a)
}

export const kg = (v) => (Math.round(num(v) * 100) / 100).toLocaleString('en-IN') + ' kg'

export const round2 = (x) => String(Math.round(x * 100) / 100)

export const pct = (v) => v.toFixed(1) + '%'

export const pad = (n) => String(n).padStart(2, '0')
export const pad3 = (n) => String(n).padStart(3, '0')

export const ymd = (t) => t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate())
export const today = () => ymd(new Date())

export const addDays = (d, n) => {
  const t = new Date(d + 'T00:00:00')
  t.setDate(t.getDate() + n)
  return ymd(t)
}

export const uid = () => Math.random().toString(36).slice(2, 9)

export const monthLabel = (m, long) => {
  if (!m) return ''
  const [y, mo] = m.split('-')
  return new Date(+y, +mo - 1, 1).toLocaleString('en-IN', { month: long ? 'long' : 'short', year: 'numeric' })
}

export const dateLabel = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const nextMonth = (m) => {
  const [y, mo] = m.split('-').map(Number)
  return mo === 12 ? y + 1 + '-01' : y + '-' + pad(mo + 1)
}
