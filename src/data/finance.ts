// Mock Finance & Accounting data for organisation workspaces.
//
// Like `organisations.ts`, everything is served from localStorage behind the
// promise-based `api.org.finance.*` calls so a real backend can be swapped in later.
// Data is scoped per organisation (`merchant_org_finance_{orgId}`) so it never mixes
// with other orgs or with normal server-backed login data.

export type LedgerCategory = 'income' | 'expense' | 'asset' | 'liability'

export interface LedgerEntry {
  id: string
  date: string // ISO yyyy-mm-dd
  account: string
  category: LedgerCategory
  description: string
  amount: number // always positive; sign is derived from the category
  reference: string
  status: 'posted' | 'pending'
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'

export interface InvoiceLineItem {
  description: string
  qty: number
  unitPrice: number
}

export interface Invoice {
  id: string
  number: string
  customer: string
  issuedAt: string
  dueAt: string
  amount: number
  status: InvoiceStatus
  items: InvoiceLineItem[]
}

export interface TaxItem {
  id: string
  name: string
  rate: number // percent
  basis: number // taxable amount
  period: string
  dueAt: string
  paid: number
  status: 'paid' | 'due' | 'upcoming'
}

export interface FinanceState {
  ledger: LedgerEntry[]
  invoices: Invoice[]
  taxes: TaxItem[]
}

export interface BalanceSheetLine {
  label: string
  value: number
}

export interface BalanceSheet {
  assets: BalanceSheetLine[]
  liabilities: BalanceSheetLine[]
  equity: BalanceSheetLine[]
  updatedAt: string
}

export interface InvoiceInput {
  customer: string
  dueAt: string
  items: InvoiceLineItem[]
}

const FINANCE_KEY_PREFIX = 'merchant_org_finance_'
const FINANCE_VERSION = 1

function storageKey(orgId: string) {
  return `${FINANCE_KEY_PREFIX}${orgId}`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function seedFinanceState(): FinanceState {
  return {
    ledger: [
      { id: 'LDG-0001', date: daysAgo(2), account: 'Sales Revenue', category: 'income', description: 'POS sales — Week of 21 Aug', amount: 12480, reference: 'POS-0914', status: 'posted' },
      { id: 'LDG-0002', date: daysAgo(2), account: 'Cost of Goods Sold', category: 'expense', description: 'Cost of goods — Week of 21 Aug', amount: 7250, reference: 'COGS-0914', status: 'posted' },
      { id: 'LDG-0003', date: daysAgo(6), account: 'Sales Revenue', category: 'income', description: 'POS sales — Week of 17 Aug', amount: 10920, reference: 'POS-0910', status: 'posted' },
      { id: 'LDG-0004', date: daysAgo(8), account: 'Utilities', category: 'expense', description: 'Electricity & water', amount: 820, reference: 'UTL-0088', status: 'posted' },
      { id: 'LDG-0005', date: daysAgo(10), account: 'Marketing', category: 'expense', description: 'Social media campaign', amount: 1200, reference: 'MKT-0042', status: 'posted' },
      { id: 'LDG-0006', date: daysAgo(12), account: 'Sales Revenue', category: 'income', description: 'POS sales — Week of 10 Aug', amount: 11350, reference: 'POS-0903', status: 'posted' },
      { id: 'LDG-0007', date: daysAgo(12), account: 'Cost of Goods Sold', category: 'expense', description: 'Cost of goods — Week of 10 Aug', amount: 6300, reference: 'COGS-0903', status: 'posted' },
      { id: 'LDG-0008', date: daysAgo(15), account: 'Service Income', category: 'income', description: 'Delivery & service fees', amount: 2400, reference: 'SVC-0112', status: 'posted' },
      { id: 'LDG-0009', date: daysAgo(15), account: 'Salaries', category: 'expense', description: 'Staff payroll (August)', amount: 9400, reference: 'PAY-0015', status: 'posted' },
      { id: 'LDG-0010', date: daysAgo(20), account: 'Sales Revenue', category: 'income', description: 'POS sales — Week of 27 Jul', amount: 9860, reference: 'POS-0896', status: 'posted' },
      { id: 'LDG-0011', date: daysAgo(20), account: 'Accounts Payable', category: 'liability', description: 'Supplier invoice SN-2231 (stock)', amount: 21800, reference: 'AP-0077', status: 'pending' },
      { id: 'LDG-0012', date: daysAgo(28), account: 'Sales Revenue', category: 'income', description: 'POS sales — Week of 20 Jul', amount: 13100, reference: 'POS-0889', status: 'posted' },
      { id: 'LDG-0013', date: daysAgo(30), account: 'Rent', category: 'expense', description: 'Shop rent (August)', amount: 4500, reference: 'RNT-0006', status: 'posted' },
      { id: 'LDG-0014', date: daysAgo(31), account: 'Salaries', category: 'expense', description: 'Staff payroll (July)', amount: 9400, reference: 'PAY-0014', status: 'posted' },
      { id: 'LDG-0015', date: daysAgo(36), account: 'Sales Revenue', category: 'income', description: 'POS sales — Week of 6 Jul', amount: 10540, reference: 'POS-0881', status: 'posted' },
      { id: 'LDG-0016', date: daysAgo(45), account: 'Cash & Bank', category: 'asset', description: 'Opening cash balance', amount: 148500, reference: 'OPEN-0001', status: 'posted' },
      { id: 'LDG-0017', date: daysAgo(45), account: 'Inventory', category: 'asset', description: 'Opening stock', amount: 58200, reference: 'OPEN-0002', status: 'posted' },
      { id: 'LDG-0018', date: daysAgo(45), account: 'Equipment', category: 'asset', description: 'POS terminals & fixtures', amount: 45000, reference: 'OPEN-0003', status: 'posted' },
    ],
    invoices: [
      {
        id: 'INV-0001', number: 'INV-2026-0101', customer: 'Adom Fresh Foods', issuedAt: daysAgo(8), dueAt: daysFromNow(6), status: 'sent',
        items: [
          { description: 'Baking flour (50kg)', qty: 50, unitPrice: 55 },
          { description: 'Cooking oil (20L)', qty: 20, unitPrice: 60 },
          { description: 'Granulated sugar (50kg)', qty: 15, unitPrice: 60 },
        ],
        amount: 4850,
      },
      {
        id: 'INV-0002', number: 'INV-2026-0102', customer: "Naana's Kitchen", issuedAt: daysAgo(20), dueAt: daysAgo(3), status: 'overdue',
        items: [
          { description: 'Long grain rice (50kg)', qty: 40, unitPrice: 50 },
          { description: 'Dried beans (50kg)', qty: 30, unitPrice: 40 },
        ],
        amount: 3200,
      },
      {
        id: 'INV-0003', number: 'INV-2026-0103', customer: 'Total Trust Wholesale', issuedAt: daysAgo(30), dueAt: daysAgo(16), status: 'paid',
        items: [
          { description: 'Tomato paste (24-pack)', qty: 200, unitPrice: 12 },
          { description: 'Evaporated milk (24-pack)', qty: 100, unitPrice: 25 },
          { description: 'Bread flour (25kg)', qty: 50, unitPrice: 30 },
        ],
        amount: 6400,
      },
      {
        id: 'INV-0004', number: 'INV-2026-0104', customer: 'Efua Bakery', issuedAt: daysAgo(2), dueAt: daysFromNow(26), status: 'draft',
        items: [
          { description: 'Butter (250g)', qty: 25, unitPrice: 45 },
          { description: 'Granulated sugar (25kg)', qty: 10, unitPrice: 60 },
          { description: 'Table salt (25kg)', qty: 10, unitPrice: 25 },
        ],
        amount: 1975,
      },
      {
        id: 'INV-0005', number: 'INV-2026-0105', customer: 'City Restaurants Ltd', issuedAt: daysAgo(40), dueAt: daysAgo(26), status: 'paid',
        items: [
          { description: 'Beef (kg)', qty: 150, unitPrice: 40 },
          { description: 'Whole chicken (kg)', qty: 100, unitPrice: 30 },
        ],
        amount: 9000,
      },
    ],
    taxes: [
      { id: 'TAX-001', name: 'VAT (Sales Tax)', rate: 16, basis: 96000, period: 'Aug 2026', dueAt: daysFromNow(14), paid: 0, status: 'due' },
      { id: 'TAX-002', name: 'Payroll (PAYE)', rate: 15, basis: 22000, period: 'Jul 2026', dueAt: daysAgo(5), paid: 0, status: 'due' },
      { id: 'TAX-003', name: 'Corporate Income Tax', rate: 25, basis: 30000, period: 'FY 2026 · Q3', dueAt: daysFromNow(45), paid: 0, status: 'upcoming' },
      { id: 'TAX-004', name: 'Withholding Tax', rate: 5, basis: 18000, period: 'Jun 2026', dueAt: daysAgo(10), paid: 900, status: 'paid' },
    ],
  }
}

export function loadFinanceState(orgId: string): FinanceState {
  const key = storageKey(orgId)
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as { version: number; state: FinanceState }
      if (parsed && parsed.version === FINANCE_VERSION && parsed.state) return parsed.state
    }
  } catch {
    // corrupt or outdated storage -> reseed fresh
  }
  const fresh = seedFinanceState()
  saveFinanceState(orgId, fresh)
  return fresh
}

