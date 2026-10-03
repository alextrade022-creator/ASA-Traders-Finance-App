import { useTooltip } from '../lib/tooltip'

export default function Tooltip() {
  const tip = useTooltip()
  if (!tip) return null
  return (
    <div
      className="pointer-events-none fixed z-60 flex min-w-[170px] flex-col gap-1.25 rounded-[10px] bg-ink px-3 py-2.5 text-white shadow-[0_8px_24px_rgba(0,0,0,.18)]"
      style={{ left: tip.x, top: tip.y }}
    >
      <div className="text-xs font-bold text-mist">{tip.title}</div>
      {tip.lines.map((t) => (
        <div key={t.l} className="flex justify-between gap-3.5 text-caption">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[2px]" style={{ backgroundColor: t.c }} />
            {t.l}
          </span>
          <span className="font-bold">{t.v}</span>
        </div>
      ))}
    </div>
  )
}
