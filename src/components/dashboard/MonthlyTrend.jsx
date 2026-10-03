import { HEX } from '../../lib/constants'
import { inr, monthLabel } from '../../lib/format'
import { tipProps } from '../../lib/tooltip'
import { useApp } from '../../state/AppContext'
import { AxisLabels, Card, CardTitle, Legend, Swatch, cx } from '../ui'

export default function MonthlyTrend() {
  const { summary, setUi } = useApp()
  const { trend, month } = summary

  const sMax = Math.max(1, ...trend.map((t) => t.s))
  const values = trend.flatMap((t) => [t.p, t.n])
  const tMax = Math.max(0, ...values)
  const tMin = Math.min(0, ...values)
  const range = tMax - tMin || 1
  const n = trend.length || 1
  const y = (v) => 8 + ((tMax - v) / range) * 80
  const x = (i) => ((i + 0.5) / n) * 100
  const points = (key) => trend.map((t, i) => `${x(i)},${y(t[key])}`).join(' ')

  return (
    <Card>
      <CardTitle title="Monthly trend" subtitle="Sales (bars) with consignment & net profit (lines) · tap a month to switch" />
      <div className="relative mt-1.5 h-55">
        <div className="absolute inset-0 flex items-end gap-2">
          {trend.map((t) => (
            <div
              key={t.m}
              onClick={() => setUi({ month: t.m, cons: 'all' })}
              {...tipProps(monthLabel(t.m, true), [
                { l: 'Sales', v: inr(t.s), c: HEX.mist },
                { l: 'Consignment profit', v: inr(t.p), c: HEX.profit },
                { l: 'Fixed costs', v: inr(t.f), c: HEX.loss },
                { l: 'Net profit', v: inr(t.n), c: HEX.ink },
              ])}
              className={cx('flex h-full flex-1 cursor-pointer items-end justify-center rounded-lg hover:bg-forest/7', t.m === month && 'bg-forest/8')}
            >
              <div className="w-[min(60px,62%)] rounded-t-[5px] bg-mint" style={{ height: `${(t.s / sMax) * 100}%` }} />
            </div>
          ))}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full overflow-visible">
          <line x1={0} x2={100} y1={y(0)} y2={y(0)} stroke={HEX.ink} strokeOpacity={0.3} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          <polyline points={points('p')} fill="none" stroke={HEX.profit} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <polyline points={points('n')} fill="none" stroke={HEX.ink} strokeWidth={2.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
        {trend.flatMap((t, i) => [
          <Dot key={t.m + 'p'} x={x(i)} y={y(t.p)} className="bg-profit" />,
          <Dot key={t.m + 'n'} x={x(i)} y={y(t.n)} className={t.n >= 0 ? 'bg-ink' : 'bg-loss'} />,
        ])}
      </div>
      <AxisLabels labels={trend.map((t) => monthLabel(t.m))} gap="gap-2" />
      <Legend
        items={[
          { label: 'Sales', swatch: <Swatch className="bg-mist" /> },
          { label: 'Consignment profit', swatch: <span className="h-0.75 w-4 bg-profit" /> },
          { label: 'Net profit', swatch: <span className="w-4 border-t-3 border-dashed border-ink" /> },
        ]}
      />
    </Card>
  )
}

function Dot({ x, y, className }) {
  return (
    <div
      className={cx('pointer-events-none absolute -mt-1.25 -ml-1.25 size-2.5 rounded-full border-2 border-card', className)}
      style={{ left: `${x}%`, top: `${y}%` }}
    />
  )
}