export function saveFinanceState(orgId: string, state: FinanceState) {
  try {
    localStorage.setItem(storageKey(orgId), JSON.stringify({ version: FINANCE_VERSION, state }))
  } catch {
    return
  }
}

function nextInvoiceNumber(invoices: Invoice[]): string {
  const nums = invoices
    .map(inv => parseInt(inv.number.replace(/^INV-\d{4}-/, ''), 10))
    .filter(n => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `INV-${new Date().getFullYear()}-${String(next).padStart(4, '0')}`
}

export function createInvoice(orgId: string, input: InvoiceInput): Invoice {
  const state = loadFinanceState(orgId)
  const amount = Math.round(input.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) * 100) / 100
  const invoice: Invoice = {
    id: `INV-${String(state.invoices.length + 1).padStart(4, '0')}`,
    number: nextInvoiceNumber(state.invoices),
    customer: input.customer.trim(),
    issuedAt: new Date().toISOString().slice(0, 10),
    dueAt: input.dueAt || daysFromNow(14),
    amount,
    status: 'draft',
    items: input.items.map(item => ({ ...item })),
  }
  state.invoices.push(invoice)
  saveFinanceState(orgId, state)
  return invoice
}

export function setInvoiceStatus(orgId: string, invoiceId: string, status: InvoiceStatus): Invoice {
  const state = loadFinanceState(orgId)
  const invoice = state.invoices.find(inv => inv.id === invoiceId)
  if (!invoice) throw new Error('Invoice not found')
  invoice.status = status
  saveFinanceState(orgId, state)
  return invoice
}

