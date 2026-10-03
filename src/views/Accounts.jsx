import { useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardTitle,
  Field,
  FieldSelect,
  LinkButton,
  NumberInput,
  PageHeader,
  Select,
  TONE,
  TextInput,
  cx,
  signTone,
} from '../components/ui'
import { accountBalances, ledger } from '../lib/calc'
import { ACC_TYPES, IN_CATS, OUT_CATS } from '../lib/constants'
import { dateLabel, inr, monthLabel, num, today, uid } from '../lib/format'
import { downloadPdf, downloadXls, ledgerReport } from '../lib/reports'
import { useApp } from '../state/AppContext'

const SMALL_SELECT = 'min-h-10 rounded-[10px] border border-field bg-card px-2.5 py-2 text-sm text-ink'

export default function Accounts() {
  const { data, setData, ui, setUi, summary, actions, updateConsignment } = useApp()
  const accounts = data.accounts || []
  const accOpts = accounts.map((a) => ({ v: a.id, l: a.name }))
  const accName = (id) => accounts.find((a) => a.id === id)?.name || '—'

  const rows = useMemo(() => ledger(data), [data])
  const balances = useMemo(() => accountBalances(data, rows), [data, rows])

  const lgMonth = ui.lgMonth || summary.month
  const lgAcc = ui.lgAcc || 'all'
  const lgType = ui.lgType || 'all'
  const filtered = rows.filter(
    (r) => (lgMonth === 'all' || (r.date || '').slice(0, 7) === lgMonth) && (lgAcc === 'all' || r.acc === lgAcc) && (lgType === 'all' || r.type === lgType),
  )
  const totalIn = filtered.filter((r) => r.type === 'in').reduce((s, r) => s + r.amount, 0)
  const totalOut = filtered.filter((r) => r.type === 'out').reduce((s, r) => s + r.amount, 0)
  const monthOpts = [{ v: 'all', l: 'All months' }].concat(
    [...new Set(rows.map((r) => (r.date || '').slice(0, 7)).filter(Boolean))]
      .sort()
      .reverse()
      .map((m) => ({ v: m, l: monthLabel(m, true) })),
  )

  /* ----- Account form ----- */
  const [af, setAf] = useState(null)
  const setAfField = (f) => (e) => {
    const v = e.target.value
    setAf((s) => ({ ...s, [f]: v }))
  }
  const saveAf = () => {
    if (!af || !String(af.name).trim()) return window.alert('Please enter an account name.')
    setData((d) => ({
      ...d,
      accounts: af.id
        ? d.accounts.map((x) => (x.id === af.id ? { ...x, name: af.name, type: af.type, opening: af.opening } : x))
        : [...d.accounts, { id: uid(), name: af.name, type: af.type, opening: af.opening }],
    }))
    setAf(null)
  }
  const deleteAf = () => {
    if (!af?.id) return
    if (accounts.length < 2) return window.alert('At least one account is required.')
    if (rows.some((r) => r.acc === af.id)) return window.alert('This account has transactions. Move them to another account first.')
    if (!window.confirm('Delete ' + af.name + '?')) return
    setData((x) => ({ ...x, accounts: x.accounts.filter((y) => y.id !== af.id) }))
    setAf(null)
    setUi({ lgAcc: 'all' })
  }

  /* ----- Manual income / expense form ----- */
  const mfRef = useRef(null)
  const blank = { type: 'out', date: today(), cat: OUT_CATS[0], desc: '', amount: '', acc: accounts[0]?.id || '' }
  const [mfState, setMfState] = useState(null)
  const [mfEdit, setMfEdit] = useState(null)
  const mf = mfState || blank
  const setMf = (patch) => setMfState((s) => ({ ...(s || blank), ...patch }))
  const setMfField = (f) => (e) => setMf({ [f]: e.target.value })
  const resetMf = () => {
    setMfState(null)
    setMfEdit(null)
  }
  const saveMf = () => {
    if (!(num(mf.amount) > 0)) return window.alert('Please enter an amount.')
    setData((d) => ({
      ...d,
      manual: mfEdit ? d.manual.map((x) => (x.id === mfEdit ? { ...mf, id: mfEdit } : x)) : [...(d.manual || []), { ...mf, id: uid() }],
    }))
    resetMf()
  }

  /* ----- Ledger row actions ----- */
  const setRowAcc = (r, v) => {
    if (r.mid) setData((d) => ({ ...d, manual: d.manual.map((x) => (x.id === r.mid ? { ...x, acc: v } : x)) }))
    else if (r.auto === 'pur')
      updateConsignment(r.cid, (c) => {
        c.purAcc = v
        return c
      })
    else if (r.auto === 'exp')
      updateConsignment(r.cid, (c) => {
        c.expenses = c.expenses.map((e) => (e.id === r.eid ? { ...e, acc: v } : e))
        return c
      })
    else if (r.auto === 'sale')
      updateConsignment(r.cid, (c) => {
        c.sales = c.sales.map((s) => (s.id === r.sid ? { ...s, acc: v } : s))
        return c
      })
    else if (r.auto === 'fix')
      setData((d) => {
        const f = { ...((d.fixed || {})[r.m] || {}) }
        f.accs = { ...(f.accs || {}), [r.fk]: v }
        return { ...d, fixed: { ...d.fixed, [r.m]: f } }
      })
  }
  const editRow = (r) => {
    if (r.mid) {
      const x = data.manual.find((y) => y.id === r.mid)
      setMfState({ ...x })
      setMfEdit(x.id)
      const el = mfRef.current
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' })
    } else if (r.auto === 'fix') {
      actions.go('fixed', { fixedMonth: r.m })
      window.scrollTo(0, 0)
    } else actions.edit(r.cid, r.auto === 'pur' ? 'purchase' : r.auto === 'exp' ? 'expenses' : 'sales', r.si || 0)
  }
  const deleteManual = (id) => {
    if (window.confirm('Delete this entry?')) setData((d) => ({ ...d, manual: d.manual.filter((x) => x.id !== id) }))
  }

  const exportLedger = (kind) => {
    const label =
      (lgMonth === 'all' ? 'All months' : monthLabel(lgMonth, true)) +
      ' · ' +
      (lgAcc === 'all' ? 'All accounts' : accName(lgAcc)) +
      ' · ' +
      (lgType === 'all' ? 'Income & expense' : lgType === 'in' ? 'Income only' : 'Expense only')
    const body = ledgerReport({
      label,
      inc: totalIn,
      out: totalOut,
      cards: balances.map((a) => [a.name, inr(a.opening), inr(a.inc), inr(a.out), inr(a.balance)]),
      rows: filtered.map((r) => [dateLabel(r.date), r.cat + (r.desc ? ' — ' + r.desc : ''), r.ref, accName(r.acc), r.type === 'in' ? inr(r.amount) : '', r.type === 'out' ? inr(r.amount) : '']),
    })
    const name = 'ASA-Traders-Income-Expense'
    kind === 'pdf' ? downloadPdf(name, body) : downloadXls(name, body)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Bank, cash & cash book" title="Accounts">
        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold text-muted">Total balance, all accounts</span>
          <span className="font-heading text-[26px] leading-[1.1] font-bold">{inr(balances.reduce((s, a) => s + a.balance, 0))}</span>
        </div>
      </PageHeader>

      {/* Account cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
        {balances.map((a) => (
          <Card key={a.id} className={cx('p-4', lgAcc === a.id && 'border-forest')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-2xs font-bold tracking-[.06em] text-muted uppercase">{a.type || 'Bank'}</div>
                <div className="text-base font-bold">{a.name}</div>
              </div>
              <Button size="xs" className="min-h-9 px-3 text-caption" onClick={() => setAf({ id: a.id, name: a.name, type: a.type || 'Bank', opening: a.opening || '' })}>
                Edit
              </Button>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted">Current balance</div>
              <div className={cx('font-heading text-[26px] leading-[1.1] font-bold', a.balance < 0 ? 'text-loss' : 'text-ink')}>{inr(a.balance)}</div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <div>
                <div className="text-muted">Opening</div>
                <div className="font-bold">{inr(a.opening)}</div>
              </div>
              <div>
                <div className="text-muted">Income</div>
                <div className="font-bold text-profit">{inr(a.inc)}</div>
              </div>
              <div>
                <div className="text-muted">Expense</div>
                <div className="font-bold text-loss">{inr(a.out)}</div>
              </div>
            </div>
            <LinkButton onClick={() => setUi({ lgAcc: a.id, lgMonth: 'all' })}>View transactions →</LinkButton>
          </Card>
        ))}
        <button
          type="button"
          onClick={() => setAf({ name: '', type: 'Bank', opening: '' })}
          className="min-h-30 rounded-2xl border-[1.5px] border-dashed border-sage bg-transparent text-body font-bold text-forest hover:bg-forest/5"
        >
          + New account
        </button>
      </div>

      {af && (
        <Card className="border-[1.5px] border-forest">
          <CardTitle title={af.id ? 'Edit account' : 'New account'} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-2.5">
            <Field label="Account name">
              <TextInput value={af.name} onChange={setAfField('name')} placeholder="e.g. Canara Bank A/c" />
            </Field>
            <Field label="Type">
              <FieldSelect value={af.type} onChange={setAfField('type')} options={ACC_TYPES.map((t) => ({ v: t, l: t }))} />
            </Field>
            <Field label="Opening balance (₹)">
              <TextInput type="number" step="any" className="text-right" value={af.opening} onChange={setAfField('opening')} placeholder="0" />
            </Field>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="danger" className={cx(!af.id && 'invisible')} onClick={deleteAf}>
              Delete account
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => setAf(null)}>Cancel</Button>
              <Button variant="primary" onClick={saveAf}>
                Save account
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-start gap-4">
        {/* Manual entry form */}
        <Card ref={mfRef} className="max-w-full flex-[1_1_320px]">
          <CardTitle
            title={mfEdit ? 'Edit entry' : 'Add other income / expense'}
            subtitle="Consignment purchases, expenses, sales and fixed costs are added to the cash book automatically."
          />
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-sand p-1">
            <button
              type="button"
              onClick={() => setMf({ type: 'in', cat: IN_CATS[0] })}
              className={cx('min-h-10 rounded-[9px] p-2.25 text-sm font-bold', mf.type === 'in' ? 'bg-profit text-white' : 'bg-card text-ink')}
            >
              + Income
            </button>
            <button
              type="button"
              onClick={() => setMf({ type: 'out', cat: OUT_CATS[0] })}
              className={cx('min-h-10 rounded-[9px] p-2.25 text-sm font-bold', mf.type === 'out' ? 'bg-loss text-white' : 'bg-card text-ink')}
            >
              − Expense
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Date">
              <TextInput type="date" className="px-2 text-body" value={mf.date} onChange={setMfField('date')} />
            </Field>
            <Field label="Amount (₹)">
              <NumberInput className="font-bold" value={mf.amount} onChange={setMfField('amount')} placeholder="0" />
            </Field>
            <Field label="Category">
              <FieldSelect value={mf.cat} onChange={setMfField('cat')} options={(mf.type === 'in' ? IN_CATS : OUT_CATS).map((c) => ({ v: c, l: c }))} />
            </Field>
            <Field label="Account">
              <FieldSelect value={mf.acc} onChange={setMfField('acc')} options={accOpts} />
            </Field>
          </div>
          <Field label="Description">
            <TextInput value={mf.desc} onChange={setMfField('desc')} placeholder="Optional note" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button className={cx(!mfEdit && 'invisible')} onClick={resetMf}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveMf}>
              {mfEdit ? 'Save changes' : 'Add entry'}
            </Button>
          </div>
        </Card>

        {/* Ledger */}
        <Card className="max-w-full min-w-0 flex-[999_1_480px]">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <CardTitle title="Income & expense" subtitle={`${filtered.length} entries · change the account on any row`} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => exportLedger('pdf')}>
                PDF
              </Button>
              <Button size="sm" onClick={() => exportLedger('xls')}>
                Excel
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select className={SMALL_SELECT} value={lgMonth} onChange={(e) => setUi({ lgMonth: e.target.value })} options={monthOpts} />
            <Select className={SMALL_SELECT} value={lgAcc} onChange={(e) => setUi({ lgAcc: e.target.value })} options={accOpts}>
              <option value="all">All accounts</option>
            </Select>
            <Select
              className={SMALL_SELECT}
              value={lgType}
              onChange={(e) => setUi({ lgType: e.target.value })}
              options={[
                { v: 'all', l: 'Income & expense' },
                { v: 'in', l: 'Income only' },
                { v: 'out', l: 'Expense only' },
              ]}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[10px] bg-profit-soft px-3 py-2.5 text-profit-deep">
              <div className="text-xs font-semibold">Income</div>
              <div className="text-base font-bold">{inr(totalIn)}</div>
            </div>
            <div className="rounded-[10px] bg-loss-soft px-3 py-2.5 text-loss-deep">
              <div className="text-xs font-semibold">Expense</div>
              <div className="text-base font-bold">{inr(totalOut)}</div>
            </div>
            <div className="rounded-[10px] bg-sand px-3 py-2.5">
              <div className="text-xs font-semibold text-muted">Net</div>
              <div className={cx('text-base font-bold', TONE[signTone(totalIn - totalOut)].text)}>{inr(totalIn - totalOut)}</div>
            </div>
          </div>

          {filtered.length === 0 && <div className="py-4 text-sm text-muted">No entries for this filter.</div>}
          <div className="flex flex-col">
            {filtered.map((r) => (
              <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t border-divider px-1 py-2.5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-sm font-bold">{r.cat}</span>
                  <span className={cx('rounded-full px-2 py-0.5 text-2xs font-bold', r.mid ? 'bg-sand-hover text-muted' : 'bg-mint text-forest')}>{r.ref}</span>
                </div>
                <div className={cx('text-right text-body font-bold whitespace-nowrap', r.type === 'in' ? 'text-profit' : 'text-loss')}>
                  {(r.type === 'in' ? '+ ' : '− ') + inr(r.amount)}
                </div>
                <div className="min-w-0 text-xs text-muted">
                  {dateLabel(r.date)} · {r.desc || '—'}
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <select
                    aria-label="Account"
                    value={r.acc}
                    onChange={(e) => setRowAcc(r, e.target.value)}
                    className="min-h-7.5 max-w-[150px] rounded-md border border-line bg-card px-1.5 py-1 text-xs text-ink"
                  >
                    {accOpts.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.l}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => editRow(r)}
                    className="min-h-7.5 rounded-md border border-field bg-card px-2.5 py-1 text-xs font-semibold text-ink hover:bg-sand-hover"
                  >
                    Edit
                  </button>
                  {r.mid && (
                    <button
                      type="button"
                      title="Delete"
                      aria-label="Delete entry"
                      onClick={() => deleteManual(r.mid)}
                      className="min-h-7.5 rounded-md bg-transparent px-2 py-1 text-base text-faint hover:bg-danger-wash hover:text-danger"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
