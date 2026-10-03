export const STORAGE_KEY = 'asa-traders-v1'

export const GRADES = [
  { key: 'g1', name: '8mm+', sub: 'Super Bold' },
  { key: 'g2', name: '7.5–8mm', sub: 'Bold' },
  { key: 'g3', name: '7–8mm', sub: 'Standard' },
  { key: 'g4', name: '7–7.5mm', sub: '' },
  { key: 'g5', name: '6–7mm', sub: '' },
  { key: 'g6', name: 'Rejection / Pan', sub: '' },
  { key: 'g7', name: 'Mixed Bulk', sub: 'Ungraded' },
]

// `color` is data (drives chart segments), so it stays a hex value.
export const EXPENSE_CATS = [
  { key: 'freight', name: 'Transportation / Freight', color: '#1f5c3d' },
  { key: 'toll', name: 'Toll', color: '#4f8a63' },
  { key: 'fuel', name: 'Fuel', color: '#9fb89a' },
  { key: 'food', name: 'Food', color: '#d9a25a' },
  { key: 'travel', name: 'Travel & Stay', color: '#b5713a' },
  { key: 'labour', name: 'Salary / Labour', color: '#6c7d5a' },
  { key: 'packing', name: 'Packing (sacks)', color: '#c9c2a5' },
  { key: 'grading', name: 'Grading / Sorting', color: '#3d4a42' },
  { key: 'other', name: 'Other', color: '#a79f8a' },
]

export const FIXED_COSTS = [
  { key: 'accounting', name: 'Accounting & taxation', short: 'Accounting' },
  { key: 'rent', name: 'Room / storage rent', short: 'Rent' },
  { key: 'software', name: 'Software subscription', short: 'Software' },
  { key: 'consulting', name: 'Consulting fees', short: 'Consulting' },
  { key: 'other', name: 'Other fixed costs', short: 'Other' },
]

export const IN_CATS = ['Capital introduced', 'Loan received', 'Interest received', 'Commission received', 'Other income']
export const OUT_CATS = ['Office expenses', 'Electricity & phone', 'Bank charges', 'Drawings', 'Loan repayment', 'Advance paid', 'Other expense']
export const ACC_TYPES = ['Bank', 'Cash', 'UPI / Wallet', 'Other']

// Hex values for places that need a raw colour (SVG strokes, tooltip swatches).
export const HEX = {
  profit: '#2e7d4a',
  loss: '#c2412d',
  amber: '#d4952a',
  forest: '#1f5c3d',
  sage: '#9fb89a',
  caramel: '#d9a25a',
  mist: '#cfdccd',
  ink: '#1d2b22',
  coral: '#d98a76',
}
