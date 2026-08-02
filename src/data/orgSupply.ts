import { getOrgProducts, loadCommerceState, saveCommerceState } from './orgCommerce'
import type { OrgProduct } from './orgCommerce'

// Mock Supply Chain & Logistics data for ORGANISATION workspaces: suppliers, purchase
// orders and shipping logistics.
//
// Like the other org mocks, everything lives in localStorage behind the promise-based
// `api.org.supply.*` calls so a real backend can be swapped in later. Data is scoped per
// organisation (`merchant_org_supply_{orgId}`) and versioned.
//
// Product creation / editing / deletion in inventory is restricted to the head of the
// Supply Chain department (`logistics-manager`) and the Super Admin — enforced by the
// API layer, not here. Receiving a purchase order (or delivering a shipment linked to it)
// restocks the products through the shared Commerce mock so POS/inventory stay consistent.
//
// The seed is consistent with the Commerce mock: suppliers map to the product categories,
// and the open purchase orders cover the seeded low-stock / out-of-stock items.

export type OrgSupplierStatus = 'active' | 'inactive'

export interface OrgSupplier {
  id: string
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  categories: string[] // product categories this supplier provides
  payment_terms: string
  status: OrgSupplierStatus
  created_at: string
}

export interface OrgSupplierInput {
  name: string
  contact_person?: string
  email: string
  phone?: string
  address?: string
  categories: string[]
  payment_terms?: string
  status?: OrgSupplierStatus
}

export type OrgPoStatus = 'draft' | 'pending' | 'approved' | 'received' | 'cancelled'

export interface OrgPurchaseOrderItem {
  product_id: string
  product_name: string
  qty: number
  unit_price: number
}

export interface OrgPurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  items: OrgPurchaseOrderItem[]
  total: number
  status: OrgPoStatus
  ordered_at: string
  received_at: string
}

export interface OrgPurchaseOrderInput {
  supplier_id: string
  items: { product_id: string; qty: number }[]
}

export type OrgShipmentStatus = 'in-transit' | 'delivered' | 'delayed' | 'cancelled'

export interface OrgShipment {
  id: string
  tracking_number: string
  po_id: string
  po_number: string
  supplier_name: string
  carrier: string
  status: OrgShipmentStatus
  eta: string
  created_at: string
  delivered_at: string
}

export interface OrgShipmentInput {
  po_id: string
  carrier: string
  eta: string
}

export interface OrgSupplyState {
  suppliers: OrgSupplier[]
  purchaseOrders: OrgPurchaseOrder[]
  shipments: OrgShipment[]
}

const SUPPLY_KEY_PREFIX = 'merchant_org_supply_'
const SUPPLY_VERSION = 1
const RESTOCK_QTY = 40

function storageKey(orgId: string) {
  return `${SUPPLY_KEY_PREFIX}${orgId}`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number): string {
  return daysAgo(-n)
}

