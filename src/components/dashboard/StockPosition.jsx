import { GRADES, HEX } from '../../lib/constants'
import { kg } from '../../lib/format'
import { tipProps } from '../../lib/tooltip'
import { useApp } from '../../state/AppContext'
import { Card, CardTitle } from '../ui'

export default function StockPosition() {
  const { summary, actions } = useApp()
  const inProgress = summary.set.filter((x) => !x.k.completed && x.k.pKg > 0)

  const stock = GRADES.map((G) => {
    const rem = inProgress.reduce((a, x) => a + Math.max(0, x.k.g[G.key].rem), 0)
    const ids = inProgress.filter((x) => x.k.g[G.key].rem > 0).map((x) => x.c.id)
    return rem > 0 ? { G, rem, ids } : null
  }).filter(Boolean)
  const max = Math.max(1, ...stock.map((s) => s.rem))

  return (
    <Card>
      <CardTitle title="Stock position" subtitle="Unsold kg by grade in in-progress consignments" />
      {stock.length ? (
        <div className="flex flex-col gap-2.5">
          {stock.map((s) => (
            <div
              key={s.G.key}
              onClick={() => actions.openDetail(s.ids[0])}
              {...tipProps(s.G.name + ' · unsold', [
                { l: 'Remaining', v: kg(s.rem), c: HEX.amber },
                { l: 'In', v: s.ids.join(', '), c: 'transparent' },
              ])}
              className="grid cursor-pointer grid-cols-[92px_minmax(0,1fr)_70px] items-center gap-2.5 rounded-lg px-1 py-0.75 hover:bg-amber/10"
            >
              <div className="text-caption font-semibold">{s.G.name}</div>
              <div className="relative h-6 rounded-[5px] bg-sand">
                <div className="absolute inset-y-1 left-0 rounded-[3px] bg-amber" style={{ width: `${(s.rem / max) * 100}%` }} />
              </div>
              <div className="text-right text-caption font-bold text-amber-deep">{kg(s.rem)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-5 text-sm text-muted">All stock sold — no consignments in progress.</div>
      )}
    </Card>
  )
}
