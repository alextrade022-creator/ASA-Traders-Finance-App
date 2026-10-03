import { HEX } from '../../lib/constants'
import { inr, inrShort, pct } from '../../lib/format'
import { tipProps } from '../../lib/tooltip'
import { useApp } from '../../state/AppContext'
import { AxisLabels, Card, CardTitle, Legend, Swatch, TONE, consTone, cx } from '../ui'

export default function ProfitByConsignment() {
  const { summary, actions } = useApp()
  const { set } = summary

  const profits = set.map((x) => x.k.profit)
  const max = Math.max(0, ...profits)
  const min = Math.min(0, ...profits)
  const range = max - min || 1
  const zero = (max / range) * 100

  const bars = set.map(({ c, k }) => {
    const h = Math.max((Math.abs(k.profit) / range) * 100, 0.8)
    const up = k.profit >= 0
    const top = up ? zero - h : zero
    return { c, k, h, top, up, tone: consTone(k), labelTop: up ? top : top + h }
  })

  return (
    <Card>
      <CardTitle title="Profit by consignment" subtitle="Tap a bar to open the full consignment summary" />
      <div className="relative mt-4.5 mb-1.5 h-55">
        <div className="absolute inset-x-0 border-t border-ink/35" style={{ top: `${zero}%` }} />
        <div className="absolute inset-0 flex gap-1.5">
          {bars.map(({ c, k, h, top, up, tone, labelTop }) => (
            <div
              key={c.id}
              onClick={() => actions.openDetail(c.id)}
              {...tipProps(c.id + ' · ' + k.status, [
                { l: 'Profit', v: inr(k.profit), c: HEX[tone] },
                { l: 'Per kg', v: inr(k.perKg), c: 'transparent' },
                { l: 'Margin', v: pct(k.margin), c: 'transparent' },
              ])}
              className="relative flex-1 cursor-pointer rounded-lg hover:bg-forest/6"
            >
              <div className={cx('absolute left-1/2 w-[min(52px,66%)] -translate-x-1/2 rounded-[5px]', TONE[tone].bg)} style={{ top: `${top}%`, height: `${h}%` }} />
              <div
                className={cx('absolute left-1/2 -translate-x-1/2 text-2xs font-bold whitespace-nowrap', TONE[tone].text, up ? '-translate-y-[125%]' : 'translate-y-1/4')}
                style={{ top: `${labelTop}%` }}
              >
                {inrShort(k.profit)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <AxisLabels labels={set.map((x) => x.c.id)} />
      <Legend
        items={[
          { label: 'Profit', swatch: <Swatch className="bg-profit" /> },
          { label: 'Loss', swatch: <Swatch className="bg-loss" /> },
          { label: 'In progress (profit on sold stock)', swatch: <Swatch className="bg-amber" /> },
        ]}
      />
    </Card>
  )
}