function seedSupplyState(): OrgSupplyState {
  return {
    suppliers: [
      { id: 'SUP-001', name: 'Sunrise Distributors', contact_person: 'Ama Owusu', email: 'orders@sunrise-dist.example', phone: '+1 555 010 3101', address: '12 Industrial Ave, Accra', categories: ['Beverages'], payment_terms: 'Net 30', status: 'active', created_at: daysAgo(300) },
      { id: 'SUP-002', name: 'Golden Grains Co.', contact_person: 'Kofi Darko', email: 'sales@goldengrains.example', phone: '+1 555 010 3102', address: '8 Market Road, Kumasi', categories: ['Grains & Flour'], payment_terms: 'Net 30', status: 'active', created_at: daysAgo(280) },
      { id: 'SUP-003', name: 'Essential Foods Ltd', contact_person: 'Yaa Boahene', email: 'orders@essentialfoods.example', phone: '+1 555 010 3103', address: '44 Depot Street, Tema', categories: ['Cooking Essentials'], payment_terms: 'Net 15', status: 'active', created_at: daysAgo(250) },
      { id: 'SUP-004', name: 'Snacks & Treats Ltd', contact_person: 'Kojo Mensah', email: 'hello@snackstreats.example', phone: '+1 555 010 3104', address: '20 Factory Lane, Tema', categories: ['Snacks'], payment_terms: 'COD', status: 'active', created_at: daysAgo(220) },
      { id: 'SUP-005', name: 'Fresh Dairy Supplies', contact_person: 'Abena Frimpong', email: 'supply@freshdairy.example', phone: '+1 555 010 3105', address: '3 Cold Storage Rd, Accra', categories: ['Dairy & Eggs'], payment_terms: 'Net 30', status: 'active', created_at: daysAgo(200) },
      { id: 'SUP-006', name: 'Home & Care Wholesale', contact_person: 'Kwabena Osei', email: 'orders@homecare.example', phone: '+1 555 010 3106', address: '77 Bulk Row, Takoradi', categories: ['Household', 'Personal Care'], payment_terms: 'Net 45', status: 'active', created_at: daysAgo(180) },
    ],
    purchaseOrders: [
      {
        id: 'PO-001', po_number: 'PO-2026-001', supplier_id: 'SUP-001', supplier_name: 'Sunrise Distributors',
        items: [{ product_id: 'PRD-001', product_name: 'Coca-Cola 500ml', qty: 50, unit_price: 4 }],
        total: 200, status: 'received', ordered_at: daysAgo(10), received_at: daysAgo(9),
      },
      {
        id: 'PO-002', po_number: 'PO-2026-002', supplier_id: 'SUP-003', supplier_name: 'Essential Foods Ltd',
        items: [{ product_id: 'PRD-018', product_name: 'Sugar 50kg', qty: 20, unit_price: 300 }],
        total: 6000, status: 'received', ordered_at: daysAgo(3), received_at: daysAgo(2),
      },
      {
        id: 'PO-003', po_number: 'PO-2026-003', supplier_id: 'SUP-004', supplier_name: 'Snacks & Treats Ltd',
        items: [{ product_id: 'PRD-032', product_name: 'Fruit Cake Slice', qty: 20, unit_price: 7 }],
        total: 140, status: 'pending', ordered_at: daysAgo(1), received_at: '',
      },
    ],
    shipments: [
      { id: 'SHP-001', tracking_number: 'TRK-001', po_id: 'PO-003', po_number: 'PO-2026-003', supplier_name: 'Snacks & Treats Ltd', carrier: 'Express Cargo', status: 'in-transit', eta: daysFromNow(2), created_at: daysAgo(0.25), delivered_at: '' },
      { id: 'SHP-002', tracking_number: 'TRK-002', po_id: 'PO-002', po_number: 'PO-2026-002', supplier_name: 'Essential Foods Ltd', carrier: 'Swift Logistics', status: 'delivered', eta: daysAgo(1), created_at: daysAgo(3), delivered_at: daysAgo(2) },
    ],
  }
}

export function loadOrgSupplyState(orgId: string): OrgSupplyState {
  const key = storageKey(orgId)
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as { version: number; state: OrgSupplyState }
      if (parsed && parsed.version === SUPPLY_VERSION && parsed.state) return parsed.state
    }
  } catch {
    // corrupt or outdated storage -> reseed fresh
  }
  const fresh = seedSupplyState()
  saveOrgSupplyState(orgId, fresh)
  return fresh
}

export function saveOrgSupplyState(orgId: string, state: OrgSupplyState) {
  try {
    localStorage.setItem(storageKey(orgId), JSON.stringify({ version: SUPPLY_VERSION, state }))
  } catch {
    return
  }
}

