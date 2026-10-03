import { Card, CardTitle, Eyebrow, NumberInput, PageHeader, Select, TONE, signTone } from '../components/ui'
import { fixedTotal } from '../lib/calc'
import { FIXED_COSTS } from '../lib/constants'
import { inr, monthLabel, nextMonth, today } from '../lib/format'
import { useApp } from '../state/AppContext'

const SUMMARY_ROW = 'grid grid-cols-4 gap-2 [&>*:not(:first-child)]:text-right'

export default function FixedCosts() {
  const { data, setData, ui, setUi, summary } = useApp()
  const accounts = data.accounts || []
  const resolveAcc = (a) => (accounts.some((x) => x.id === a) ? a : accounts[0]?.id || '')

  // Every month with data, the current month, and one month ahead for planning.
  const months = [...new Set([...summary.months, today().slice(0, 7)])].sort()
  months.push(nextMonth(months[months.length - 1]))
  const fxMonth = ui.fixedMonth || summary.month
  const values = (data.fixed || {})[fxMonth] || {}

  const updateMonth = (fn) =>
    setData((d) => {
      const f = { ...((d.fixed || {})[fxMonth] || {}) }
      fn(f)
      return { ...d, fixed: { ...d.fixed, [fxMonth]: f } }
    })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Entered once per month" title="Monthly fixed costs">
        <Select
          value={fxMonth}
          onChange={(e) => setUi({ fixedMonth: e.target.value })}
          options={months
            .slice()
            .reverse()
            .map((m) => ({ v: m, l: monthLabel(m, true) }))}
        />
      </PageHeader>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] items-start gap-4">
        <Card className="gap-2.5">
          <CardTitle title={monthLabel(fxMonth, true)} />
          {FIXED_COSTS.map((F) => (
            <div key={F.key} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-2.5 py-1">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-semibold">{F.name}</span>
                <select
                  aria-label={`${F.name} paid from`}
                  value={resolveAcc((values.accs || {})[F.key])}
                  onChange={(e) => {
                    const v = e.target.value
                    updateMonth((f) => {
                      f.accs = { ...(f.accs || {}), [F.key]: v }
                    })
                  }}
                  className="max-w-[190px] rounded-md border border-line bg-card px-1.5 py-1 text-xs text-muted"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      Paid from: {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <NumberInput
                placeholder="₹ 0"
                value={values[F.key] || ''}
                onChange={(e) => {
                  const v = e.target.value
                  updateMonth((f) => {
                    f[F.key] = v
                  })
                }}
              />
            </div>
          ))}
          <div className="flex justify-between border-t-2 border-ink pt-3 text-body font-bold">
            <span>Total fixed costs</span>
            <span>{inr(fixedTotal(data, fxMonth))}</span>
          </div>
        </Card>

        <Card className="gap-1">
          <CardTitle title="Net profit by month" className="pb-2" />
          <Eyebrow className={`${SUMMARY_ROW} px-1.5 py-1`}>
            <span>Month</span>
            <span>Cons. profit</span>
            <span>Fixed</span>
            <span>Net</span>
          </Eyebrow>
          {summary.trend
            .slice()
            .reverse()
            .map((t) => (
              <div
                key={t.m}
                onClick={() => setUi({ fixedMonth: t.m })}
                className={`${SUMMARY_ROW} cursor-pointer rounded-md border-t border-divider px-1.5 py-2.5 text-sm hover:bg-forest/6`}
              >
                <span className="font-semibold">{monthLabel(t.m)}</span>
                <span>{inr(t.p)}</span>
                <span className="text-loss">{inr(t.f)}</span>
                <span className={`font-bold ${TONE[signTone(t.n)].text}`}>{inr(t.n)}</span>
              </div>
            ))}
        </Card>
      </div>
    </div>
  )
}
