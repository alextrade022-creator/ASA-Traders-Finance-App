import { GRADES, HEX } from '../../lib/constants'
import { inr, kg } from '../../lib/format'
import { tipProps } from '../../lib/tooltip'
import { useApp } from '../../state/AppContext'
import { Card, CardTitle, TONE, cx, signTone } from '../ui'

/** Profit per kg sold for each grade, after allocated expenses. */
export default function GradeMargin() {
  const { summary, actions } = useApp()
  const { set } = summary

  const grades = GRADES.map((G) => {
    let skg = 0
    let samt = 0
    let cost = 0
    let alloc = 0
    const rows = []
    set.forEach(({ c, k }) => {
      const g = k.g[G.key]
      if (g.skg <= 0) return
      const avg = g.kg ? g.amt / g.kg : 0
      const epk = k.pKg ? k.exp / k.pKg : 0
      skg += g.skg
      samt += g.samt
      cost += g.skg * avg
      alloc += g.skg * epk
      const ppk = g.samt / g.skg - avg - epk
      rows.push({ cid: c.id, a: c.id, b: kg(g.skg) + ' · buy ' + inr(avg) + ' → sell ' + inr(g.samt / g.skg), c: inr(ppk) + '/kg', tone: signTone(ppk) })
    })
    return skg > 0 ? { G, skg, ppk: (samt - cost - alloc) / skg, buy: cost / skg, sell: samt / skg, epk: alloc / skg, rows } : null
  }).filter(Boolean)

  const max = Math.max(0, ...grades.map((g) => g.ppk))
  const min = Math.min(0, ...grades.map((g) => g.ppk))
  const range = max - min || 1
  const zero = (-min / range) * 100

  return (
    <Card>
      <CardTitle title="Grade-wise margin" subtitle="Profit per kg sold, after allocated expenses · loss-making grades in red" />
      {grades.length ? (
        <div className="flex flex-col gap-2.5">
          {grades.map((g) => {
            const w = (Math.abs(g.ppk) / range) * 100
            const tone = signTone(g.ppk)
            return (
              <div
                key={g.G.key}
                onClick={() =>
                  actions.openDrill({
                    title: g.G.name + ' · grade margin',
                    sub: 'Profit per kg by consignment, after allocated expenses',
                    headers: ['Consignment', 'Sold · rates', 'Profit/kg'],
                    rows: g.rows,
                  })
                }
                {...tipProps(g.G.name + (g.G.sub ? ' (' + g.G.sub + ')' : ''), [
                  { l: 'Sold', v: kg(g.skg), c: 'transparent' },
                  { l: 'Avg buy', v: inr(g.buy), c: HEX.sage },
                  { l: 'Avg sell', v: inr(g.sell), c: HEX.forest },
                  { l: 'Expense / kg', v: inr(g.epk), c: HEX.caramel },
                  { l: 'Profit / kg', v: inr(g.ppk), c: HEX[tone] },
                ])}
                className="grid cursor-pointer grid-cols-[92px_minmax(0,1fr)_70px] items-center gap-2.5 rounded-lg px-1 py-0.75 hover:bg-forest/6"
              >
                <div className="text-caption font-semibold">{g.G.name}</div>
                <div className="relative h-6 rounded-[5px] bg-sand">
                  <div className="absolute inset-y-0 border-l border-ink/40" style={{ left: `${zero}%` }} />
                  <div className={cx('absolute inset-y-1 rounded-[3px]', TONE[tone].bg)} style={{ left: `${g.ppk >= 0 ? zero : zero - w}%`, width: `${w}%` }} />
                </div>
                <div className={cx('text-right text-caption font-bold', TONE[tone].text)}>{inr(g.ppk)}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-5 text-sm text-muted">No sales recorded yet.</div>
      )}
    </Card>
  )
}
