import { GRADES } from '../../lib/constants'
import { inr, kg, num } from '../../lib/format'
import { useApp } from '../../state/AppContext'
import { Button, Pill, TONE, cx, signTone } from '../ui'

const STATE = {
  be: { label: 'Break-even', tone: 'amber', chip: 'bg-amber-soft text-amber-deep', accent: 'accent-amber', border: 'border-amber' },
  p: { label: 'Profit', tone: 'profit', chip: 'bg-profit-soft text-profit-deep', accent: 'accent-profit', border: 'border-profit' },
  l: { label: 'Loss', tone: 'loss', chip: 'bg-loss-soft text-loss-deep', accent: 'accent-loss', border: 'border-loss' },
}

/** "What if" selling price per grade → profit, loss or break-even for the consignment. */
export default function PriceSimulator({ id, k, sale, setSale }) {
  const { ui, setUi } = useApp()
  const sim = ui.sim[id] || {}
  const setSim = (gk, v) => setUi((s) => ({ sim: { ...s.sim, [id]: { ...(s.sim[id] || {}), [gk]: v } } }))
  const epk = k.pKg ? k.exp / k.pKg : 0

  let projRem = 0
  let remKgAll = 0
  const rows = GRADES.filter((G) => k.g[G.key].kg > 0).map((G) => {
    const g = k.g[G.key]
    const buy = g.amt / g.kg
    const be = buy + epk
    const rem = Math.max(0, g.rem)
    const cur = num(((sale.lines || {})[G.key] || {}).rate)
    const raw = sim[G.key] != null ? sim[G.key] : cur ? String(cur) : String(Math.ceil(be))
    const price = num(raw)
    const ppk = price - be
    const state = STATE[Math.abs(ppk) < 1 ? 'be' : ppk > 0 ? 'p' : 'l']
    projRem += rem * price
    remKgAll += rem
    return { G, buy, be, rem, raw, price, ppk, state }
  })

  const projFinal = k.sAmt + projRem - k.pAmt - k.exp
  const needAvg = remKgAll ? (k.pAmt + k.exp - k.sAmt) / remKgAll : 0
  const plus = (v) => (v > 0 ? '+' : '') + inr(v)

  return (
    <div className="flex min-w-0 flex-col gap-3.5 rounded-2xl border-[1.5px] border-amber bg-card p-4.5">
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <div className="font-heading text-title leading-tight font-semibold">Selling price simulator</div>
          <div className="text-caption text-muted">Try a price per kg for each grade to see profit, loss or break-even for this consignment</div>
        </div>
        <Button size="xs" onClick={() => setUi((s) => ({ sim: { ...s.sim, [id]: {} } }))}>
          Reset
        </Button>
      </div>
      <div className="rounded-lg bg-sand px-2.5 py-2 text-xs text-muted">Break-even = buy rate + expense per kg ({inr(epk)}/kg on this consignment)</div>

      {rows.map(({ G, buy, be, rem, raw, price, ppk, state }) => (
        <div key={G.key} className="flex flex-col gap-2 border-t border-divider py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-body font-bold">{G.name}</span>
              <span className="text-xs text-muted"> · {rem > 0 ? kg(rem) + ' left' : 'Sold out'}</span>
            </div>
            <Pill className={cx('px-2.25 py-0.75', state.chip)}>{state.label}</Pill>
          </div>
          <div className="text-xs text-muted">
            Buy {inr(buy)} + exp {inr(epk)} = <span className="font-bold text-ink">break-even {inr(be)}/kg</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-2.5">
            <input
              type="range"
              aria-label={`${G.name} price`}
              min={Math.floor((be * 0.9) / 10) * 10}
              max={Math.ceil((be * 1.12) / 10) * 10}
              step={5}
              value={raw}
              onChange={(e) => setSim(G.key, e.target.value)}
              className={cx('w-full', state.accent)}
            />
            <input
              type="number"
              step="any"
              min="0"
              value={raw}
              onChange={(e) => setSim(G.key, e.target.value)}
              className={cx('min-h-10 w-full rounded-lg border-[1.5px] bg-white px-2 py-1.75 text-right text-base font-bold text-ink', state.border)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className={cx('flex gap-3.5 text-caption [&_b]:font-bold', TONE[state.tone].text)}>
              <div>
                <div className="text-2xs text-muted">Profit / kg</div>
                <b>{plus(ppk)}</b>
              </div>
              <div>
                <div className="text-2xs text-muted">On {kg(rem)} left</div>
                <b>{plus(ppk * rem)}</b>
              </div>
            </div>
            <Button
              variant="soft"
              size="xs"
              onClick={() =>
                setSale((s) => {
                  const { amt, ...line } = s.lines[G.key] || {}
                  s.lines[G.key] = { ...line, rate: String(price), mode: 'rate' }
                })
              }
            >
              Use rate in this sale
            </Button>
          </div>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-2.5 border-t-2 border-ink pt-3">
        <div>
          <div className="text-2xs font-semibold text-muted">Projected final profit</div>
          <div className={cx('font-heading text-xl leading-[1.1] font-bold', TONE[signTone(projFinal)].text)}>{inr(projFinal)}</div>
        </div>
        <div>
          <div className="text-2xs font-semibold text-muted">Break-even avg price</div>
          <div className="font-heading text-xl leading-[1.1] font-bold">{remKgAll ? inr(Math.max(0, needAvg)) : '—'}</div>
        </div>
      </div>
      <div className="text-xs leading-[1.45] text-muted">
        Projected profit assumes all remaining stock sells at the prices above.{' '}
        {remKgAll
          ? 'Average price needed on the remaining ' + kg(remKgAll) + ' to break even on the whole consignment'
          : 'All stock sold. Prices here are for reference only'}
        .
      </div>
    </div>
  )
}
