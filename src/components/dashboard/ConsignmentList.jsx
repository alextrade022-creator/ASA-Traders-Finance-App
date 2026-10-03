import { dateLabel, inr, kg } from '../../lib/format'
import { useApp } from '../../state/AppContext'
import { Button, Card, CardTitle, StatusPill, TONE, consTone, cx } from '../ui'

export default function ConsignmentList() {
  const { summary, actions } = useApp()

  return (
    <Card className="gap-2">
      <div className="flex items-center justify-between gap-2.5">
        <CardTitle title="Consignments this month" subtitle="Tap a row for the full summary" />
        <Button variant="primary" size="sm" onClick={actions.newConsignment}>
          + New
        </Button>
      </div>
      {summary.monthCons.map(({ c, k }) => (
        <div
          key={c.id}
          onClick={() => actions.openDetail(c.id)}
          className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-lg border-t border-divider px-2 py-2.5 hover:bg-forest/6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{c.id}</span>
            <StatusPill completed={k.completed} />
          </div>
          <div className={cx('text-right text-sm font-bold', TONE[consTone(k)].text)}>{inr(k.profit)}</div>
          <div className="text-xs text-muted">
            {dateLabel(c.date)} · {c.supplier || '—'}
          </div>
          <div className="text-right text-xs text-muted">
            {kg(k.pKg)} · {inr(k.perKg)}/kg
          </div>
        </div>
      ))}
    </Card>
  )
}
