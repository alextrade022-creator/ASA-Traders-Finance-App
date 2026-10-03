import { calc, fixedTotal, monthsOf, saleTotals } from './calc'
import { today } from './format'

const sumK = (arr, f) => arr.reduce((a, x) => a + f(x.k), 0)

/**
 * Everything the dashboard (and reports) derive from the data for the selected
 * month / consignment filter.
 */
export function getMonthSummary(data, monthPref, consPref) {
  const all = data.consignments.map((c) => ({ c, k: calc(c) })).sort((a, b) => ((a.c.date || '') < (b.c.date || '') ? -1 : 1))
  const months = monthsOf(data)
  const consMonths = [...new Set(all.map((x) => x.k.month))].filter(Boolean).sort()
  const month =
    monthPref && months.includes(monthPref) ? monthPref : consMonths[consMonths.length - 1] || months[months.length - 1] || today().slice(0, 7)

  const monthCons = all.filter((x) => x.k.month === month)
  const consSel = monthCons.some((x) => x.c.id === consPref) ? consPref : 'all'
  const set = consSel === 'all' ? monthCons : monthCons.filter((x) => x.c.id === consSel)

  const totals = {
    sales: sumK(set, (k) => k.sAmt),
    pur: sumK(set, (k) => k.pAmt),
    exp: sumK(set, (k) => k.exp),
    profit: sumK(set, (k) => k.profit),
    kg: sumK(set, (k) => k.pKg),
  }
  const monthTotals = {
    sales: sumK(monthCons, (k) => k.sAmt),
    pur: sumK(monthCons, (k) => k.pAmt),
    exp: sumK(monthCons, (k) => k.exp),
    kg: sumK(monthCons, (k) => k.pKg),
  }
  const monthProfit = sumK(monthCons, (k) => k.profit)
  const fx = fixedTotal(data, month)

  const trend = months.map((m) => {
    const cs = all.filter((x) => x.k.month === m)
    const p = sumK(cs, (k) => k.profit)
    const f = fixedTotal(data, m)
    return { m, s: sumK(cs, (k) => k.sAmt), p, f, n: p - f }
  })

  // Buyer-wise: each buyer's avg selling price vs the selection's avg cost/kg.
  const avgCost = totals.kg ? (totals.pur + totals.exp) / totals.kg : 0
  const bmap = {}
  set.forEach(({ c }) =>
    (c.sales || []).forEach((s) => {
      const t = saleTotals(s)
      if (t.kg <= 0) return
      const name = (s.buyer || '').trim() || 'Unnamed buyer'
      const b = bmap[name] || (bmap[name] = { name, kg: 0, amt: 0, sales: [] })
      b.kg += t.kg
      b.amt += t.amount
      b.sales.push({ cid: c.id, date: s.date, kg: t.kg, amount: t.amount })
    }),
  )
  const buyers = Object.values(bmap)
    .map((b) => {
      const sell = b.amt / b.kg
      const ppk = sell - avgCost
      return { ...b, sell, cost: avgCost, ppk, profit: ppk * b.kg }
    })
    .sort((x, y) => y.amt - x.amt)

  return {
    all,
    months,
    month,
    monthCons,
    consSel,
    set,
    totals,
    monthTotals,
    monthProfit,
    fx,
    net: monthProfit - fx,
    trend,
    avgCost,
    buyers,
  }
}
