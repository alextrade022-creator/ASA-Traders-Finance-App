import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { inr, inrShort, pad3, today, uid } from '../lib/format'
import { getMonthSummary } from '../lib/selectors'
import { loadData, saveData } from '../lib/storage'
import { hideTip } from '../lib/tooltip'

const AppContext = createContext(null)

const scrollTop = () => window.scrollTo(0, 0)

export function AppProvider({ defaultView = 'dashboard', currencyShort = false, children }) {
  const [data, setData] = useState(loadData)
  const [ui, setUiState] = useState(() => ({
    view: defaultView,
    month: null,
    cons: 'all',
    activeId: data.consignments.at(-1)?.id ?? null,
    step: 'purchase',
    saleIdx: 0,
    detailId: null,
    drill: null,
    fixedMonth: null,
    lgMonth: null,
    lgAcc: 'all',
    lgType: 'all',
    sim: {},
  }))

  useEffect(() => saveData(data), [data])

  const setUi = useCallback((patch) => setUiState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })), [])

  /** Update one consignment with a mutable deep copy. */
  const updateConsignment = useCallback(
    (id, fn) => setData((d) => ({ ...d, consignments: d.consignments.map((c) => (c.id === id ? fn(structuredClone(c)) : c)) })),
    [],
  )

  const summary = useMemo(() => getMonthSummary(data, ui.month, ui.cons), [data, ui.month, ui.cons])

  const actions = useMemo(
    () => ({
      go: (view, extra) => {
        hideTip()
        setUi({ view, ...extra })
      },
      openDetail: (id) => {
        hideTip()
        setUi({ detailId: id, drill: null })
      },
      closeDetail: () => setUi({ detailId: null }),
      openDrill: (drill) => {
        hideTip()
        setUi({ drill })
      },
      closeDrill: () => setUi({ drill: null }),
      edit: (id, step = 'purchase', saleIdx = 0) => {
        setUi({ activeId: id, view: 'entry', detailId: null, step, saleIdx })
        scrollTop()
      },
      newConsignment: () => {
        const max = data.consignments.reduce((m, c) => Math.max(m, parseInt(c.id.slice(2)) || 0), 0)
        const id = 'C-' + pad3(max + 1)
        const t = today()
        const last = data.consignments.at(-1) || {}
        const a0 = data.accounts[0]?.id
        const c = {
          id,
          date: t,
          supplier: '',
          notes: '',
          purAcc: last.purAcc || a0,
          expAcc: last.expAcc || a0,
          purchase: {},
          expenses: [],
          sales: [{ id: uid(), buyer: '', date: t, lines: {}, acc: last.purAcc || a0 }],
        }
        setData((d) => ({ ...d, consignments: [...d.consignments, c] }))
        setUi({ activeId: id, view: 'entry', step: 'purchase', saleIdx: 0, detailId: null })
        scrollTop()
      },
      removeConsignment: (id) => {
        const remaining = data.consignments.filter((c) => c.id !== id)
        setData((d) => ({ ...d, consignments: d.consignments.filter((c) => c.id !== id) }))
        setUi({ activeId: remaining.at(-1)?.id ?? null })
      },
    }),
    [data, setUi],
  )

  const value = useMemo(
    () => ({ data, setData, updateConsignment, ui, setUi, summary, actions, money: currencyShort ? inrShort : inr }),
    [data, updateConsignment, ui, setUi, summary, actions, currencyShort],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
