import { dateLabel, inr, kg } from '../../lib/format'
import { useApp } from '../../state/AppContext'
import { Card, CardTitle, TONE, cx, signTone } from '../ui'

const ROW = 'grid grid-cols-[minmax(170px,1.8fr)_repeat(6,minmax(84px,1fr))] gap-2'

export default function BuyerReport() {
  const { summary, actions } = useApp()
  const { buyers, avgCost } = summary

  const tKg = buyers.reduce((a, b) => a + b.kg, 0)
  const tAmt = buyers.reduce((a, b) => a + b.amt, 0)
  const tProfit = buyers.reduce((a, b) => a + b.profit, 0)
  const totTone = TONE[signTone(tProfit)].text

  const open = (b) =>
    actions.openDrill({
      title: b.name,
      sub: 'Avg sell ' + inr(b.sell) + '/kg − avg cost ' + inr(avgCost) + '/kg = ' + inr(b.ppk) + '/kg',
      headers: ['Consignment', 'Date · qty @ rate', 'Amount'],
      rows: b.sales.map((s) => ({ cid: s.cid, a: s.cid, b: dateLabel(s.date) + ' · ' + kg(s.kg) + ' @ ' + inr(s.amount / s.kg), c: inr(s.amount) })),
    })

  return (
    <Card className="col-span-full">
      <div className="flex flex-wrap items-end justify-between gap-2.5">
        <CardTitle title="Buyer-wise report" subtitle="Profit/kg = buyer’s avg selling price − avg cost per kg · tap a buyer to see their sales" />
        <div className="rounded-[10px] bg-sand px-3 py-2">
          <div className="text-2xs font-semibold text-muted">Avg cost per kg (purchase + expenses ÷ kg)</div>
          <div className="text-[17px] font-bold">{inr(avgCost)}</div>
        </div>
      </div>
      {buyers.length ? (
        <div className="overflow-x-auto">
          <div className="flex min-w-[720px] flex-col">
            <div className={`${ROW} px-2 py-1 text-2xs font-bold tracking-[.05em] text-muted uppercase [&>*:not(:first-child)]:text-right`}>
              <span>Buyer</span>
              <span>Kg sold</span>
              <span>Amount</span>
              <span>Avg sell/kg</span>
              <span>Avg cost/kg</span>
              <span>Profit/kg</span>
              <span>Profit</span>
            </div>
            {buyers.map((b) => {
              const tone = TONE[signTone(b.ppk)].text
              return (
                <div
                  key={b.name}
                  onClick={() => open(b)}
                  className={`${ROW} cursor-pointer items-center rounded-md border-t border-divider px-2 py-2.75 text-sm hover:bg-forest/6 [&>span]:text-right`}
                >
                  <div>
                    <div className="font-bold">{b.name}</div>
                    <div className="text-xs text-muted">
                      {b.sales.length} sale{b.sales.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  <span>{kg(b.kg)}</span>
                  <span>{inr(b.amt)}</span>
                  <span>{inr(b.sell)}</span>
                  <span className="text-muted">{inr(b.cost)}</span>
                  <span className={cx('font-bold', tone)}>{inr(b.ppk)}</span>
                  <span className={cx('font-bold', tone)}>{inr(b.profit)}</span>
                </div>
              )
            })}
            <div className={`${ROW} border-t-2 border-ink px-2 pt-2.75 text-sm font-bold [&>*:not(:first-child)]:text-right`}>
              <span>Total</span>
              <span>{kg(tKg)}</span>
              <span>{inr(tAmt)}</span>
              <span>{inr(tKg ? tAmt / tKg : 0)}</span>
              <span>{inr(avgCost)}</span>
              <span className={totTone}>{inr(tKg ? tProfit / tKg : 0)}</span>
              <span className={totTone}>{inr(tProfit)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-3 text-sm text-muted">No sales recorded yet.</div>
      )}
    </Card>
  )
}
