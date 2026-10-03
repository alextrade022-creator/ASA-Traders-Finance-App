import { GRADES } from '../../lib/constants'
import { inr, kg, num, round2 } from '../../lib/format'
import { CardTitle, FieldSelect, InlineField, NumberInput } from '../ui'
import { GRADE_GRID, GradeGridHeader, GradeGridTotal } from './GradeGrid'

/**
 * Per grade: kg + either rate or total amount. Whichever of rate/amount was typed
 * last is the source of truth (`mode`), the other is derived.
 */
export default function PurchaseStep({ consignment: ac, k, update, accOpts, resolveAcc }) {
  const setP = (gk, fn) =>
    update((c) => {
      c.purchase = c.purchase || {}
      const p = { ...(c.purchase[gk] || {}) }
      fn(p)
      c.purchase[gk] = p
      return c
    })

  return (
    <div className="flex flex-col gap-2.5">
      <CardTitle title="Purchase details" subtitle="Enter kg, then either the rate or the total amount. The other one calculates automatically." />
      <InlineField label="Paid from">
        <FieldSelect
          className="w-auto"
          value={resolveAcc(ac.purAcc)}
          options={accOpts}
          onChange={(e) => {
            const v = e.target.value
            update((c) => {
              c.purAcc = v
              return c
            })
          }}
        />
      </InlineField>
      <GradeGridHeader first="Grade" qty="Qty (kg)" />
      {GRADES.map((G) => {
        const p = (ac.purchase || {})[G.key] || {}
        const amtMode = p.mode === 'amt'
        const amount = k.g[G.key].amt
        return (
          <div key={G.key} className={`${GRADE_GRID} items-center`}>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{G.name}</div>
              <div className="text-2xs text-muted">{G.sub}</div>
            </div>
            <NumberInput
              placeholder="0"
              value={p.kg || ''}
              onChange={(e) => {
                const v = e.target.value
                setP(G.key, (x) => {
                  x.kg = v
                  if (x.mode === 'amt') x.rate = num(v) ? round2(num(x.amt) / num(v)) : ''
                })
              }}
            />
            <NumberInput
              placeholder="0"
              tinted={amtMode && !!num(p.amt)}
              value={amtMode ? (num(p.kg) ? round2(num(p.amt) / num(p.kg)) : '') : p.rate || ''}
              onChange={(e) => {
                const v = e.target.value
                setP(G.key, (x) => {
                  x.rate = v
                  x.mode = 'rate'
                  delete x.amt
                })
              }}
            />
            <NumberInput
              placeholder="₹ 0"
              className="font-bold"
              value={amtMode ? p.amt || '' : amount ? round2(amount) : ''}
              onChange={(e) => {
                const v = e.target.value
                setP(G.key, (x) => {
                  x.amt = v
                  x.mode = 'amt'
                  x.rate = num(x.kg) ? round2(num(v) / num(x.kg)) : ''
                })
              }}
            />
          </div>
        )
      })}
      <GradeGridTotal label="Total" kg={kg(k.pKg)} amount={inr(k.pAmt)} />
    </div>
  )
}
