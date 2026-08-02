import { beforeEach, describe, expect, it } from 'vitest'
import {
  autoGeneratePurchaseOrders,
  createOrgPurchaseOrder,
  createOrgShipment,
  createOrgSupplier,
  deleteOrgPurchaseOrder,
  deleteOrgSupplier,
  getOrgPurchaseOrders,
  getOrgShipments,
  getOrgSuppliers,
  loadOrgSupplyState,
  setOrgPurchaseOrderStatus,
  setOrgShipmentStatus,
  suggestRestockProducts,
  updateOrgSupplier,
} from '@/data/orgSupply'
import { getOrgProducts, loadCommerceState, saveCommerceState } from '@/data/orgCommerce'

const ORG = 'ORG-001'
const KEY = 'merchant_org_supply_ORG-001'

describe('orgSupply (mock data layer)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seeds a fresh supply chain state per org', () => {
    const state = loadOrgSupplyState(ORG)
    expect(state.suppliers).toHaveLength(6)
    expect(state.purchaseOrders).toHaveLength(3)
    expect(state.shipments).toHaveLength(2)
    expect(localStorage.getItem(KEY)).not.toBeNull()
  })

  it('keeps supply data scoped per organisation', () => {
    loadOrgSupplyState('ORG-001')
    expect(localStorage.getItem('merchant_org_supply_ORG-001')).not.toBeNull()
    expect(localStorage.getItem('merchant_org_supply_ORG-999')).toBeNull()
  })

  describe('suppliers', () => {
    it('creates, updates and deletes suppliers', () => {
      const created = createOrgSupplier(ORG, {
        name: 'Fresh Farms',
        email: 'sales@freshfarms.example',
        categories: ['Dairy & Eggs'],
      })
      expect(created.id).toBe('SUP-007')
      expect(created.status).toBe('active')

      const updated = updateOrgSupplier(ORG, created.id, { status: 'inactive', payment_terms: 'COD' })
      expect(updated.status).toBe('inactive')
      expect(updated.payment_terms).toBe('COD')

      expect(() => updateOrgSupplier(ORG, 'SUP-999', { name: 'x' })).toThrow('Supplier not found')

      deleteOrgSupplier(ORG, created.id)
      expect(getOrgSuppliers(ORG).find(s => s.id === created.id)).toBeUndefined()
    })
  })

  describe('purchase orders', () => {
    it('creates a draft PO with a running PO number and correct total', () => {
      const po = createOrgPurchaseOrder(ORG, {
        supplier_id: 'SUP-001',
        items: [{ product_id: 'PRD-001', qty: 5 }],
      })
      expect(po.po_number).toBe('PO-2026-004')
      expect(po.status).toBe('draft')
      expect(po.total).toBe(20)
      expect(po.items[0].product_name).toBe('Coca-Cola 500ml')
    })

    it('can create a PO directly as pending', () => {
      const po = createOrgPurchaseOrder(ORG, {
        supplier_id: 'SUP-001',
        items: [{ product_id: 'PRD-001', qty: 5 }],
      }, 'pending')
      expect(po.status).toBe('pending')
    })

    it('rejects unknown suppliers, unknown products and empty orders', () => {
      expect(() => createOrgPurchaseOrder(ORG, { supplier_id: 'SUP-999', items: [{ product_id: 'PRD-001', qty: 1 }] }))
        .toThrow('Supplier not found')
      expect(() => createOrgPurchaseOrder(ORG, { supplier_id: 'SUP-001', items: [{ product_id: 'PRD-999', qty: 1 }] }))
        .toThrow('Product not found')
      expect(() => createOrgPurchaseOrder(ORG, { supplier_id: 'SUP-001', items: [] }))
        .toThrow('A purchase order needs at least one item')
    })

    it('walks the status flow and restocks inventory on receive', () => {
      const before = getOrgProducts(ORG).find(p => p.id === 'PRD-001')!
      const po = createOrgPurchaseOrder(ORG, {
        supplier_id: 'SUP-001',
        items: [{ product_id: 'PRD-001', qty: 5 }],
      }, 'pending')

      setOrgPurchaseOrderStatus(ORG, po.id, 'approved')
      expect(getOrgPurchaseOrders(ORG).find(p => p.id === po.id)!.status).toBe('approved')
      expect(getOrgProducts(ORG).find(p => p.id === 'PRD-001')!.stock).toBe(before.stock)

      setOrgPurchaseOrderStatus(ORG, po.id, 'received')
      const received = getOrgPurchaseOrders(ORG).find(p => p.id === po.id)!
      expect(received.status).toBe('received')
      expect(received.received_at).not.toBe('')
      expect(getOrgProducts(ORG).find(p => p.id === 'PRD-001')!.stock).toBe(before.stock + 5)
    })

    it('rejects invalid status transitions', () => {
      const po = createOrgPurchaseOrder(ORG, {
        supplier_id: 'SUP-001',
        items: [{ product_id: 'PRD-001', qty: 1 }],
      })
      expect(() => setOrgPurchaseOrderStatus(ORG, po.id, 'received')).toThrow('Invalid purchase order status transition')
    })

    it('only lets draft or cancelled POs be deleted', () => {
      const draft = createOrgPurchaseOrder(ORG, { supplier_id: 'SUP-001', items: [{ product_id: 'PRD-001', qty: 1 }] })
      deleteOrgPurchaseOrder(ORG, draft.id)
      expect(getOrgPurchaseOrders(ORG).find(p => p.id === draft.id)).toBeUndefined()

      const pending = createOrgPurchaseOrder(ORG, { supplier_id: 'SUP-001', items: [{ product_id: 'PRD-001', qty: 1 }] }, 'pending')
      expect(() => deleteOrgPurchaseOrder(ORG, pending.id)).toThrow('Only draft or cancelled purchase orders can be deleted')

      setOrgPurchaseOrderStatus(ORG, pending.id, 'cancelled')
      deleteOrgPurchaseOrder(ORG, pending.id)
      expect(getOrgPurchaseOrders(ORG).find(p => p.id === pending.id)).toBeUndefined()
    })
  })

  describe('restock automation', () => {
    it('suggests low-stock and out-of-stock products', () => {
      const suggested = suggestRestockProducts(ORG)
      expect(suggested.length).toBe(4)
      expect(suggested.every(p => p.status === 'low-stock' || p.status === 'out-of-stock')).toBe(true)
    })

    it('auto-generates pending POs grouped by supplier category coverage', () => {
      const created = autoGeneratePurchaseOrders(ORG)
      expect(created.length).toBeGreaterThan(0)
      for (const po of created) {
        expect(po.status).toBe('pending')
        expect(po.items.every(i => i.qty === 40)).toBe(true)
      }
      const snackPo = created.find(po => po.supplier_name === 'Snacks & Treats Ltd')
      expect(snackPo).toBeTruthy()
      expect(snackPo!.items.length).toBe(2)
    })

    it('returns nothing when inventory is fully stocked', () => {
      const commerce = loadCommerceState(ORG)
      for (const product of commerce.products) product.stock = 500
      saveCommerceState(ORG, commerce)
      expect(autoGeneratePurchaseOrders(ORG)).toEqual([])
    })
  })

  describe('shipments', () => {
    it('creates an in-transit shipment against a shippable PO', () => {
      const po = createOrgPurchaseOrder(ORG, { supplier_id: 'SUP-001', items: [{ product_id: 'PRD-001', qty: 5 }] }, 'pending')
      const shipment = createOrgShipment(ORG, { po_id: po.id, carrier: 'Express Cargo', eta: '' })
      expect(shipment.status).toBe('in-transit')
      expect(shipment.tracking_number).toBe('TRK-003')
      expect(shipment.po_number).toBe(po.po_number)
      expect(shipment.carrier).toBe('Express Cargo')
    })

    it('rejects shipping a finalised purchase order', () => {
      const received = getOrgPurchaseOrders(ORG).find(p => p.status === 'received')!
      expect(() => createOrgShipment(ORG, { po_id: received.id, carrier: 'x', eta: '' }))
        .toThrow('Cannot ship a finalised purchase order')
    })

    it('delivering a shipment receives its PO and restocks inventory', () => {
      const before = getOrgProducts(ORG).find(p => p.id === 'PRD-001')!.stock
      const po = createOrgPurchaseOrder(ORG, { supplier_id: 'SUP-001', items: [{ product_id: 'PRD-001', qty: 10 }] }, 'approved')
      const shipment = createOrgShipment(ORG, { po_id: po.id, carrier: 'Swift', eta: '' })

      setOrgShipmentStatus(ORG, shipment.id, 'delayed')
      expect(getOrgShipments(ORG).find(s => s.id === shipment.id)!.status).toBe('delayed')
      expect(getOrgProducts(ORG).find(p => p.id === 'PRD-001')!.stock).toBe(before)

      setOrgShipmentStatus(ORG, shipment.id, 'delivered')
      const delivered = getOrgShipments(ORG).find(s => s.id === shipment.id)!
      expect(delivered.status).toBe('delivered')
      expect(delivered.delivered_at).not.toBe('')
      expect(getOrgPurchaseOrders(ORG).find(p => p.id === po.id)!.status).toBe('received')
      expect(getOrgProducts(ORG).find(p => p.id === 'PRD-001')!.stock).toBe(before + 10)
    })

    it('rejects invalid shipment status transitions', () => {
      const po = createOrgPurchaseOrder(ORG, { supplier_id: 'SUP-001', items: [{ product_id: 'PRD-001', qty: 1 }] }, 'pending')
      const shipment = createOrgShipment(ORG, { po_id: po.id, carrier: 'Swift', eta: '' })
      expect(() => setOrgShipmentStatus(ORG, shipment.id, 'delivered')).not.toThrow()
      expect(() => setOrgShipmentStatus(ORG, shipment.id, 'delayed')).toThrow('Invalid shipment status transition')
    })
  })
})