function unpaidInvoiceAmount(invoices: Invoice[]): number {
  return invoices
    .filter(inv => inv.status === 'draft' || inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0)
}

function unpaidTaxAmount(taxes: TaxItem[]): number {
  return taxes.reduce((sum, tax) => sum + Math.max(0, Math.round(tax.basis * tax.rate) / 100 - tax.paid), 0)
}

export function buildBalanceSheet(state: FinanceState): BalanceSheet {
  const assets = [
    { label: 'Cash & Bank', value: 148500 },
    { label: 'Accounts Receivable', value: Math.round(unpaidInvoiceAmount(state.invoices) * 100) / 100 },
    { label: 'Inventory', value: 58200 },
    { label: 'Equipment', value: 45000 },
  ]
  const liabilities = [
    { label: 'Accounts Payable', value: 21800 },
    { label: 'Tax Payable', value: Math.round(unpaidTaxAmount(state.taxes) * 100) / 100 },
    { label: 'Bank Loan', value: 40000 },
  ]
  const totalAssets = assets.reduce((sum, line) => sum + line.value, 0)
  const totalLiabilities = liabilities.reduce((sum, line) => sum + line.value, 0)
  const retainedEarnings = Math.round((totalAssets - totalLiabilities - 120000) * 100) / 100
  const equity = [
    { label: 'Owner\u2019s Capital', value: 120000 },
    { label: 'Retained Earnings', value: retainedEarnings },
  ]
  return {
    assets,
    liabilities,
    equity,
    updatedAt: new Date().toISOString(),
  }
}
