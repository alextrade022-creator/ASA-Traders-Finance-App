import { GRADES } from '../../lib/constants'
import { inr, kg, num, round2, today, uid } from '../../lib/format'
import { useApp } from '../../state/AppContext'
import { Button, CardTitle, Field, FieldSelect, InlineField, NumberInput, TextInput, cx } from '../ui'
import { GRADE_GRID, GradeGridHeader, GradeGridTotal } from './GradeGrid'
import { saleLine } from './saleLine'

/** One tab per buyer; each sale has its own grade lines, date and receiving account. */
export default function SalesStep({ k, update, sales, si, sale, setSale, accOpts, resolveAcc }) {
  const { setUi } = useApp()

  const setLine = (gk, fn) =>
    setSale((s) => {
      const x = { ...(s.lines[gk] || {}) }
      fn(x)
      s.lines[gk] = x
    })

  let thisKg = 0
  let thisAmt = 0
  const rows = GRADES.map((G) => {
    const info = saleLine(k, sale, G.key)
    thisKg += info.q
    thisAmt += info.q * num(info.line.rate)
    return { G, ...info }
  })

  return (
    <div className="flex flex-col gap-3">
      <CardTitle
        title="Sales details"
        subtitle="One entry per buyer. Enter kg, then either the rate or the total amount. The other one calculates automatically."
      />

      <div className="flex flex-wrap gap-1.5">
        {sales.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setUi({ saleIdx: i })}
            className={cx(
              'min-h-9.5 rounded-full border px-3.5 py-1.75 text-caption font-semibold',
              i === si ? 'border-forest bg-forest text-white' : 'border-field bg-card text-ink hover:bg-sand-hover',
            )}
          >
            {s.buyer || 'Buyer ' + (i + 1)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            update((c) => {
              c.sales.push({ id: uid(), buyer: '', date: today(), lines: {} })
              return c
            })
            setUi({ saleIdx: sales.length })
          }}
          className="min-h-9.5 rounded-full border border-dashed border-sage bg-transparent px-3.5 py-1.75 text-caption font-semibold text-forest hover:bg-forest/5"
        >
          + Add buyer
        </button>
      </div>

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] items-end gap-2">
        <Field label="Buyer">
          <TextInput
            placeholder="e.g. Kannur Spice House"
            value={sale.buyer}
            onChange={(e) => {
              const v = e.target.value
              setSale((s) => {
                s.buyer = v
              })
            }}
          />
        </Field>
        <Field label="Date">
          <TextInput
            type="date"
            className="px-2 text-body"
            value={sale.date}
            onChange={(e) => {
              const v = e.target.value
              setSale((s) => {
                s.date = v
              })
            }}
          />
        </Field>
        <Button
          variant="danger"
          size="sm"
          className={cx('min-h-10.5 rounded-lg px-2.5', sales.length < 2 && 'invisible')}
          onClick={() => {
            if (sales.length < 2) return
            update((c) => {
              c.sales.splice(si, 1)
              return c
            })
            setUi({ saleIdx: 0 })
          }}
        >
          Remove
        </Button>
      </div>

      <InlineField label="Received into">
        <FieldSelect
          className="w-auto"
          value={resolveAcc(sale.acc)}
          options={accOpts}
          onChange={(e) => {
            const v = e.target.value
            setSale((s) => {
              s.acc = v
            })
          }}
        />
      </InlineField>

      <GradeGridHeader first="Grade · stock" qty="Sold (kg)" />
      {rows.map(({ G, line: l, q, avail, after, over }) => {
        const purchased = k.g[G.key].kg
        const amtMode = l.mode === 'amt'
        const saleAmt = q * num(l.rate)
        return (
          <div key={G.key} className={cx('-mx-1.5 flex flex-col gap-1 rounded-[10px] p-1.5', over && 'bg-loss-soft', !(purchased || q) && 'opacity-50')}>
            <div className={`${GRADE_GRID} items-center`}>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{G.name}</div>
                <div className={cx('text-2xs font-semibold', over ? 'text-danger' : after > 0 ? 'text-amber-deep' : 'text-muted')}>
                  {purchased ? (over ? 'Only ' + kg(avail) + ' available' : kg(after) + ' left after this') : 'Not purchased'}
                </div>
              </div>
              <NumberInput
                placeholder="0"
                invalid={over}
                value={l.kg || ''}
                onChange={(e) => {
                  const v = e.target.value
                  setLine(G.key, (x) => {
                    x.kg = v
                    if (x.mode === 'amt') x.rate = num(v) ? round2(num(x.amt) / num(v)) : ''
                  })
                }}
              />
              <NumberInput
                placeholder="0"
                tinted={amtMode && !!num(l.amt)}
                value={amtMode ? (q ? round2(num(l.amt) / q) : '') : l.rate || ''}
                onChange={(e) => {
                  const v = e.target.value
                  setLine(G.key, (x) => {
                    x.rate = v
                    x.mode = 'rate'
                    delete x.amt
                  })
                }}
              />
              <NumberInput
                placeholder="₹ 0"
                className="font-bold"
                value={amtMode ? l.amt || '' : saleAmt ? round2(saleAmt) : ''}
                onChange={(e) => {
                  const v = e.target.value
                  setLine(G.key, (x) => {
                    x.amt = v
                    x.mode = 'amt'
                    x.rate = num(x.kg) ? round2(num(v) / num(x.kg)) : ''
                  })
                }}
              />
            </div>
            {over && <div className="text-xs font-bold text-danger">⚠ Exceeds purchased stock by {kg(q - avail)}</div>}
          </div>
        )
      })}
      <GradeGridTotal label="This buyer" kg={kg(thisKg)} amount={inr(thisAmt)} />
      <div className="flex justify-between text-sm font-semibold text-muted">
        <span>All buyers · {kg(k.sKg)}</span>
        <span>{inr(k.sAmt)}</span>
      </div>
    </div>
  )
}
