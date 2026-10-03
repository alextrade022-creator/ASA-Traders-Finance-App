import { inr, kg, pct } from '../../lib/format'
import { cx } from '../ui'

function Line({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-fog">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function Tile({ label, value }) {
  return (
    <div className="rounded-[10px] bg-white/7 p-2.5">
      <div className="text-2xs text-fog">{label}</div>
      <div className="text-body font-bold">{value}</div>
    </div>
  )
}

/** Sticky dark card with the running / final profit of the active consignment. */
export default function ProfitSummary({ k, anyOver }) {
  const profitColor = !k.completed ? 'text-amber-light' : k.profit >= 0 ? 'text-profit-light' : 'text-loss-light'
  const note = anyOver
    ? '⚠ A sale exceeds purchased stock — please check quantities.'
    : k.completed
      ? 'All stock sold. This consignment is completed and its profit is final.'
      : 'In Progress: running profit counts only stock sold so far (sold kg × buy rate, plus a proportional share of expenses). Unsold stock at cost: ' +
        inr(k.stockCost) +
        '. Profit becomes final once everything is sold.'

  return (
    <div className="sticky top-22.5 flex flex-col gap-3 rounded-2xl bg-ink p-4.5 text-paper">
      <div className="font-heading text-title leading-tight font-semibold">Consignment profit</div>
      <div className="flex flex-col gap-2 text-sm">
        <Line label="Total sales" value={inr(k.sAmt)} />
        <Line label="− Total purchase" value={inr(k.pAmt)} />
        <Line label="− Consignment expenses" value={inr(k.exp)} />
      </div>
      <div className="flex items-baseline justify-between gap-2 border-t border-white/18 pt-3">
        <span className="text-caption text-fog">{k.completed ? 'Final profit' : 'Running profit'}</span>
        <span className={cx('font-heading text-3xl leading-none font-bold', profitColor)}>{inr(k.profit)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Tile label="Profit / kg" value={inr(k.perKg)} />
        <Tile label="Margin" value={pct(k.margin)} />
        <Tile label="Stock left" value={kg(k.rem)} />
      </div>
      <div className="text-xs leading-[1.45] text-fog">{note}</div>
    </div>
  )
}
