import { beforeEach, describe, expect, it } from 'vitest'
import {
  buildBalanceSheet,
  createInvoice,
  loadFinanceState,
  saveFinanceState,
  setInvoiceStatus,
  type InvoiceInput,
} from '@/data/finance'

const ORG = 'ORG-001'
const KEY = 'merchant_org_finance_ORG-001'

describe('finance (mock data layer)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seeds a fresh finance state per org', () => {
    const state = loadFinanceState(ORG)
    expect(state.ledger).toHaveLength(18)
    expect(state.invoices).toHaveLength(5)
    expect(state.taxes).toHaveLength(4)
    expect(localStorage.getItem(KEY)).not.toBeNull()
  })

  it('keeps finance data scoped per organisation', () => {
    loadFinanceState('ORG-001')
    expect(localStorage.getItem('merchant_org_finance_ORG-001')).not.toBeNull()
    expect(localStorage.getItem('merchant_org_finance_ORG-999')).toBeNull()
  })

  it('loads persisted state when the version matches', () => {
    const state = loadFinanceState(ORG)
    state.ledger = []
    saveFinanceState(ORG, state)
    expect(loadFinanceState(ORG).ledger).toEqual([])
  })

  it('reseeds when stored state is corrupt', () => {
    localStorage.setItem(KEY, 'not-json')
    expect(loadFinanceState(ORG).invoices).toHaveLength(5)
  })

  describe('createInvoice', () => {
    it('computes the amount, assigns ids and defaults the due date', () => {
      const input: InvoiceInput = {
        customer: '  Adom Bakery  ',
        dueAt: '',
        items: [
          { description: 'Flour (50kg)', qty: 2, unitPrice: 49.99 },
          { description: 'Oil (20L)', qty: 3, unitPrice: 60 },
        ],
      }
      const inv = createInvoice(ORG, input)
      expect(inv.amount).toBe(279.98)
      expect(inv.id).toBe('INV-0006')
      expect(inv.number).toBe(`INV-${new Date().getFullYear()}-0106`)
      expect(inv.status).toBe('draft')
      expect(inv.customer).toBe('Adom Bakery')
      expect(inv.dueAt).not.toBe('')
      expect(inv.issuedAt).toBe(new Date().toISOString().slice(0, 10))
      expect(loadFinanceState(ORG).invoices).toHaveLength(6)
    })

    it('supports empty line items (amount 0)', () => {
      const inv = createInvoice(ORG, { customer: 'X', dueAt: '', items: [] })
      expect(inv.amount).toBe(0)
    })

    it('honours an explicit due date', () => {
      const inv = createInvoice(ORG, { customer: 'X', dueAt: '2030-01-01', items: [{ description: 'a', qty: 1, unitPrice: 10 }] })
      expect(inv.dueAt).toBe('2030-01-01')
    })
  })

  describe('setInvoiceStatus', () => {
    it('updates the status and persists', () => {
      const inv = setInvoiceStatus(ORG, 'INV-0001', 'paid')
      expect(inv.status).toBe('paid')
      expect(loadFinanceState(ORG).invoices.find(i => i.id === 'INV-0001')?.status).toBe('paid')
    })

    it('throws for unknown invoices', () => {
      expect(() => setInvoiceStatus(ORG, 'INV-9999', 'void')).toThrow('Invoice not found')
    })
  })

  describe('buildBalanceSheet', () => {
    it('derives receivable and tax payable from the seed', () => {
      const sheet = buildBalanceSheet(loadFinanceState(ORG))
      const receivable = sheet.assets.find(a => a.label === 'Accounts Receivable')
      const taxPayable = sheet.liabilities.find(l => l.label === 'Tax Payable')
      expect(receivable?.value).toBe(10025)
      expect(taxPayable?.value).toBe(26160)
    })

    it('balances: assets = liabilities + equity', () => {
      const sheet = buildBalanceSheet(loadFinanceState(ORG))
      const assets = sheet.assets.reduce((sum, l) => sum + l.value, 0)
      const liabilities = sheet.liabilities.reduce((sum, l) => sum + l.value, 0)
      const equity = sheet.equity.reduce((sum, l) => sum + l.value, 0)
      expect(assets).toBe(liabilities + equity)
      expect(sheet.equity.find(l => l.label === 'Retained Earnings')?.value).toBe(53765)
    })

    it('reacts to invoice payments (receivables drop)', () => {
      setInvoiceStatus(ORG, 'INV-0001', 'paid')
      const sheet = buildBalanceSheet(loadFinanceState(ORG))
      expect(sheet.assets.find(a => a.label === 'Accounts Receivable')?.value).toBe(5175)

      const assets = sheet.assets.reduce((sum, l) => sum + l.value, 0)
      const liabilities = sheet.liabilities.reduce((sum, l) => sum + l.value, 0)
      const equity = sheet.equity.reduce((sum, l) => sum + l.value, 0)
      expect(assets).toBe(liabilities + equity)
    })
  })
})
