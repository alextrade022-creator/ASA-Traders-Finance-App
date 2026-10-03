import { EXPENSE_CATS, FIXED_COSTS, GRADES } from './constants'
import { calc, expenseName } from './calc'
import { dateLabel, inr, monthLabel, num, today } from './format'

/*
 * Export documents (PDF / Excel / print) are standalone HTML files opened outside
 * the app, so they carry their own small stylesheet rather than Tailwind classes.
 */
const DOC_CSS =
  'body{font-family:Arial,Helvetica,sans-serif;color:#1d2b22;padding:28px;font-size:12px}h1{margin:0 0 4px;font-size:22px}h2{font-size:14px;margin:20px 0 6px}p{margin:0;color:#555}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cfc9b6;padding:6px 8px;text-align:left}th{background:#eef2ea}td.n,th.n{text-align:right}'
const PDF_CSS =
  '.rep{font-family:Arial,Helvetica,sans-serif;color:#1d2b22;font-size:10.5px;padding:4px;background:#fff}.rep h1{margin:0 0 4px;font-size:20px}.rep h2{font-size:13px;margin:16px 0 6px}.rep p{margin:0;color:#555}.rep table{border-collapse:collapse;width:100%}.rep tr{page-break-inside:avoid}.rep th,.rep td{border:1px solid #cfc9b6;padding:5px 6px;text-align:left}.rep th{background:#eef2ea}.rep td.n,.rep th.n{text-align:right}'

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch])

const table = (head, rows) =>
  '<table><tr>' +
  head.map((x, i) => '<th' + (i ? ' class="n"' : '') + '>' + esc(x) + '</th>').join('') +
  '</tr>' +
  rows.map((r) => '<tr>' + r.map((x, i) => '<td' + (i ? ' class="n"' : '') + '>' + esc(x) + '</td>').join('') + '</tr>').join('') +
  '</table>'

export function consignmentReport(c) {
  const k = calc(c)
  return (
    '<h1>ASA Traders — Consignment ' + esc(c.id) + '</h1><p>' + esc(dateLabel(c.date) + ' · ' + (c.supplier || '—') + ' · ' + k.status) + '</p>' +
    '<h2>Profit calculation</h2>' +
    table(['Item', 'Amount'], [
      ['Total sales', inr(k.sAmt)], ['Total purchase', inr(k.pAmt)], ['Consignment expenses', inr(k.exp)],
      ['Consignment profit', inr(k.profit)], ['Profit per kg', inr(k.perKg)], ['Margin', k.margin.toFixed(1) + '%'],
    ]) +
    '<h2>Purchase</h2>' +
    table(['Grade', 'Qty (kg)', 'Rate (₹/kg)', 'Amount'],
      GRADES.filter((G) => k.g[G.key].kg).map((G) => [G.name, k.g[G.key].kg, inr(k.g[G.key].rate), inr(k.g[G.key].amt)]).concat([['Total', k.pKg, '', inr(k.pAmt)]])) +
    '<h2>Expenses</h2>' +
    table(['Category', 'Note', 'Amount'],
      (c.expenses || []).filter((e) => num(e.amount)).map((e) => [expenseName(e.cat), e.note || '', inr(e.amount)]).concat([['Total', '', inr(k.exp)]])) +
    '<h2>Sales</h2>' +
    table(['Buyer / Grade', 'Date', 'Qty (kg)', 'Rate (₹/kg)', 'Amount'],
      (c.sales || [])
        .flatMap((s) =>
          GRADES.filter((G) => num((s.lines[G.key] || {}).kg)).map((G) => {
            const l = s.lines[G.key]
            return [(s.buyer || '—') + ' · ' + G.name, dateLabel(s.date), num(l.kg), inr(l.rate), inr(num(l.kg) * num(l.rate))]
          }),
        )
        .concat([['Total', '', k.sKg, '', inr(k.sAmt)]])) +
    '<h2>Stock left</h2>' +
    table(['Grade', 'Remaining (kg)'], GRADES.filter((G) => k.g[G.key].kg).map((G) => [G.name, k.g[G.key].rem]))
  )
}

