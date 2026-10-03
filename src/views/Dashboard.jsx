import BuyerReport from '../components/dashboard/BuyerReport'
import ConsignmentList from '../components/dashboard/ConsignmentList'
import ExpenseBreakdown from '../components/dashboard/ExpenseBreakdown'
import GradeMargin from '../components/dashboard/GradeMargin'
import MonthlyTrend from '../components/dashboard/MonthlyTrend'
import ProfitBridge from '../components/dashboard/ProfitBridge'
import ProfitByConsignment from '../components/dashboard/ProfitByConsignment'
import SalesPurchaseChart from '../components/dashboard/SalesPurchaseChart'
import StockPosition from '../components/dashboard/StockPosition'
import { Button, EmptyState, PageHeader, Select, TONE, cx, signTone } from '../components/ui'
import { inr, kg, monthLabel } from '../lib/format'
import { downloadPdf, downloadXls, monthReport } from '../lib/reports'
import { useApp } from '../state/AppContext'

function Kpi({ label, value, sub, className }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-card px-4 py-3.5">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className={cx('font-heading text-[21px] leading-[1.15] font-bold', className)}>{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  )
}

function HeroFigure({ label, value }) {
  return (
    <div>
      <div className="text-xs">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const { data, summary, setUi, actions, money } = useApp()
  const { month, months, monthCons, consSel, set, totals, monthProfit, fx, net } = summary

  const completed = monthCons.filter((x) => x.k.completed).length
  const profitTone = TONE[signTone(totals.profit)].text
  const fileName = 'ASA-Traders-' + month

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={`Monthly overview · ${consSel === 'all' ? `${monthCons.length} consignment${monthCons.length === 1 ? '' : 's'}` : consSel}`}
        title={monthLabel(month, true)}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={month}
            onChange={(e) => setUi({ month: e.target.value, cons: 'all' })}
            options={(months.length ? months : [month])
              .slice()
              .reverse()
              .map((m) => ({ v: m, l: monthLabel(m, true) }))}
          />
          <Select value={consSel} onChange={(e) => setUi({ cons: e.target.value })} options={monthCons.map(({ c, k }) => ({ v: c.id, l: c.id + ' · ' + k.status }))}>
            <option value="all">All consignments</option>
          </Select>
          <Button onClick={() => downloadPdf(fileName, monthReport(data, summary))}>PDF</Button>
          <Button onClick={() => downloadXls(fileName, monthReport(data, summary))}>Excel</Button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4.5 rounded-[18px] bg-forest px-5.5 pt-5.5 pb-5 text-paper">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <span className="text-caption font-semibold text-mist">Monthly net profit</span>
            <span className={cx('rounded-full px-2.25 py-0.75 text-2xs font-bold text-ink', net >= 0 ? 'bg-profit-light' : 'bg-loss-light')}>
              {net >= 0 ? 'PROFIT' : 'LOSS'}
            </span>
          </div>
          <div className="font-heading text-[clamp(36px,7vw,56px)] leading-none font-bold tracking-[-.02em]">{money(net)}</div>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-5.5 gap-y-2.5 text-sm text-mist">
          <HeroFigure label="Consignment profit" value={money(monthProfit)} />
          <div className="text-lg">−</div>
          <HeroFigure label="Fixed costs" value={money(fx)} />
          <div className="text-lg">=</div>
          <HeroFigure label="Net" value={money(net)} />
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-2.5">
        <Kpi label="Total sales" value={money(totals.sales)} />
        <Kpi label="Total purchase" value={money(totals.pur)} />
        <Kpi label="Consignment expenses" value={money(totals.exp)} />
        <Kpi label="Consignment profit" value={money(totals.profit)} className={profitTone} />
        <Kpi label="Fixed costs (month)" value={money(fx)} className="text-loss" />
        <Kpi label="Consignments" value={String(set.length)} sub={`${completed} completed · ${monthCons.length - completed} in progress`} />
        <Kpi label="Total kg traded" value={kg(totals.kg)} />
        <Kpi label="Avg profit / kg" value={inr(totals.kg ? totals.profit / totals.kg : 0)} className={profitTone} />
      </div>

      {set.length === 0 && (
        <EmptyState>
          No consignments recorded for this month yet.
          <Button variant="primary" onClick={actions.newConsignment}>
            + New Consignment
          </Button>
        </EmptyState>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] gap-4">
        <ProfitByConsignment />
        <SalesPurchaseChart />
        <MonthlyTrend />
        <ProfitBridge />
        <GradeMargin />
        <ExpenseBreakdown />
        <BuyerReport />
        <StockPosition />
        <ConsignmentList />
      </div>
    </div>
  )
}
