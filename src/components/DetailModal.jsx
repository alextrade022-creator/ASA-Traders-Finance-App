import { calc, expenseName, saleTotals } from '../lib/calc'
import { GRADES } from '../lib/constants'
import { dateLabel, inr, kg, num, pct } from '../lib/format'
import { consignmentReport, downloadPdf, downloadXls } from '../lib/reports'
import { useApp } from '../state/AppContext'
import { CloseButton, Modal, StatusPill, TONE, consTone } from './ui'

const GRADE_ROW = 'grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] gap-2 border-t border-divider py-1.75 text-sm'

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-card p-4">
      <div className="pb-1.5 font-heading text-base font-semibold">{title}</div>
      {children}
    </div>
  )
}

function TotalRow({ left, right }) {
  return (
    <div className="flex justify-between border-t-2 border-ink pt-2 text-sm font-bold">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  )
}

function Stat({ label, value, className = 'text-[17px]' }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className={`font-bold ${className}`}>{value}</div>
    </div>
  )
}

/** Full consignment summary overlay. */
export default function DetailModal() {
  const { data, ui, actions } = useApp()
  const dc = ui.detailId && data.consignments.find((c) => c.id === ui.detailId)
  if (!dc) return null

  const k = calc(dc)
  const name = 'ASA-Traders-' + dc.id
  const purRows = GRADES.filter((G) => k.g[G.key].kg)
  const salRows = GRADES.filter((G) => k.g[G.key].skg)
  const stockRows = GRADES.filter((G) => k.g[G.key].rem > 0)

  return (
    <Modal onClose={actions.closeDetail} className="flex max-w-[820px] flex-col overflow-hidden rounded-[18px] bg-paper">
      <div className="flex flex-col gap-3 bg-ink px-5 py-4.5 text-paper">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-heading text-[26px] leading-none font-bold">{dc.id}</span>
              <StatusPill completed={k.completed} large />
            </div>
            <div className="mt-1.5 text-caption text-fog">
              {dateLabel(dc.date)} · {dc.supplier || 'No supplier'}
            </div>
          </div>
          <CloseButton onClick={actions.closeDetail} className="bg-white/10 text-white" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => actions.edit(dc.id)} className="min-h-10 rounded-[10px] bg-sage px-3.5 py-2 text-caption font-bold text-ink">
            Edit entries
          </button>
          {[
            ['PDF', () => downloadPdf(name, consignmentReport(dc))],
            ['Excel', () => downloadXls(name, consignmentReport(dc))],
          ].map(([label, fn]) => (
            <button key={label} type="button" onClick={fn} className="min-h-10 rounded-[10px] border border-white/25 bg-transparent px-3.5 py-2 text-caption font-semibold text-white hover:bg-white/10">
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3.5 p-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,130px),1fr))] gap-3 rounded-2xl border border-line bg-card p-4">
          <Stat label="Sales" value={inr(k.sAmt)} />
          <Stat label="− Purchase" value={inr(k.pAmt)} />
          <Stat label="− Expenses" value={inr(k.exp)} />
          <Stat label="= Profit" value={inr(k.profit)} className={`text-xl ${TONE[consTone(k)].text}`} />
          <Stat label="Per kg · margin" value={`${inr(k.perKg)} · ${pct(k.margin)}`} />
        </div>

        <Section title="Purchase">
          {purRows.map((G) => (
            <div key={G.key} className={GRADE_ROW}>
              <span className="font-semibold">{G.name}</span>
              <span className="text-right">{kg(k.g[G.key].kg)}</span>
              <span className="text-right text-muted">@ {inr(k.g[G.key].rate)}</span>
              <span className="text-right font-bold">{inr(k.g[G.key].amt)}</span>
            </div>
          ))}
          <TotalRow left={`Total · ${kg(k.pKg)}`} right={inr(k.pAmt)} />
        </Section>

        <Section title="Expenses">
          {(dc.expenses || [])
            .filter((e) => num(e.amount))
            .map((e) => (
              <div key={e.id} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1fr)] gap-2 border-t border-divider py-1.75 text-sm">
                <span className="font-semibold">{expenseName(e.cat)}</span>
                <span className="text-muted">{e.note || ''}</span>
                <span className="text-right font-bold">{inr(e.amount)}</span>
              </div>
            ))}
          <TotalRow left="Total" right={inr(k.exp)} />
        </Section>

        <Section title="Sales by grade">
          {salRows.map((G) => {
            const g = k.g[G.key]
            return (
              <div key={G.key} className={GRADE_ROW}>
                <span className="font-semibold">{G.name}</span>
                <span className="text-right">{kg(g.skg)}</span>
                <span className="text-right text-muted">@ {inr(g.samt / g.skg)}</span>
                <span className="text-right font-bold">{inr(g.samt)}</span>
              </div>
            )
          })}
          <TotalRow left={`Total · ${kg(k.sKg)}`} right={inr(k.sAmt)} />
          <div className="pt-3.5 pb-1 text-xs font-bold tracking-[.05em] text-muted uppercase">Buyers</div>
          {(dc.sales || []).map((s) => {
            const t = saleTotals(s)
            return (
              <div key={s.id} className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-t border-divider py-1.5 text-caption">
                <span>
                  {s.buyer || 'Unnamed buyer'} <span className="text-muted">· {dateLabel(s.date)}</span>
                </span>
                <span className="text-right">{kg(t.kg)}</span>
                <span className="text-right font-bold">{inr(t.amount)}</span>
              </div>
            )
          })}
        </Section>

        <Section title="Stock left">
          {stockRows.map((G) => (
            <div key={G.key} className="flex justify-between border-t border-divider py-1.75 text-sm">
              <span className="font-semibold">{G.name}</span>
              <span className="font-bold text-amber-deep">{kg(k.g[G.key].rem)}</span>
            </div>
          ))}
          {k.rem <= 0 && <div className="py-1 text-sm font-semibold text-profit-deep">All stock sold — profit is final.</div>}
        </Section>
      </div>
    </Modal>
  )
}
