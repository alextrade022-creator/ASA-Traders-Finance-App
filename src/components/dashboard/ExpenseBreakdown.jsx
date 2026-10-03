import { EXPENSE_CATS } from '../../lib/constants'
import { inr, inrShort, monthLabel, num } from '../../lib/format'
import { hideTip, showTip } from '../../lib/tooltip'
import { useApp } from '../../state/AppContext'
import { Card, CardTitle, Swatch } from '../ui'

const HOLE = 36 // px — inner radius cut-out of the donut

export default function ExpenseBreakdown() {
  const { summary, actions } = useApp()
  const { set, consSel, month } = summary

  const cats = EXPENSE_CATS.map((E) => ({ E, v: set.reduce((a, x) => a + (x.k.expByCat[E.key] || 0), 0) })).filter((x) => x.v > 0)
  const total = cats.reduce((a, x) => a + x.v, 0) || 1
  let acc = 0
  const segs = cats.map((x) => {
    const from = acc
    acc += (x.v / total) * 100
    return { ...x, from, to: acc }
  })
  // Segment colours are data, so the gradient is built inline.
  const donutBg = segs.length ? 'conic-gradient(' + segs.map((s) => `${s.E.color} ${s.from}% ${s.to}%`).join(',') + ')' : 'var(--color-divider)'

  const drill = (E) =>
    actions.openDrill({
      title: E.name,
      sub: 'Entries in ' + (consSel === 'all' ? monthLabel(month, true) : consSel),
      headers: ['Consignment', 'Note', 'Amount'],
      rows: set.flatMap(({ c }) =>
        (c.expenses || []).filter((e) => e.cat === E.key && num(e.amount)).map((e) => ({ cid: c.id, a: c.id, b: e.note || '—', c: inr(e.amount) })),
      ),
    })

  const segAt = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - r.left - r.width / 2
    const dy = e.clientY - r.top - r.height / 2
    if (Math.hypot(dx, dy) < r.width / 2 - HOLE) return null
    let a = (Math.atan2(dx, -dy) * 180) / Math.PI
    if (a < 0) a += 360
    const p = a / 3.6
    return segs.find((s) => p >= s.from && p < s.to)
  }

  return (
    <Card>
      <CardTitle title="Expense breakdown" subtitle="Consignment expenses by category · tap to see entries" />
      <div className="flex flex-wrap items-center gap-5">
        <div
          onMouseMove={(e) => {
            const s = segAt(e)
            if (!s) return hideTip()
            showTip(e, s.E.name, [
              { l: 'Amount', v: inr(s.v), c: s.E.color },
              { l: 'Share', v: ((s.v / total) * 100).toFixed(1) + '%', c: 'transparent' },
            ])
          }}
          onMouseLeave={hideTip}
          onClick={(e) => {
            const s = segAt(e)
            if (s) drill(s.E)
          }}
          className="relative size-45 flex-none cursor-pointer rounded-full"
          style={{ background: donutBg }}
        >
          <div className="pointer-events-none absolute inset-9 grid place-items-center rounded-full bg-card text-center">
            <div>
              <div className="text-2xs font-semibold text-muted">Total</div>
              <div className="font-heading text-[19px] leading-[1.1] font-bold">{inrShort(cats.length ? total : 0)}</div>
            </div>
          </div>
        </div>
        <div className="flex min-w-[190px] flex-1 flex-col gap-0.5">
          {segs.map((s) => (
            <div
              key={s.E.key}
              onClick={() => drill(s.E)}
              className="grid cursor-pointer grid-cols-[12px_minmax(0,1fr)_auto_40px] items-center gap-2 rounded-[7px] px-1.5 py-1.25 text-caption hover:bg-forest/7"
            >
              <Swatch color={s.E.color} />
              <span>{s.E.name}</span>
              <span className="font-bold">{inr(s.v)}</span>
              <span className="text-right text-muted">{Math.round((s.v / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