export function monthReport(data, summary) {
  const x = summary
  const f = (data.fixed || {})[x.month] || {}
  return (
    '<h1>ASA Traders — Monthly report</h1><p>' + esc(monthLabel(x.month, true) + ' · generated ' + dateLabel(today())) + '</p>' +
    '<h2>Summary</h2>' +
    table(['Metric', 'Value'], [
      ['Total sales', inr(x.monthTotals.sales)], ['Total purchase', inr(x.monthTotals.pur)], ['Consignment expenses', inr(x.monthTotals.exp)],
      ['Total consignment profit', inr(x.monthProfit)], ['Fixed costs', inr(x.fx)], ['Monthly net profit', inr(x.net)],
      ['Consignments', x.monthCons.length], ['Total kg traded', x.monthTotals.kg],
      ['Avg profit / kg', inr(x.monthTotals.kg ? x.monthProfit / x.monthTotals.kg : 0)],
    ]) +
    '<h2>Consignments</h2>' +
    table(['ID', 'Date', 'Supplier', 'Kg', 'Purchase', 'Expenses', 'Sales', 'Profit', 'Status'],
      x.monthCons.map(({ c, k }) => [c.id, dateLabel(c.date), c.supplier || '—', k.pKg, inr(k.pAmt), inr(k.exp), inr(k.sAmt), inr(k.profit), k.status])) +
    (x.buyers.length
      ? '<h2>Buyer-wise report</h2>' +
        table(['Buyer', 'Kg sold', 'Amount', 'Avg sell/kg', 'Avg cost/kg', 'Profit/kg', 'Profit'],
          x.buyers.map((b) => [b.name, b.kg, inr(b.amt), inr(b.sell), inr(b.cost), inr(b.ppk), inr(b.profit)]))
      : '') +
    '<h2>Fixed costs</h2>' +
    table(['Item', 'Amount'], FIXED_COSTS.map((F) => [F.name, inr(f[F.key])]).concat([['Total', inr(x.fx)]])) +
    '<h2>Expense breakdown</h2>' +
    table(['Category', 'Amount'], EXPENSE_CATS.map((E) => [E.name, inr(x.monthCons.reduce((a, { k }) => a + (k.expByCat[E.key] || 0), 0))]))
  )
}

export function ledgerReport({ label, cards, rows, inc, out }) {
  return (
    '<h1>ASA Traders — Income &amp; expense</h1><p>' + esc(label + ' · generated ' + dateLabel(today())) + '</p>' +
    '<h2>Account balances (current)</h2>' + table(['Account', 'Opening', 'Income', 'Expense', 'Balance'], cards) +
    '<h2>Transactions</h2>' + table(['Date', 'Particulars', 'Ref', 'Account', 'Income', 'Expense'], rows) +
    '<h2>Totals</h2>' + table(['Item', 'Amount'], [['Income', inr(inc)], ['Expense', inr(out)], ['Net', inr(inc - out)]])
  )
}

export function downloadXls(name, body) {
  const html = '﻿<html><head><meta charset="utf-8"><style>' + DOC_CSS + '</style></head><body>' + body + '</body></html>'
  const url = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name + '.xls'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function printPdf(title, body) {
  const f = document.createElement('iframe')
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(f)
  const doc = f.contentWindow.document
  doc.open()
  doc.write('<html><head><title>' + esc(title) + '</title><style>' + DOC_CSS + '</style></head><body>' + body + '</body></html>')
  doc.close()
  setTimeout(() => {
    f.contentWindow.focus()
    f.contentWindow.print()
    setTimeout(() => f.remove(), 1500)
  }, 300)
}

/** html2pdf is large, so it is code-split and only fetched on the first PDF export. */
export async function downloadPdf(name, body) {
  let html2pdf
  try {
    html2pdf = (await import('html2pdf.js')).default
  } catch {
    printPdf(name, body)
    return
  }
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;left:0;top:0;width:760px;background:#fff;z-index:-1;pointer-events:none'
  el.innerHTML = '<style>' + PDF_CSS + '</style><div class="rep">' + body + '</div>'
  document.body.appendChild(el)
  try {
    await html2pdf()
      .set({
        margin: [10, 10, 12, 10],
        filename: name + '.pdf',
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(el.querySelector('.rep'))
      .save()
  } finally {
    el.remove()
  }
}
