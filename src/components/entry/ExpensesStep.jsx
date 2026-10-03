import { EXPENSE_CATS } from '../../lib/constants'
import { inr, uid } from '../../lib/format'
import { CardTitle, FieldSelect, IconButton, InlineField, LinkButton, NumberInput, Swatch, TextInput, cx } from '../ui'

const ROW = 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_40px] gap-2'

export default function ExpensesStep({ consignment: ac, k, update, accOpts, resolveAcc }) {
  const setE = (eid, field, v) =>
    update((c) => {
      c.expenses = c.expenses.map((x) => (x.id === eid ? { ...x, [field]: v } : x))
      return c
    })
  const addE = (cat, init) =>
    update((c) => {
      c.expenses.push({ id: uid(), cat, amount: '', note: '', ...init })
      return c
    })
  const delE = (eid) =>
    update((c) => {
      c.expenses = c.expenses.filter((y) => y.id !== eid)
      return c
    })

  return (
    <div className="flex flex-col">
      <CardTitle className="pb-2.5" title="Consignment expenses" subtitle="Add as many entries per category as you need." />
      <InlineField label="Expenses paid from" className="pb-3">
        <FieldSelect
          className="w-auto"
          value={resolveAcc(ac.expAcc)}
          options={accOpts}
          onChange={(e) => {
            const v = e.target.value
            // Changing the default account moves every entry back onto it.
            update((c) => {
              c.expAcc = v
              c.expenses = c.expenses.map(({ acc, ...rest }) => rest)
              return c
            })
          }}
        />
      </InlineField>

      {EXPENSE_CATS.map((E) => {
        const entries = ac.expenses.filter((x) => x.cat === E.key)
        const placeholder = E.key === 'other' ? 'Description (required)' : 'Note (optional)'
        return (
          <div key={E.key} className="flex flex-col gap-2 border-t border-divider py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Swatch color={E.color} />
                {E.name}
              </div>
              <div className="text-sm font-bold">{inr(k.expByCat[E.key] || 0)}</div>
            </div>

            {/* With no entries a blank row is shown; typing into it creates the first entry.
                Index keys keep that same input mounted (and focused) as it becomes real. */}
            {(entries.length ? entries : [null]).map((x, i) => (
              <div key={i} className={ROW}>
                <NumberInput
                  placeholder="₹ Amount"
                  value={x ? x.amount : ''}
                  onChange={(e) => (x ? setE(x.id, 'amount', e.target.value) : addE(E.key, { amount: e.target.value }))}
                />
                <TextInput
                  placeholder={placeholder}
                  value={x ? x.note : ''}
                  onChange={(e) => (x ? setE(x.id, 'note', e.target.value) : addE(E.key, { note: e.target.value }))}
                />
                <IconButton title="Remove" aria-label="Remove entry" className={cx(!x && 'invisible')} onClick={() => x && delE(x.id)}>
                  ×
                </IconButton>
              </div>
            ))}

            {entries.length > 0 && (
              <LinkButton onClick={() => addE(E.key, {})} className="py-1">
                + Add another entry
              </LinkButton>
            )}
          </div>
        )
      })}

      <div className="flex justify-between border-t-2 border-ink pt-3 text-body font-bold">
        <span>Total consignment expense</span>
        <span>{inr(k.exp)}</span>
      </div>
    </div>
  )
}