function nextId(ids: string[], prefix: string): string {
  const nums = ids
    .filter(id => id.startsWith(`${prefix}-`))
    .map(id => parseInt(id.replace(`${prefix}-`, ''), 10))
    .filter(n => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

function nextPoNumber(orders: OrgPurchaseOrder[]): string {
  const year = new Date().getFullYear()
  const nums = orders
    .map(o => {
      const match = o.po_number.match(/^PO-(\d{4})-(\d{3})$/)
      return match && Number(match[1]) === year ? Number(match[2]) : 0
    })
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `PO-${year}-${String(next).padStart(3, '0')}`
}

// ---- Suppliers -------------------------------------------------------------

export function getOrgSuppliers(orgId: string): OrgSupplier[] {
  return loadOrgSupplyState(orgId).suppliers
}

export function createOrgSupplier(orgId: string, input: OrgSupplierInput): OrgSupplier {
  const state = loadOrgSupplyState(orgId)
  const supplier: OrgSupplier = {
    id: nextId(state.suppliers.map(s => s.id), 'SUP'),
    name: input.name.trim(),
    contact_person: input.contact_person?.trim() ?? '',
    email: input.email.trim(),
    phone: input.phone?.trim() ?? '',
    address: input.address?.trim() ?? '',
    categories: input.categories,
    payment_terms: input.payment_terms?.trim() || 'Net 30',
    status: input.status ?? 'active',
    created_at: new Date().toISOString(),
  }
  state.suppliers.push(supplier)
  saveOrgSupplyState(orgId, state)
  return supplier
}

export function updateOrgSupplier(orgId: string, supplierId: string, patch: Partial<OrgSupplierInput>): OrgSupplier {
  const state = loadOrgSupplyState(orgId)
  const supplier = state.suppliers.find(s => s.id === supplierId)
  if (!supplier) throw new Error('Supplier not found')
  Object.assign(supplier, patch)
  if (patch.name !== undefined) supplier.name = patch.name.trim()
  if (patch.email !== undefined) supplier.email = patch.email.trim()
  saveOrgSupplyState(orgId, state)
  return supplier
}

export function deleteOrgSupplier(orgId: string, supplierId: string) {
  const state = loadOrgSupplyState(orgId)
  state.suppliers = state.suppliers.filter(s => s.id !== supplierId)
  saveOrgSupplyState(orgId, state)
}

// ---- Purchase orders -------------------------------------------------------

export function getOrgPurchaseOrders(orgId: string): OrgPurchaseOrder[] {
  return loadOrgSupplyState(orgId).purchaseOrders
}

export function createOrgPurchaseOrder(
  orgId: string,
  input: OrgPurchaseOrderInput,
  status: OrgPoStatus = 'draft',
): OrgPurchaseOrder {
  const state = loadOrgSupplyState(orgId)
  const supplier = state.suppliers.find(s => s.id === input.supplier_id)
  if (!supplier) throw new Error('Supplier not found')

  const products = getOrgProducts(orgId)
  const items = input.items
    .map(line => {
      const product = products.find(p => p.id === line.product_id)
      if (!product) throw new Error('Product not found')
      return {
        product_id: product.id,
        product_name: product.name,
        qty: Math.max(1, Math.round(line.qty) || 0),
        unit_price: product.price,
      }
    })
    .filter(line => line.qty > 0)

  if (items.length === 0) throw new Error('A purchase order needs at least one item')

  const po: OrgPurchaseOrder = {
    id: nextId(state.purchaseOrders.map(p => p.id), 'PO'),
    po_number: nextPoNumber(state.purchaseOrders),
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    items,
    total: items.reduce((sum, item) => sum + item.qty * item.unit_price, 0),
    status,
    ordered_at: new Date().toISOString(),
    received_at: '',
  }
  state.purchaseOrders.push(po)
  saveOrgSupplyState(orgId, state)
  return po
}

const PO_TRANSITIONS: Record<OrgPoStatus, OrgPoStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'cancelled'],
  approved: ['received', 'cancelled'],
  received: [],
  cancelled: [],
}

function receivePurchaseOrder(orgId: string, po: OrgPurchaseOrder) {
  const commerce = loadCommerceState(orgId)
  for (const item of po.items) {
    const product = commerce.products.find(p => p.id === item.product_id)
    if (product) product.stock += item.qty
  }
  saveCommerceState(orgId, commerce)
  po.status = 'received'
  po.received_at = new Date().toISOString()
}

export function setOrgPurchaseOrderStatus(orgId: string, poId: string, status: OrgPoStatus): OrgPurchaseOrder {
  const state = loadOrgSupplyState(orgId)
  const po = state.purchaseOrders.find(p => p.id === poId)
  if (!po) throw new Error('Purchase order not found')
  if (!PO_TRANSITIONS[po.status].includes(status)) {
    throw new Error('Invalid purchase order status transition')
  }
  if (status === 'received') {
    receivePurchaseOrder(orgId, po)
  } else {
    po.status = status
  }
  saveOrgSupplyState(orgId, state)
  return po
}

