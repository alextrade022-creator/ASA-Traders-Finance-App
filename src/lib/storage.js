import { STORAGE_KEY } from './constants'
import { addDays, pad3, uid } from './format'

const seedManual = () => [
  { id: uid(), date: '2026-07-01', type: 'in', cat: 'Capital introduced', desc: 'Owner capital for season', amount: '300000', acc: 'sbi' },
  { id: uid(), date: '2026-08-14', type: 'out', cat: 'Drawings', desc: 'Personal withdrawal', amount: '40000', acc: 'cash' },
  { id: uid(), date: '2026-09-10', type: 'out', cat: 'Bank charges', desc: 'RTGS charges', amount: '850', acc: 'fed' },
  { id: uid(), date: '2026-09-30', type: 'in', cat: 'Interest received', desc: 'Savings interest', amount: '2100', acc: 'fed' },
]

/** Sample data shown on first launch. */
export function seed() {
  const base = { g1: 3450, g2: 3250, g3: 3100, g4: 2950, g5: 2800, g6: 1600, g7: 2600 }
  const MK = [
    { g1: 150, g2: 180, g3: 200, g4: 120, g5: 150, g6: -80, g7: 100 },
    { g1: 120, g2: 100, g3: 160, g4: 60, g5: -40, g6: 50, g7: 140 },
  ]
  const MIX = [
    { g1: 100, g3: 250, g5: 150 },
    { g1: 80, g2: 120, g3: 180, g5: 90, g6: 30 },
    { g2: 150, g3: 200, g4: 100, g7: 50 },
    { g1: 60, g3: 220, g5: 140, g6: 40, g7: 40 },
  ]
  const SUP = ['Kumily Spices Co.', 'Periyar Estates', 'Vandanmedu Growers', 'Anakkara Farms']
  const BUY = ['Malabar Traders, Calicut', 'Kannur Spice House', 'Thalassery Hill Produce']
  const D = [
    ['2026-07-04', 0, 0, 0], ['2026-07-13', 1, 1, 40], ['2026-07-24', 2, 0, -30], ['2026-08-02', 3, 1, 60], ['2026-08-10', 0, 0, 100],
    ['2026-08-19', 1, 1, 20], ['2026-08-28', 2, 1, -50], ['2026-09-05', 3, 0, 80], ['2026-09-15', 1, 0, 120], ['2026-09-26', 0, 1, 150],
  ]
  const consignments = D.map(([date, mix, mk, shift], i) => {
    const id = 'C-' + pad3(i + 1)
    const purchase = {}
    const l1 = {}
    const l2 = {}
    Object.entries(MIX[mix]).forEach(([k, kgv]) => {
      const rate = base[k] + shift
      purchase[k] = { kg: String(kgv), rate: String(rate) }
      const sr = rate + MK[mk][k]
      const a = i === 0 ? kgv : Math.round((kgv * 0.6) / 10) * 10
      l1[k] = { kg: String(a), rate: String(sr) }
      if (kgv - a > 0) l2[k] = { kg: String(kgv - a), rate: String(sr + (i % 2 ? 20 : -10)) }
    })
    if (i === 8) delete l2.g6
    const ex =
      i === 0
        ? [['freight', 2850, 'Kumily → Calicut lorry'], ['travel', 2250, 'Lodge, 2 nights'], ['fuel', 5500, ''], ['packing', 900, 'Sacks'], ['labour', 600, 'Loading']]
        : [['freight', 2600 + i * 40, ''], ['toll', 420, ''], ['fuel', 5200 + (i % 3) * 250, ''], ['food', 650, ''], ['travel', 2250, ''], ['labour', 600, 'Loading & unloading'], ['packing', 900, 'Sacks']].concat(
            i % 3 === 0 ? [['grading', 1500, 'Re-grading at Kumily']] : [],
          )
    const sales = [{ id: uid(), buyer: BUY[i % 3], date: addDays(date, 3), lines: l1, acc: 'sbi' }]
    if (i !== 0 && i !== 9 && Object.keys(l2).length) sales.push({ id: uid(), buyer: BUY[(i + 1) % 3], date: addDays(date, 6), lines: l2, acc: 'fed' })
    return {
      id,
      date,
      supplier: SUP[i % 4],
      notes: i === 0 ? 'Sample consignment from brief' : '',
      purchase,
      expenses: ex.map(([cat, amount, note]) => ({ id: uid(), cat, amount: String(amount), note })),
      sales,
    }
  })
  const fx = (o) => ({ accounting: '8000', rent: '12000', software: '1500', consulting: '5000', other: '1500', ...o })
  return {
    manual: seedManual(),
    consignments,
    fixed: { '2026-07': fx({}), '2026-08': fx({ other: '3200' }), '2026-09': fx({ consulting: '7500', other: '1000' }) },
  }
}

/** Upgrades older saved data to the current shape (accounts, per-entry accounts, manual entries). */
export function migrate(d) {
  d = { ...d }
  if (!Array.isArray(d.manual)) d.manual = []
  if (Array.isArray(d.accounts))
    d.accounts = d.accounts.map((a) =>
      a.id === 'cash' && a.opening === '50000' ? { ...a, opening: '250000' } : a.id === 'sbi' && a.opening === '2000000' ? { ...a, opening: '5000000' } : a,
    )
  if (!Array.isArray(d.accounts)) {
    d.accounts = [
      { id: 'cash', name: 'Cash in hand', type: 'Cash', opening: '250000' },
      { id: 'sbi', name: 'SBI Current A/c', type: 'Bank', opening: '5000000' },
      { id: 'fed', name: 'Federal Bank A/c', type: 'Bank', opening: '500000' },
    ]
    d.consignments = d.consignments.map((c) => ({
      ...c,
      purAcc: c.purAcc || 'sbi',
      expAcc: c.expAcc || 'cash',
      sales: (c.sales || []).map((s) => ({ ...s, acc: s.acc || 'sbi' })),
    }))
    const fx = {}
    Object.entries(d.fixed || {}).forEach(([m, f]) => {
      fx[m] = { ...f, accs: f.accs || { accounting: 'fed', rent: 'sbi', software: 'fed', consulting: 'fed', other: 'cash' } }
    })
    d.fixed = fx
  }
  return d
}

export function loadData() {
  let data = null
  try {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    data = null
  }
  if (!data || !Array.isArray(data.consignments)) data = seed()
  return migrate(data)
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* storage full or blocked — app keeps working in memory */
  }
}
