import { beforeEach, describe, expect, it } from 'vitest'
import {
  checkoutOrg,
  createOrgCreditEntry,
  createOrgCustomer,
  createOrgProduct,
  deleteOrgCustomer,
  deleteOrgProduct,
  getOrgCreditEntries,
  getOrgCustomers,
  getOrgPosTransactions,
  getOrgProducts,
  loadCommerceState,
  saveCommerceState,
  updateOrgCreditEntry,
  updateOrgCustomer,
  updateOrgProduct,
} from '@/data/orgCommerce'

const ORG = 'ORG-001'
const KEY = 'merchant_org_commerce_ORG-001'

describe('orgCommerce (mock data layer)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seeds a fresh commerce state per org', () => {
    const state = loadCommerceState(ORG)
    expect(state.products).toHaveLength(48)
    expect(state.customers).toHaveLength(5)
    expect(state.creditEntries).toHaveLength(4)
    expect(state.transactions.length).toBeGreaterThan(0)
    expect(localStorage.getItem(KEY)).not.toBeNull()
  })

  it('keeps commerce data scoped per organisation', () => {
    loadCommerceState('ORG-001')
    expect(localStorage.getItem('merchant_org_commerce_ORG-001')).not.toBeNull()
    expect(localStorage.getItem('merchant_org_commerce_ORG-999')).toBeNull()
  })

  it('loads persisted state when the version matches', () => {
    const state = loadCommerceState(ORG)
    state.products = []
    saveCommerceState(ORG, state)
    expect(loadCommerceState(ORG).products).toEqual([])
  })

  it('reseeds when stored state is corrupt', () => {
    localStorage.setItem(KEY, 'not-json')
    expect(loadCommerceState(ORG).products).toHaveLength(48)
  })

  describe('products', () => {
    it('seeds values consistent with the dashboard and finance (58,200 total, 3 low, 1 out)', () => {
      const products = getOrgProducts(ORG)
      expect(products).toHaveLength(48)
      const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)
      expect(totalValue).toBe(58200)
      expect(products.filter(p => p.status === 'low-stock')).toHaveLength(3)
      expect(products.filter(p => p.status === 'out-of-stock')).toHaveLength(1)
    })

    it('normalises status from stock on read', () => {
      const products = getOrgProducts(ORG)
      for (const product of products) {
        const expected = product.stock <= 0 ? 'out-of-stock' : product.stock <= 20 ? 'low-stock' : 'in-stock'
        expect(product.status).toBe(expected)
      }
    })

    it('creates a product with the next id and defaults', () => {
      const created = createOrgProduct(ORG, { name: '  New Snack  ', sku: 'NEW-001', price: 5, stock: 0, category: '  Snacks  ' })
      expect(created.id).toBe('PRD-049')
      expect(created.name).toBe('New Snack')
      expect(created.category).toBe('Snacks')
      expect(created.status).toBe('out-of-stock')
      expect(getOrgProducts(ORG)).toHaveLength(49)
    })

    it('persists the product image and initial rating', () => {
      const created = createOrgProduct(ORG, { name: 'New Snack', sku: 'NEW-001', price: 5, stock: 0, category: 'Snacks', image: '  https://img/x.png  ', rating: 4.5 })
      expect(created.image).toBe('https://img/x.png')
      expect(created.rating).toBe(4.5)
      const stored = getOrgProducts(ORG).find(p => p.id === created.id)
      expect(stored?.image).toBe('https://img/x.png')
      expect(stored?.rating).toBe(4.5)
    })

    it('keeps the image and rating when updating unrelated fields', () => {
      const created = createOrgProduct(ORG, { name: 'New Snack', sku: 'NEW-001', price: 5, stock: 0, category: 'Snacks', image: 'https://img/x.png', rating: 3 })
      updateOrgProduct(ORG, created.id, { stock: 10 })
      const stored = getOrgProducts(ORG).find(p => p.id === created.id)
      expect(stored?.image).toBe('https://img/x.png')
      expect(stored?.rating).toBe(3)
    })

    it('recomputes status and throws for unknown products on update', () => {
      const product = updateOrgProduct(ORG, 'PRD-001', { stock: 0 })
      expect(product.status).toBe('out-of-stock')
      expect(getOrgProducts(ORG).find(p => p.id === 'PRD-001')?.status).toBe('out-of-stock')
      expect(() => updateOrgProduct(ORG, 'PRD-999', { stock: 5 })).toThrow('Product not found')
    })

    it('deletes a product', () => {
      deleteOrgProduct(ORG, 'PRD-001')
      expect(getOrgProducts(ORG).find(p => p.id === 'PRD-001')).toBeUndefined()
    })
  })

  describe('customers', () => {
    it('creates a customer with defaults', () => {
      const customer = createOrgCustomer(ORG, { name: 'New Buyer', email: 'buyer@example.com', credit_limit: 2500 })
      expect(customer.id).toBe('CUS-006')
      expect(customer.tier).toBe('bronze')
      expect(customer.total_spent).toBe(0)
      expect(customer.last_purchase).toBe('')
      expect(getOrgCustomers(ORG)).toHaveLength(6)
    })

    it('updates and deletes customers', () => {
      const customer = updateOrgCustomer(ORG, 'CUS-001', { credit_limit: 15000 })
      expect(customer.credit_limit).toBe(15000)
      expect(getOrgCustomers(ORG).find(c => c.id === 'CUS-001')?.credit_limit).toBe(15000)
      expect(() => updateOrgCustomer(ORG, 'CUS-999', { name: 'x' })).toThrow('Customer not found')

      deleteOrgCustomer(ORG, 'CUS-005')
      expect(getOrgCustomers(ORG).find(c => c.id === 'CUS-005')).toBeUndefined()
    })
  })

  describe('credit', () => {
    it('seeds credit balances that sum to the finance receivables (10,025)', () => {
      const entries = getOrgCreditEntries(ORG)
      expect(entries.reduce((sum, e) => sum + e.balance, 0)).toBe(10025)
    })

    it('creates a credit entry with a fallback customer code', () => {
      const entry = createOrgCreditEntry(ORG, { customer_id: 'CUS-001', customer_name: 'Adom Fresh Foods', balance: 250 })
      expect(entry.id).toBe('CRD-005')
      expect(entry.customer_code).toBe('CUS-001')
      expect(entry.status).toBe('active')
    })

    it('updates a credit entry and throws for unknown ids', () => {
      const entry = updateOrgCreditEntry(ORG, 'CRD-001', { balance: 0, status: 'active' })
      expect(entry.balance).toBe(0)
      expect(getOrgCreditEntries(ORG).find(e => e.id === 'CRD-001')?.balance).toBe(0)
      expect(() => updateOrgCreditEntry(ORG, 'CRD-999', { balance: 0 })).toThrow('Credit entry not found')
    })
  })

  describe('POS', () => {
    it('records a checkout, decrements stock and prepends the transaction', () => {
      const before = getOrgProducts(ORG).find(p => p.id === 'PRD-007')?.stock
      const txn = checkoutOrg(ORG, {
        items: [{ id: 'PRD-007', name: 'Bama Rice 5kg', price: 60, quantity: 2 }],
        total: 126,
        payment_method: 'Cash',
      })
      expect(txn.type).toBe('sale')
      expect(txn.amount).toBe(126)
      expect(txn.items).toBe('2 items')
      expect(getOrgProducts(ORG).find(p => p.id === 'PRD-007')?.stock).toBe((before ?? 0) - 2)
      expect(getOrgPosTransactions(ORG)[0].id).toBe(txn.id)
    })
  })
})
