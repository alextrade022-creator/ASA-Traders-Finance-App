import { HEX } from '../../lib/constants'
import { inr } from '../../lib/format'
import { tipProps } from '../../lib/tooltip'
import { useApp } from '../../state/AppContext'
import { AxisLabels, Card, CardTitle, Legend, Swatch } from '../ui'

const BAR = 'w-[min(16px,28%)] rounded-t-[3px]'

export default function SalesPurchaseChart() {
  const { summary, actions } = useApp()
  const { set } = summary
  const max = Math.max(1, ...set.flatMap((x) => [x.k.sAmt, x.k.pAmt, x.k.exp]))

  return (
    <Card>
      <CardTitle title="Sales vs purchase vs expenses" subtitle="Per consignment · hover for amounts" />
      <div className="mt-4.5 mb-1.5 flex h-55 gap-1.5 border-b border-ink/35">
        {set.map(({ c, k }) => (
          <div
            key={c.id}
            onClick={() => actions.openDetail(c.id)}
            {...tipProps(c.id, [
              { l: 'Sales', v: inr(k.sAmt), c: HEX.forest },
              { l: 'Purchase', v: inr(k.pAmt), c: HEX.sage },
              { l: 'Expenses', v: inr(k.exp), c: HEX.caramel },
            ])}
            className="flex flex-1 cursor-pointer items-end justify-center gap-0.75 rounded-t-lg hover:bg-forest/6"
          >
            <div className={`${BAR} bg-forest`} style={{ height: `${(k.sAmt / max) * 100}%` }} />
            <div className={`${BAR} bg-sage`} style={{ height: `${(k.pAmt / max) * 100}%` }} />
            <div className={`${BAR} min-h-0.5 bg-caramel`} style={{ height: `${(k.exp / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <AxisLabels labels={set.map((x) => x.c.id)} />
      <Legend
        items={[
          { label: 'Sales', swatch: <Swatch className="bg-forest" /> },
          { label: 'Purchase', swatch: <Swatch className="bg-sage" /> },
          { label: 'Expenses', swatch: <Swatch className="bg-caramel" /> },
        ]}
      />
    </Card>
  )
}
