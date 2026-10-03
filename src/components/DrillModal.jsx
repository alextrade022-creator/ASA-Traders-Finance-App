import { useApp } from '../state/AppContext'
import { CloseButton, Modal, TONE } from './ui'

const ROW = 'grid grid-cols-[minmax(0,.8fr)_minmax(0,1.4fr)_minmax(0,1fr)] gap-2'

/** Drill-down list (grade margin, expense category, buyer). Rows open the consignment summary. */
export default function DrillModal() {
  const { ui, actions } = useApp()
  const dr = ui.drill
  if (!dr) return null

  return (
    <Modal onClose={actions.closeDrill} className="flex max-w-[620px] flex-col gap-1.5 rounded-[18px] bg-card p-5">
      <div className="flex items-start justify-between gap-2.5 pb-1.5">
        <div>
          <div className="font-heading text-[22px] leading-[1.1] font-bold">{dr.title}</div>
          <div className="mt-1 text-caption text-muted">{dr.sub}</div>
        </div>
        <CloseButton onClick={actions.closeDrill} className="bg-sand-hover" />
      </div>
      <div className={`${ROW} px-1.5 py-1 text-2xs font-bold tracking-[.05em] text-muted uppercase`}>
        <span>{dr.headers[0]}</span>
        <span>{dr.headers[1]}</span>
        <span className="text-right">{dr.headers[2]}</span>
      </div>
      {dr.rows.map((r, i) => (
        <div
          key={i}
          onClick={() => actions.openDetail(r.cid)}
          className={`${ROW} cursor-pointer rounded-md border-t border-divider px-1.5 py-2.5 text-sm hover:bg-forest/6`}
        >
          <span className="font-bold">{r.a}</span>
          <span className="text-muted">{r.b}</span>
          <span className={`text-right font-bold ${TONE[r.tone || 'ink'].text}`}>{r.c}</span>
        </div>
      ))}
    </Modal>
  )
}
