import { useSyncExternalStore } from 'react'

// Tooltip lives in a tiny external store so mouse-move updates only re-render
// the <Tooltip/> itself, not the whole dashboard.
let tip = null
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

export function showTip(e, title, lines) {
  let x = e.clientX + 14
  let y = e.clientY + 14
  if (x > window.innerWidth - 210) x = e.clientX - 200
  if (y > window.innerHeight - 140) y = e.clientY - 120
  tip = { x, y, title, lines }
  emit()
}

export function hideTip() {
  if (!tip) return
  tip = null
  emit()
}

/** Spread onto any element: {...tipProps('Title', [{l, v, c}])} */
export const tipProps = (title, lines) => ({
  onMouseMove: (e) => showTip(e, title, lines),
  onMouseLeave: hideTip,
})

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const useTooltip = () => useSyncExternalStore(subscribe, () => tip)
