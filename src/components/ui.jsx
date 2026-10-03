import { useEffect } from 'react'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge our custom font-size tokens (see @theme in index.css) so
// `text-caption` is treated as a size, not a colour.
const twMerge = extendTailwindMerge({ extend: { theme: { text: ['2xs', 'caption', 'body', 'title'] } } })

/** Join class names; later classes override conflicting earlier ones (e.g. `p-4` beats `p-4.5`). */
export const cx = (...classes) => twMerge(classes.filter(Boolean).join(' '))

/** Tone → Tailwind classes. Keys must stay literal so Tailwind can see them. */
export const TONE = {
  profit: { text: 'text-profit', bg: 'bg-profit' },
  loss: { text: 'text-loss', bg: 'bg-loss' },
  amber: { text: 'text-amber', bg: 'bg-amber' },
  forest: { text: 'text-forest', bg: 'bg-forest' },
  coral: { text: 'text-coral', bg: 'bg-coral' },
  ink: { text: 'text-ink', bg: 'bg-ink' },
}

/** Profit = green, loss = red, still-selling = amber. */
export const consTone = (k) => (!k.completed ? 'amber' : k.profit >= 0 ? 'profit' : 'loss')
export const signTone = (v) => (v >= 0 ? 'profit' : 'loss')

/* ---------- Layout ---------- */

export function Card({ as: Tag = 'section', className, children, ...rest }) {
  return (
    <Tag className={cx('flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-card p-4.5', className)} {...rest}>
      {children}
    </Tag>
  )
}

export function CardTitle({ title, subtitle, className }) {
  return (
    <div className={className}>
      <h2 className="font-heading text-title leading-tight font-semibold">{title}</h2>
      {subtitle && <p className="text-caption text-muted">{subtitle}</p>}
    </div>
  )
}

export function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-xs font-bold tracking-[.08em] text-muted uppercase">{eyebrow}</div>
        <h1 className="mt-1 font-heading text-[clamp(28px,4vw,38px)] leading-[1.05] font-bold tracking-[-.02em]">{title}</h1>
      </div>
      {children}
    </div>
  )
}

export function Eyebrow({ className, children }) {
  return <div className={cx('text-2xs font-bold tracking-[.05em] text-muted uppercase', className)}>{children}</div>
}

/* ---------- Controls ---------- */

const BUTTON_VARIANT = {
  primary: 'border-transparent bg-forest text-white hover:bg-forest-dark',
  secondary: 'border-field bg-card text-ink hover:bg-sand-hover',
  danger: 'border-danger-line bg-card text-danger hover:bg-danger-soft',
  soft: 'border-transparent bg-mint text-forest font-bold hover:bg-mint-hover',
  dashed: 'border-dashed border-sage bg-transparent text-forest hover:bg-forest/5',
}
const BUTTON_SIZE = {
  md: 'min-h-10.5 rounded-[10px] px-4 py-2.5 text-sm',
  sm: 'min-h-10 rounded-[10px] px-3 py-2 text-caption',
  xs: 'min-h-8.5 rounded-lg px-2.5 py-1.5 text-xs',
}

export function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cx('inline-flex items-center justify-center border font-semibold whitespace-nowrap transition-colors', BUTTON_VARIANT[variant], BUTTON_SIZE[size], className)}
      {...props}
    />
  )
}

export function LinkButton({ className, ...props }) {
  return <button type="button" className={cx('self-start bg-transparent p-0 text-caption font-semibold text-forest hover:underline', className)} {...props} />
}

export function IconButton({ className, ...props }) {
  return (
    <button
      type="button"
      className={cx('rounded-lg bg-transparent text-xl text-faint transition-colors hover:bg-danger-wash hover:text-danger', className)}
      {...props}
    />
  )
}

/** Toolbar-style select (page headers, filters). */
export function Select({ options, className, children, ...props }) {
  return (
    <select className={cx('min-h-10.5 max-w-full rounded-[10px] border border-field bg-card px-3 py-2 text-body text-ink', className)} {...props}>
      {children}
      {options?.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  )
}

/**
 * Shared form-field look. `tinted` marks a calculated value, `invalid` a field in error —
 * passed as props (not override classes) so background/border never conflict.
 */
const field = ({ tinted, invalid } = {}) =>
  cx(
    'w-full min-h-10.5 rounded-lg border px-2.5 py-2 text-base text-ink focus:outline-2 focus:-outline-offset-1 focus:outline-forest',
    tinted ? 'bg-sand' : 'bg-white',
    invalid ? 'border-loss' : 'border-field',
  )

/** Form select (inside cards). */
export function FieldSelect({ options, className, ...props }) {
  return (
    <select className={cx(field(), 'text-body', className)} {...props}>
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  )
}

export function TextInput({ className, tinted, invalid, ...props }) {
  return <input className={cx(field({ tinted, invalid }), className)} {...props} />
}

export function NumberInput({ className, tinted, invalid, ...props }) {
  return <input type="number" step="any" min="0" className={cx(field({ tinted, invalid }), 'text-right', className)} {...props} />
}

export function Field({ label, className, children }) {
  return (
    <label className={cx('flex flex-col gap-1.25 text-xs font-semibold text-muted', className)}>
      {label}
      {children}
    </label>
  )
}

/** Inline "Paid from [account]" style label + select. */
export function InlineField({ label, className, children }) {
  return <label className={cx('flex flex-wrap items-center gap-2.5 text-caption font-semibold text-muted', className)}>{label}{children}</label>
}

/* ---------- Display ---------- */

export function Pill({ className, children }) {
  return <span className={cx('rounded-full px-2 py-0.5 text-2xs font-bold', className)}>{children}</span>
}

export function StatusPill({ completed, large }) {
  return (
    <Pill className={cx(completed ? 'bg-profit-soft text-profit-deep' : 'bg-amber-soft text-amber-deep', large && 'px-2.5 py-1 text-xs')}>
      {completed ? 'Completed' : 'In Progress'}
    </Pill>
  )
}

export function Swatch({ className, color }) {
  return <span className={cx('size-2.5 shrink-0 rounded-[3px]', className)} style={color ? { backgroundColor: color } : undefined} />
}

/** Chart legend. items: [{label, swatch: ReactNode}] */
export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-3.5 text-xs text-muted">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          {it.swatch}
          {it.label}
        </span>
      ))}
    </div>
  )
}

/** Axis labels under bar charts. */
export function AxisLabels({ labels, gap = 'gap-1.5' }) {
  return (
    <div className={cx('flex', gap)}>
      {labels.map((l, i) => (
        <div key={i} className="flex-1 text-center text-2xs leading-tight font-semibold text-muted">
          {l}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ className, children }) {
  return (
    <div className={cx('flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone bg-card p-7 text-center text-body text-muted', className)}>
      {children}
    </div>
  )
}

export function Modal({ onClose, className, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-ink/55 p-3">
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className={cx('my-auto w-full', className)}>
        {children}
      </div>
    </div>
  )
}

export function CloseButton({ className, ...props }) {
  return (
    <button type="button" aria-label="Close" className={cx('size-10 flex-none rounded-full text-xl', className)} {...props}>
      ×
    </button>
  )
}
