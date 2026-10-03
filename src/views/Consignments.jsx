import ExpensesStep from '../components/entry/ExpensesStep'
import PriceSimulator from '../components/entry/PriceSimulator'
import ProfitSummary from '../components/entry/ProfitSummary'
import PurchaseStep from '../components/entry/PurchaseStep'
import SalesStep from '../components/entry/SalesStep'
import { saleLine } from '../components/entry/saleLine'
import { Button, Card, EmptyState, Field, PageHeader, Select, StatusPill, TextInput, cx } from '../components/ui'
import { calc } from '../lib/calc'
import { GRADES } from '../lib/constants'
import { dateLabel, inr, today, uid } from '../lib/format'
import { useApp } from '../state/AppContext'

const STEPS = [
  { key: 'purchase', label: 'Purchase', next: 'Next: Expenses →' },
  { key: 'expenses', label: 'Expenses', next: 'Next: Sales →' },
  { key: 'sales', label: 'Sales', next: 'View full summary' },
]

export default function Consignments() {
  const { data, ui, setUi, summary, actions, updateConsignment } = useApp()
  const ac = data.consignments.find((c) => c.id === ui.activeId) || data.consignments.at(-1)

  const header = (
    <PageHeader eyebrow="Record a consignment" title="Purchase → Expenses → Sales">
      <div className="flex flex-wrap gap-2">
        {ac && (
          <Select
            value={ac.id}
            onChange={(e) => setUi({ activeId: e.target.value, step: 'purchase', saleIdx: 0 })}
            options={summary.all
              .slice()
              .reverse()
              .map(({ c, k }) => ({ v: c.id, l: c.id + ' · ' + dateLabel(c.date) + ' · ' + k.status }))}
          />
        )}
        <Button variant="primary" onClick={actions.newConsignment}>
          + New Consignment
        </Button>
      </div>
    </PageHeader>
  )

  if (!ac)
    return (
      <div className="flex flex-col gap-4">
        {header}
        <EmptyState>No consignments yet. Tap “+ New Consignment” to start.</EmptyState>
      </div>
    )

  const id = ac.id
  const k = calc(ac)
  const update = (fn) => updateConsignment(id, fn)

  const accounts = data.accounts || []
  const accOpts = accounts.map((a) => ({ v: a.id, l: a.name }))
  const resolveAcc = (a) => (accounts.some((x) => x.id === a) ? a : accounts[0]?.id || '')

  // Active buyer tab. If a consignment has no sales yet, show an empty one that's created on first edit.
  const sales = ac.sales.length ? ac.sales : [{ id: 'tmp', buyer: '', date: today(), lines: {} }]
  const si = Math.min(ui.saleIdx, sales.length - 1)
  const sale = sales[si]
  const setSale = (fn) =>
    update((c) => {
      if (!c.sales.length) c.sales.push({ id: uid(), buyer: '', date: today(), lines: {} })
      c.sales[si].lines = c.sales[si].lines || {}
      fn(c.sales[si])
      return c
    })
  const anyOver = GRADES.some((G) => saleLine(k, sale, G.key).over)

  const step = ui.step
  const stepIdx = STEPS.findIndex((s) => s.key === step)
  const stepTotals = { purchase: k.pAmt, expenses: k.exp, sales: k.sAmt }
  const shared = { consignment: ac, k, update, accOpts, resolveAcc }

  const setField = (field) => (e) => {
    const v = e.target.value
    update((c) => {
      c[field] = v
      return c
    })
  }

  const nextStep = () => {
    if (step === 'sales') actions.openDetail(id)
    else setUi({ step: STEPS[stepIdx + 1].key })
    window.scrollTo(0, 0)
  }

  const deleteConsignment = () => {
    if (window.confirm('Delete ' + id + '? This cannot be undone.')) actions.removeConsignment(id)
  }

  return (
    <div className="flex flex-col gap-4">
      {header}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-4">
        <div className="col-span-full flex min-w-0 flex-col gap-4">
          <Card className="gap-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="font-heading text-2xl leading-none font-bold">{id}</span>
                <StatusPill completed={k.completed} large />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => actions.openDetail(id)}>
                  Full summary
                </Button>
                <Button size="sm" variant="danger" onClick={deleteConsignment}>
                  Delete
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-2.5">
              <Field label="Date">
                <TextInput type="date" value={ac.date} onChange={setField('date')} />
              </Field>
              <Field label="Supplier (Kumily)">
                <TextInput value={ac.supplier} onChange={setField('supplier')} placeholder="Supplier name" />
              </Field>
              <Field label="Notes">
                <TextInput value={ac.notes} onChange={setField('notes')} placeholder="Optional" />
              </Field>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setUi({ step: s.key })}
                className={cx(
                  'flex min-h-14 flex-col gap-0.75 rounded-xl border px-3 py-2.5 text-left',
                  step === s.key ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink hover:bg-sand-hover',
                )}
              >
                <span className="text-xs font-bold opacity-85">
                  Step {i + 1} · {s.label}
                </span>
                <span className="text-body font-bold">{inr(stepTotals[s.key])}</span>
              </button>
            ))}
          </div>
        </div>

        <Card>
          {step === 'purchase' && <PurchaseStep {...shared} />}
          {step === 'expenses' && <ExpensesStep {...shared} />}
          {step === 'sales' && <SalesStep {...shared} sales={sales} si={si} sale={sale} setSale={setSale} />}
          <div className="flex justify-end pt-1.5">
            <Button variant="primary" onClick={nextStep}>
              {STEPS[stepIdx]?.next}
            </Button>
          </div>
        </Card>

        <ProfitSummary k={k} anyOver={anyOver} />

        {step === 'sales' && <PriceSimulator id={id} k={k} sale={sale} setSale={setSale} />}
      </div>
    </div>
  )
}
