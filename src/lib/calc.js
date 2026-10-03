import { EXPENSE_CATS, FIXED_COSTS, GRADES } from './constants'
import { kg, monthLabel, num, ymd } from './format'

/** Totals (kg, amount) for a single buyer sale across all grades. */
export function saleTotals(sale) {
  let q = 0
  let a = 0
  GRADES.forEach((G) => {
    const l = (sale.lines || {})[G.key] || {}
    q += num(l.kg)
    a += num(l.kg) * num(l.rate)
  })
  return { kg: q, amount: a }
}

/**
 * Core consignment maths. While stock is unsold, profit only counts sold kg
 * (at buy cost) plus a proportional share of expenses; once fully sold it is final.
 */
export function calc(c) {
  const g = {}
  let pKg = 0
  let pAmt = 0
  let sKg = 0
  let sAmt = 0
  GRADES.forEach((G) => {
    const p = (c.purchase || {})[G.key] || {}
    const kgv = num(p.kg)
    const rate = num(p.rate)
    let skg = 0
    let samt = 0
    ;(c.sales || []).forEach((s) => {
      const l = (s.lines || {})[G.key] || {}
      skg += num(l.kg)
      samt += num(l.kg) * num(l.rate)
    })
    g[G.key] = { kg: kgv, rate, amt: kgv * rate, skg, samt, rem: kgv - skg }
    pKg += kgv
    pAmt += kgv * rate
    sKg += skg
    sAmt += samt
  })
  const expByCat = {}
  let exp = 0
  ;(c.expenses || []).forEach((e) => {
    const a = num(e.amount)
    exp += a
    expByCat[e.cat] = (expByCat[e.cat] || 0) + a
  })
  const completed = pKg > 0 && GRADES.every((G) => g[G.key].rem <= 0.0001)
  const cogs = GRADES.reduce((a, G) => {
    const x = g[G.key]
    return a + (x.kg ? (x.skg * x.amt) / x.kg : 0)
  }, 0)
  const expShare = pKg ? exp * Math.min(1, sKg / pKg) : exp
  const profit = completed ? sAmt - pAmt - exp : sAmt - cogs - expShare
  return {
    g,
    pKg,
    pAmt,
    sKg,
    sAmt,
    exp,
    expByCat,
    profit,
    stockCost: pAmt - cogs,
    rem: Math.max(0, pKg - sKg),
    completed,
    status: completed ? 'Completed' : 'In Progress',
    perKg: pKg ? profit / pKg : 0,
    margin: sAmt ? (profit / sAmt) * 100 : 0,
    month: (c.date || '').slice(0, 7),
  }
}

export const monthsOf = (data) => {
  const s = new Set()
  data.consignments.forEach((c) => c.date && s.add(c.date.slice(0, 7)))
  Object.keys(data.fixed || {}).forEach((k) => s.add(k))
  return [...s].sort()
}

export const fixedTotal = (data, m) => {
  const f = (data.fixed || {})[m] || {}
  return FIXED_COSTS.reduce((a, F) => a + num(f[F.key]), 0)
}

export const expenseName = (key) => (EXPENSE_CATS.find((x) => x.key === key) || {}).name || 'Expense'

/** Cash book: auto-entries from consignments + fixed costs, plus manual entries. Newest first. */
export function ledger(data) {
  const A = data.accounts || []
  const res = (a) => (A.some((x) => x.id === a) ? a : (A[0] || {}).id)
  const rows = []
  data.consignments.forEach((c) => {
    const k = calc(c)
    if (k.pAmt > 0)
      rows.push({ id: 'p-' + c.id, date: c.date, type: 'out', cat: 'Cardamom purchase', desc: (c.supplier || 'Supplier') + ' · ' + kg(k.pKg), ref: c.id, amount: k.pAmt, acc: res(c.purAcc), auto: 'pur', cid: c.id })
    ;(c.expenses || []).forEach((e) => {
      if (num(e.amount) > 0)
        rows.push({ id: 'e-' + e.id, date: c.date, type: 'out', cat: expenseName(e.cat), desc: e.note || '', ref: c.id, amount: num(e.amount), acc: res(e.acc || c.expAcc), auto: 'exp', cid: c.id, eid: e.id })
    })
    ;(c.sales || []).forEach((s, si) => {
      const t = saleTotals(s)
      if (t.amount > 0)
        rows.push({ id: 's-' + s.id, date: s.date || c.date, type: 'in', cat: 'Cardamom sale', desc: (s.buyer || 'Buyer') + ' · ' + kg(t.kg), ref: c.id, amount: t.amount, acc: res(s.acc), auto: 'sale', cid: c.id, sid: s.id, si })
    })
  })
  Object.entries(data.fixed || {}).forEach(([m, f]) => {
    const [y, mo] = m.split('-').map(Number)
    const dt = ymd(new Date(y, mo, 0))
    FIXED_COSTS.forEach((F) => {
      const v = num(f[F.key])
      if (v > 0)
        rows.push({ id: 'f-' + m + F.key, date: dt, type: 'out', cat: F.name, desc: 'Fixed cost · ' + monthLabel(m, true), ref: 'Fixed', amount: v, acc: res((f.accs || {})[F.key]), auto: 'fix', m, fk: F.key })
    })
  })
  ;(data.manual || []).forEach((x) =>
    rows.push({ id: 'm-' + x.id, date: x.date, type: x.type, cat: x.cat, desc: x.desc || '', ref: 'Manual', amount: num(x.amount), acc: res(x.acc), mid: x.id }),
  )
  return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Current balance per account, derived from the ledger. */
export function accountBalances(data, rows = ledger(data)) {
  return (data.accounts || []).map((a) => {
    let inc = 0
    let out = 0
    rows.forEach((r) => {
      if (r.acc !== a.id) return
      if (r.type === 'in') inc += r.amount
      else out += r.amount
    })
    return { ...a, inc, out, balance: num(a.opening) + inc - out }
  })
}
