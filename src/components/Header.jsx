import { useApp } from '../state/AppContext'
import { cx } from './ui'

const NAV = [
  { view: 'dashboard', label: 'Dashboard' },
  { view: 'entry', label: 'Consignments' },
  { view: 'fixed', label: 'Fixed costs' },
  { view: 'acc', label: 'Accounts' },
]

export default function Header() {
  const { ui, actions, summary } = useApp()

  const go = (view) => actions.go(view, view === 'fixed' ? { fixedMonth: summary.month } : undefined)

  return (
    <header className="sticky top-0 z-30 bg-ink text-paper">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9.5 place-items-center rounded-full bg-sage font-heading text-base leading-none font-bold text-ink">A</div>
          <div>
            <div className="font-heading text-[19px] leading-[1.1] font-bold tracking-[-.01em]">ASA Traders</div>
            <div className="text-xs text-fog">Green cardamom · Kumily → Malabar</div>
          </div>
        </div>
        <nav className="flex flex-wrap gap-1 rounded-[22px] bg-white/8 p-1">
          {NAV.map((n) => (
            <button
              key={n.view}
              type="button"
              onClick={() => go(n.view)}
              aria-current={ui.view === n.view ? 'page' : undefined}
              className={cx(
                'min-h-10 rounded-full px-4 py-2.25 text-sm font-semibold whitespace-nowrap transition-colors',
                ui.view === n.view ? 'bg-paper text-ink' : 'bg-transparent text-haze hover:bg-white/10',
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
