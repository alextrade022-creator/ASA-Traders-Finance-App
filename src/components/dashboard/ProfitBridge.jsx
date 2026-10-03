import { FIXED_COSTS, HEX } from '../../lib/constants'
import { inr, inrShort, num } from '../../lib/format'
import { tipProps } from '../../lib/tooltip'
import { useApp } from '../../state/AppContext'
import { AxisLabels, Card, CardTitle, TONE, cx } from '../ui'

/** Waterfall: consignment profit → minus each fixed cost → net profit. */
export default function ProfitBridge() {
  const { data, summary, actions } = useApp()
  const { month, monthProfit } = summary

  const fixed = (data.fixed || {})[month] || {}
  const steps = [{ label: 'Cons. profit', from: 0, to: monthProfit, total: true }]
  let run = monthProfit
  FIXED_COSTS.forEach((F) => {
    const v = num(fixed[F.key])
    if (!v) return
    steps.push({ label: F.short, full: F.name, from: run, to: run - v, v })
    run -= v
  })
  steps.push({ label: 'Net profit', from: 0, to: run, total: true })

  const levels = steps.flatMap((s) => [s.from, s.to])
  const max = Math.max(0, ...levels)
  const min = Math.min(0, ...levels)
  const range = max - min || 1

  const goFixed = () => actions.go('fixed', { fixedMonth: month })

  return (
    <Card>
      <CardTitle title="Monthly profit bridge" subtitle="Consignment profit, less each fixed cost, to net · tap to edit fixed costs" />
      <div className="relative mt-4.5 mb-1.5 h-55">
        <div className="absolute inset-x-0 border-t border-ink/35" style={{ top: `${(max / range) * 100}%` }} />
        <div className="absolute inset-0 flex gap-1.5">
          {steps.map((s) => {
            const tone = s.total ? (s.to >= 0 ? (s.label === 'Net profit' ? 'forest' : 'profit') : 'loss') : 'coral'
            const top = ((max - Math.max(s.from, s.to)) / range) * 100
            const h = Math.max((Math.abs(s.from - s.to) / range) * 100, 0.8)
            return (
              <div
                key={s.label}
                onClick={goFixed}
                {...tipProps(s.full || s.label, [
                  { l: s.total ? 'Amount' : 'Deducted', v: s.total ? inr(s.to) : inr(-s.v), c: HEX[tone] },
                  ...(s.total ? [] : [{ l: 'Running total', v: inr(s.to), c: 'transparent' }]),
                ])}
                className="relative flex-1 cursor-pointer rounded-lg hover:bg-forest/6"
              >
                <div className={cx('absolute inset-x-[12%] rounded', TONE[tone].bg)} style={{ top: `${top}%`, height: `${h}%` }} />
                <div
                  className={cx('absolute left-1/2 -translate-x-1/2 -translate-y-[115%] text-2xs font-bold whitespace-nowrap', TONE[tone].text)}
                  style={{ top: `${top}%` }}
                >
                  {s.total ? inrShort(s.to) : '−' + inrShort(s.v).slice(1)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <AxisLabels labels={steps.map((s) => s.label)} />
    </Card>
  )
}
