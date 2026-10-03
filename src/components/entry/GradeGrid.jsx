import { Eyebrow, cx } from '../ui'

/** 4-column grade/qty/rate/amount layout shared by the Purchase and Sales steps. */
export const GRADE_GRID = 'grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] gap-2'

export function GradeGridHeader({ first, qty }) {
  return (
    <Eyebrow className={cx(GRADE_GRID, 'px-0.5 [&>span:not(:first-child)]:text-right')}>
      <span>{first}</span>
      <span>{qty}</span>
      <span>Rate ₹/kg</span>
      <span>Amount</span>
    </Eyebrow>
  )
}

export function GradeGridTotal({ label, kg, amount }) {
  return (
    <div className={cx(GRADE_GRID, 'border-t-2 border-ink px-0.5 pt-3 text-body font-bold')}>
      <span>{label}</span>
      <span className="text-right">{kg}</span>
      <span />
      <span className="text-right">{amount}</span>
    </div>
  )
}