export function deleteOrgPurchaseOrder(orgId: string, poId: string) {
  const state = loadOrgSupplyState(orgId)
  const po = state.purchaseOrders.find(p => p.id === poId)
  if (!po) throw new Error('Purchase order not found')
  if (po.status !== 'draft' && po.status !== 'cancelled') {
    throw new Error('Only draft or cancelled purchase orders can be deleted')
  }
  state.purchaseOrders = state.purchaseOrders.filter(p => p.id !== poId)
  saveOrgSupplyState(orgId, state)
}

// Purchase order automation: scan the inventory for low/out-of-stock products and raise
// a pending PO against the first active supplier that covers each product's category.
export function suggestRestockProducts(orgId: string): OrgProduct[] {
  return getOrgProducts(orgId).filter(p => p.status === 'low-stock' || p.status === 'out-of-stock')
}

export function autoGeneratePurchaseOrders(orgId: string, supplierId?: string): OrgPurchaseOrder[] {
  const state = loadOrgSupplyState(orgId)
  const lowProducts = suggestRestockProducts(orgId)
  if (lowProducts.length === 0) return []

  const suppliers = state.suppliers.filter(s => s.status === 'active' && (!supplierId || s.id === supplierId))
  const bySupplier = new Map<string, OrgProduct[]>()
  for (const product of lowProducts) {
    const supplier = suppliers.find(s => s.categories.includes(product.category))
    if (!supplier) continue
    const list = bySupplier.get(supplier.id) ?? []
    list.push(product)
    bySupplier.set(supplier.id, list)
  }

  const created: OrgPurchaseOrder[] = []
  for (const [supplierIdKey, products] of bySupplier) {
    const supplier = suppliers.find(s => s.id === supplierIdKey)!
    const po = createOrgPurchaseOrder(orgId, {
      supplier_id: supplier.id,
      items: products.map(p => ({ product_id: p.id, qty: RESTOCK_QTY })),
    }, 'pending')
    created.push(po)
  }
  return created
}

// ---- Shipments -------------------------------------------------------------

export function getOrgShipments(orgId: string): OrgShipment[] {
  return loadOrgSupplyState(orgId).shipments
}

export function createOrgShipment(orgId: string, input: OrgShipmentInput): OrgShipment {
  const state = loadOrgSupplyState(orgId)
  const po = state.purchaseOrders.find(p => p.id === input.po_id)
  if (!po) throw new Error('Purchase order not found')
  if (po.status === 'received' || po.status === 'cancelled') {
    throw new Error('Cannot ship a finalised purchase order')
  }
  const shipment: OrgShipment = {
    id: nextId(state.shipments.map(s => s.id), 'SHP'),
    tracking_number: nextId(state.shipments.map(s => s.tracking_number), 'TRK'),
    po_id: po.id,
    po_number: po.po_number,
    supplier_name: po.supplier_name,
    carrier: input.carrier.trim(),
    status: 'in-transit',
    eta: input.eta || daysFromNow(3),
    created_at: new Date().toISOString(),
    delivered_at: '',
  }
  state.shipments.unshift(shipment)
  saveOrgSupplyState(orgId, state)
  return shipment
}

const SHIPMENT_TRANSITIONS: Record<OrgShipmentStatus, OrgShipmentStatus[]> = {
  'in-transit': ['delivered', 'delayed', 'cancelled'],
  delayed: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

export function setOrgShipmentStatus(orgId: string, shipmentId: string, status: OrgShipmentStatus): OrgShipment {
  const state = loadOrgSupplyState(orgId)
  const shipment = state.shipments.find(s => s.id === shipmentId)
  if (!shipment) throw new Error('Shipment not found')
  if (!SHIPMENT_TRANSITIONS[shipment.status].includes(status)) {
    throw new Error('Invalid shipment status transition')
  }
  shipment.status = status
  if (status === 'delivered') {
    shipment.delivered_at = new Date().toISOString()
    const po = state.purchaseOrders.find(p => p.id === shipment.po_id)
    if (po && (po.status === 'pending' || po.status === 'approved')) {
      receivePurchaseOrder(orgId, po)
    }
  }
  saveOrgSupplyState(orgId, state)
  return shipment
}
