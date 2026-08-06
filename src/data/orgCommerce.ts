// Mock Commerce data for ORGANISATION workspaces: products (inventory), customers,
// credit entries and POS transactions.
//
// Like `finance.ts`, everything lives in localStorage behind the promise-based
// `api.org.*` calls so a real backend can be swapped in later. Data is scoped per
// organisation (`merchant_org_commerce_{orgId}`) and versioned so it never mixes with
// normal (server-backed) logins or between orgs.
//
// The seed is deliberately consistent with the Finance mock and the org dashboard:
//   - 48 products whose total stock value is exactly 58,200  (finance "Inventory" asset)
//   - exactly 3 low-stock products                        (dashboard low-stock alerts)
//   - credit balances sum to 10,025                       (finance accounts receivable)
//   - POS transactions mirror the finance ledger references

export type OrgProductStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export interface OrgProduct {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
  status: OrgProductStatus
  image?: string
  rating?: number
}

export interface OrgProductInput {
  name: string
  sku: string
  price: number
  stock: number
  category: string
  image?: string
  rating?: number
}

export interface OrgCustomer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  total_spent: number
  credit_limit: number
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  last_purchase: string
  created_at: string
}

export interface OrgCustomerInput {
  name: string
  email: string
  phone?: string
  company?: string
  credit_limit: number
}

export type OrgCreditStatus = 'active' | 'overdue' | 'critical'

export interface OrgCreditEntry {
  id: string
  customer_id: string
  customer_name: string
  customer_code: string
  balance: number
  last_payment: string
  last_payment_amount: number
  status: OrgCreditStatus
  overdue_days: number
}

export interface OrgCreditInput {
  customer_id: string
  customer_name: string
  customer_code?: string
  balance: number
}

export interface OrgPosTransaction {
  id: string
  type: string
  customer_name?: string
  amount: number
  status: string
  items?: string
  created_at: string
}

export interface CheckoutInput {
  items: { id: string; name: string; price: number; quantity: number }[]
  total: number
  payment_method: string
}

export interface OrgCommerceState {
  products: OrgProduct[]
  customers: OrgCustomer[]
  creditEntries: OrgCreditEntry[]
  transactions: OrgPosTransaction[]
}

const COMMERCE_KEY_PREFIX = 'merchant_org_commerce_'
const COMMERCE_VERSION = 1
const LOW_STOCK_THRESHOLD = 20

function storageKey(orgId: string) {
  return `${COMMERCE_KEY_PREFIX}${orgId}`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function stockStatus(stock: number): OrgProductStatus {
  if (stock <= 0) return 'out-of-stock'
  if (stock <= LOW_STOCK_THRESHOLD) return 'low-stock'
  return 'in-stock'
}

function seedCommerceState(): OrgCommerceState {
  return {
    products: [
      // Beverages
      { id: 'PRD-001', name: 'Coca-Cola 500ml', sku: 'BEV-001', price: 4, stock: 240, category: 'Beverages', status: 'in-stock' },
      { id: 'PRD-002', name: 'Malta Guinness 330ml', sku: 'BEV-002', price: 6, stock: 120, category: 'Beverages', status: 'in-stock' },
      { id: 'PRD-003', name: 'Alvaro Malt 330ml', sku: 'BEV-003', price: 5, stock: 90, category: 'Beverages', status: 'in-stock' },
      { id: 'PRD-004', name: 'FanIce Yoghurt Drink', sku: 'BEV-004', price: 3.5, stock: 180, category: 'Beverages', status: 'in-stock' },
      { id: 'PRD-005', name: 'VitaMilk 250ml', sku: 'BEV-005', price: 5.5, stock: 150, category: 'Beverages', status: 'in-stock' },
      { id: 'PRD-006', name: 'Voltic Water 1.5L', sku: 'BEV-006', price: 3, stock: 300, category: 'Beverages', status: 'in-stock' },
      // Grains & Flour
      { id: 'PRD-007', name: 'Bama Rice 5kg', sku: 'GRN-001', price: 60, stock: 52, category: 'Grains & Flour', status: 'in-stock' },
      { id: 'PRD-008', name: 'Royal Rice 25kg', sku: 'GRN-002', price: 290, stock: 25, category: 'Grains & Flour', status: 'in-stock' },
      { id: 'PRD-009', name: 'Wheat Flour 25kg', sku: 'GRN-003', price: 150, stock: 30, category: 'Grains & Flour', status: 'in-stock' },
      { id: 'PRD-010', name: 'Maize Flour 1kg', sku: 'GRN-004', price: 10, stock: 120, category: 'Grains & Flour', status: 'in-stock' },
      { id: 'PRD-011', name: 'Golden Penny Pasta 500g', sku: 'GRN-005', price: 8, stock: 140, category: 'Grains & Flour', status: 'in-stock' },
      { id: 'PRD-012', name: 'Semovita 1kg', sku: 'GRN-006', price: 11, stock: 90, category: 'Grains & Flour', status: 'in-stock' },
      { id: 'PRD-013', name: 'Gino Baked Beans 400g', sku: 'GRN-007', price: 12, stock: 85, category: 'Grains & Flour', status: 'in-stock' },
      // Cooking Essentials
      { id: 'PRD-014', name: 'Frytol Cooking Oil 5L', sku: 'COO-001', price: 120, stock: 45, category: 'Cooking Essentials', status: 'in-stock' },
      { id: 'PRD-015', name: 'Vegetable Oil 1L', sku: 'COO-002', price: 25, stock: 150, category: 'Cooking Essentials', status: 'in-stock' },
      { id: 'PRD-016', name: 'Milo 900g', sku: 'COO-003', price: 65, stock: 40, category: 'Cooking Essentials', status: 'in-stock' },
      { id: 'PRD-017', name: 'Ideal Milk 160g', sku: 'COO-004', price: 9, stock: 196, category: 'Cooking Essentials', status: 'in-stock' },
      { id: 'PRD-018', name: 'Sugar 50kg', sku: 'COO-005', price: 300, stock: 9, category: 'Cooking Essentials', status: 'low-stock' },
      { id: 'PRD-019', name: 'Salt 1kg', sku: 'COO-006', price: 6, stock: 160, category: 'Cooking Essentials', status: 'in-stock' },
      { id: 'PRD-020', name: 'Royco Seasoning', sku: 'COO-007', price: 4.5, stock: 110, category: 'Cooking Essentials', status: 'in-stock' },
      { id: 'PRD-021', name: 'Ketchup 500g', sku: 'COO-008', price: 18, stock: 55, category: 'Cooking Essentials', status: 'in-stock' },
      { id: 'PRD-022', name: 'Tomato Paste 420g', sku: 'COO-009', price: 9.5, stock: 70, category: 'Cooking Essentials', status: 'in-stock' },
      // Snacks
      { id: 'PRD-023', name: 'Mr. Chips 45g', sku: 'SNK-001', price: 5, stock: 95, category: 'Snacks', status: 'in-stock' },
      { id: 'PRD-024', name: 'Jumbo Choco Biscuit', sku: 'SNK-002', price: 3, stock: 200, category: 'Snacks', status: 'in-stock' },
      { id: 'PRD-025', name: 'Dangme Biscuits', sku: 'SNK-003', price: 2.5, stock: 240, category: 'Snacks', status: 'in-stock' },
      { id: 'PRD-026', name: 'Cheese Balls 40g', sku: 'SNK-004', price: 4, stock: 60, category: 'Snacks', status: 'in-stock' },
      { id: 'PRD-027', name: 'Peanut Crunch', sku: 'SNK-005', price: 6, stock: 50, category: 'Snacks', status: 'in-stock' },
      { id: 'PRD-028', name: 'Water Biscuits', sku: 'SNK-006', price: 4.5, stock: 70, category: 'Snacks', status: 'in-stock' },
      { id: 'PRD-029', name: 'Pringles 165g', sku: 'SNK-007', price: 15, stock: 12, category: 'Snacks', status: 'low-stock' },
      { id: 'PRD-030', name: 'Gala Roll', sku: 'SNK-008', price: 5, stock: 60, category: 'Snacks', status: 'in-stock' },
      { id: 'PRD-031', name: 'Lollipop Bag', sku: 'SNK-009', price: 1.5, stock: 150, category: 'Snacks', status: 'in-stock' },
      { id: 'PRD-032', name: 'Fruit Cake Slice', sku: 'SNK-010', price: 7, stock: 8, category: 'Snacks', status: 'low-stock' },
      // Dairy & Eggs
      { id: 'PRD-033', name: 'Fresh Milk 500ml', sku: 'DAY-001', price: 12, stock: 60, category: 'Dairy & Eggs', status: 'in-stock' },
      { id: 'PRD-034', name: 'Eggs (Tray 30)', sku: 'DAY-002', price: 22, stock: 35, category: 'Dairy & Eggs', status: 'in-stock' },
      { id: 'PRD-035', name: 'Margarine 250g', sku: 'DAY-003', price: 15, stock: 40, category: 'Dairy & Eggs', status: 'in-stock' },
      { id: 'PRD-036', name: 'Cheese Slices', sku: 'DAY-004', price: 18, stock: 30, category: 'Dairy & Eggs', status: 'in-stock' },
      { id: 'PRD-037', name: 'Plain Yoghurt', sku: 'DAY-005', price: 10, stock: 45, category: 'Dairy & Eggs', status: 'in-stock' },
      // Household
      { id: 'PRD-038', name: 'Dish Soap 500ml', sku: 'HOU-001', price: 14, stock: 80, category: 'Household', status: 'in-stock' },
      { id: 'PRD-039', name: 'Laundry Powder 1kg', sku: 'HOU-002', price: 28, stock: 60, category: 'Household', status: 'in-stock' },
      { id: 'PRD-040', name: 'Toilet Roll (10)', sku: 'HOU-003', price: 20, stock: 100, category: 'Household', status: 'in-stock' },
      { id: 'PRD-041', name: 'Bleach 1L', sku: 'HOU-004', price: 12, stock: 70, category: 'Household', status: 'in-stock' },
      { id: 'PRD-042', name: 'Air Freshener', sku: 'HOU-005', price: 16, stock: 0, category: 'Household', status: 'out-of-stock' },
      { id: 'PRD-043', name: 'Broom', sku: 'HOU-006', price: 9, stock: 45, category: 'Household', status: 'in-stock' },
      { id: 'PRD-044', name: 'Sponge Pack', sku: 'HOU-007', price: 7.5, stock: 54, category: 'Household', status: 'in-stock' },
      // Personal Care
      { id: 'PRD-045', name: 'Bar Soap', sku: 'PER-001', price: 5, stock: 120, category: 'Personal Care', status: 'in-stock' },
      { id: 'PRD-046', name: 'Toothpaste', sku: 'PER-002', price: 8, stock: 90, category: 'Personal Care', status: 'in-stock' },
      { id: 'PRD-047', name: 'Shampoo 250ml', sku: 'PER-003', price: 22, stock: 25, category: 'Personal Care', status: 'in-stock' },
      { id: 'PRD-048', name: 'Baby Wipes', sku: 'PER-004', price: 12.5, stock: 40, category: 'Personal Care', status: 'in-stock' },
    ],
    customers: [
      { id: 'CUS-001', name: 'Adom Fresh Foods', email: 'orders@adom.example', phone: '+1 555 010 2101', company: 'Adom Fresh Foods', total_spent: 12480, credit_limit: 10000, tier: 'gold', last_purchase: '2 days ago', created_at: daysAgo(240) },
      { id: 'CUS-002', name: "Naana's Kitchen", email: 'naana@kitchen.example', phone: '+1 555 010 2102', company: "Naana's Kitchen", total_spent: 3200, credit_limit: 5000, tier: 'silver', last_purchase: '3 days ago', created_at: daysAgo(180) },
      { id: 'CUS-003', name: 'Total Trust Wholesale', email: 'sales@totrust.example', phone: '+1 555 010 2103', company: 'Total Trust Wholesale', total_spent: 15400, credit_limit: 20000, tier: 'platinum', last_purchase: '16 days ago', created_at: daysAgo(400) },
      { id: 'CUS-004', name: 'Efua Bakery', email: 'hello@efuabakery.example', phone: '+1 555 010 2104', company: 'Efua Bakery', total_spent: 1975, credit_limit: 4000, tier: 'bronze', last_purchase: '2 days ago', created_at: daysAgo(150) },
      { id: 'CUS-005', name: 'City Restaurants Ltd', email: 'procurement@cityrest.example', phone: '+1 555 010 2105', company: 'City Restaurants Ltd', total_spent: 9000, credit_limit: 15000, tier: 'gold', last_purchase: '40 days ago', created_at: daysAgo(300) },
    ],
    creditEntries: [
      { id: 'CRD-001', customer_id: 'CUS-001', customer_name: 'Adom Fresh Foods', customer_code: 'CUS-001', balance: 4850, last_payment: '', last_payment_amount: 0, status: 'active', overdue_days: 0 },
      { id: 'CRD-002', customer_id: 'CUS-002', customer_name: "Naana's Kitchen", customer_code: 'CUS-002', balance: 3200, last_payment: '', last_payment_amount: 0, status: 'overdue', overdue_days: 3 },
      { id: 'CRD-003', customer_id: 'CUS-004', customer_name: 'Efua Bakery', customer_code: 'CUS-004', balance: 1975, last_payment: '', last_payment_amount: 0, status: 'active', overdue_days: 0 },
      { id: 'CRD-004', customer_id: 'CUS-003', customer_name: 'Total Trust Wholesale', customer_code: 'CUS-003', balance: 0, last_payment: 'Jul 2026', last_payment_amount: 6400, status: 'active', overdue_days: 0 },
    ],
    transactions: [
      { id: 'POS-0914', type: 'sale', customer_name: 'Walk-in', amount: 12480, status: 'completed', items: '52 items', created_at: daysAgo(2) },
      { id: 'POS-0913', type: 'sale', customer_name: 'Adom Fresh Foods', amount: 4850, status: 'completed', items: '3 items', created_at: daysAgo(2) },
      { id: 'POS-0910', type: 'sale', customer_name: 'Walk-in', amount: 10920, status: 'completed', items: '47 items', created_at: daysAgo(6) },
      { id: 'SVC-0112', type: 'payment', customer_name: 'City Restaurants Ltd', amount: 2400, status: 'completed', items: 'Delivery services', created_at: daysAgo(15) },
      { id: 'PAY-0042', type: 'payment', customer_name: 'Total Trust Wholesale', amount: 6400, status: 'completed', items: 'Invoice INV-2026-0103', created_at: daysAgo(16) },
      { id: 'POS-0903', type: 'sale', customer_name: 'Efua Bakery', amount: 11350, status: 'completed', items: '38 items', created_at: daysAgo(12) },
      { id: 'POS-0896', type: 'sale', customer_name: 'Walk-in', amount: 9860, status: 'completed', items: '41 items', created_at: daysAgo(20) },
      { id: 'POS-0889', type: 'sale', customer_name: 'Walk-in', amount: 13100, status: 'completed', items: '55 items', created_at: daysAgo(28) },
    ],
  }
}

export function loadCommerceState(orgId: string): OrgCommerceState {
  const key = storageKey(orgId)
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as { version: number; state: OrgCommerceState }
      if (parsed && parsed.version === COMMERCE_VERSION && parsed.state) return parsed.state
    }
  } catch {
    // corrupt or outdated storage -> reseed fresh
  }
  const fresh = seedCommerceState()
  saveCommerceState(orgId, fresh)
  return fresh
}

export function saveCommerceState(orgId: string, state: OrgCommerceState) {
  try {
    localStorage.setItem(storageKey(orgId), JSON.stringify({ version: COMMERCE_VERSION, state }))
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

// ---- Products (Inventory) -------------------------------------------------

export function getOrgProducts(orgId: string): OrgProduct[] {
  return loadCommerceState(orgId).products.map(p => ({ ...p, status: stockStatus(p.stock) }))
}

export function createOrgProduct(orgId: string, input: OrgProductInput): OrgProduct {
  const state = loadCommerceState(orgId)
  const product: OrgProduct = {
    id: nextId(state.products.map(p => p.id), 'PRD'),
    name: input.name.trim(),
    sku: input.sku.trim(),
    price: input.price || 0,
    stock: input.stock || 0,
    category: input.category.trim(),
    status: stockStatus(input.stock || 0),
    image: input.image?.trim() || undefined,
    rating: input.rating,
  }
  state.products.push(product)
  saveCommerceState(orgId, state)
  return product
}

export function updateOrgProduct(orgId: string, productId: string, patch: Partial<OrgProductInput>): OrgProduct {
  const state = loadCommerceState(orgId)
  const product = state.products.find(p => p.id === productId)
  if (!product) throw new Error('Product not found')
  const { image, rating, ...rest } = patch
  const merged = { ...product, ...rest }
  if (patch.price !== undefined) merged.price = patch.price || 0
  if (patch.stock !== undefined) merged.stock = patch.stock || 0
  if (image !== undefined) merged.image = image.trim() || undefined
  if (rating !== undefined) merged.rating = rating
  merged.status = stockStatus(merged.stock)
  Object.assign(product, merged)
  saveCommerceState(orgId, state)
  return getOrgProducts(orgId).find(p => p.id === productId) as OrgProduct
}

export function deleteOrgProduct(orgId: string, productId: string) {
  const state = loadCommerceState(orgId)
  state.products = state.products.filter(p => p.id !== productId)
  saveCommerceState(orgId, state)
}

// ---- Customers ------------------------------------------------------------

export function getOrgCustomers(orgId: string): OrgCustomer[] {
  return loadCommerceState(orgId).customers
}

export function createOrgCustomer(orgId: string, input: OrgCustomerInput): OrgCustomer {
  const state = loadCommerceState(orgId)
  const customer: OrgCustomer = {
    id: nextId(state.customers.map(c => c.id), 'CUS'),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() ?? '',
    company: input.company?.trim() ?? '',
    total_spent: 0,
    credit_limit: input.credit_limit || 0,
    tier: 'bronze',
    last_purchase: '',
    created_at: new Date().toISOString().slice(0, 10),
  }
  state.customers.push(customer)
  saveCommerceState(orgId, state)
  return customer
}

export function updateOrgCustomer(orgId: string, customerId: string, patch: Partial<OrgCustomerInput>): OrgCustomer {
  const state = loadCommerceState(orgId)
  const customer = state.customers.find(c => c.id === customerId)
  if (!customer) throw new Error('Customer not found')
  Object.assign(customer, patch)
  saveCommerceState(orgId, state)
  return customer
}

export function deleteOrgCustomer(orgId: string, customerId: string) {
  const state = loadCommerceState(orgId)
  state.customers = state.customers.filter(c => c.id !== customerId)
  saveCommerceState(orgId, state)
}

// ---- Credit ---------------------------------------------------------------

export function getOrgCreditEntries(orgId: string): OrgCreditEntry[] {
  return loadCommerceState(orgId).creditEntries
}

export function createOrgCreditEntry(orgId: string, input: OrgCreditInput): OrgCreditEntry {
  const state = loadCommerceState(orgId)
  const entry: OrgCreditEntry = {
    id: nextId(state.creditEntries.map(e => e.id), 'CRD'),
    customer_id: input.customer_id,
    customer_name: input.customer_name.trim(),
    customer_code: input.customer_code?.trim() ?? input.customer_id.substring(0, 8),
    balance: input.balance || 0,
    last_payment: '',
    last_payment_amount: 0,
    status: 'active',
    overdue_days: 0,
  }
  state.creditEntries.push(entry)
  saveCommerceState(orgId, state)
  return entry
}

export function updateOrgCreditEntry(orgId: string, entryId: string, patch: Partial<OrgCreditEntry>): OrgCreditEntry {
  const state = loadCommerceState(orgId)
  const entry = state.creditEntries.find(e => e.id === entryId)
  if (!entry) throw new Error('Credit entry not found')
  Object.assign(entry, patch)
  saveCommerceState(orgId, state)
  return entry
}

// ---- POS ------------------------------------------------------------------

export function getOrgPosTransactions(orgId: string): OrgPosTransaction[] {
  return loadCommerceState(orgId).transactions
}

export function checkoutOrg(orgId: string, input: CheckoutInput): OrgPosTransaction {
  const state = loadCommerceState(orgId)
  const txn: OrgPosTransaction = {
    id: `TX-${Date.now()}`,
    type: 'sale',
    customer_name: 'Walk-in',
    amount: input.total,
    status: 'completed',
    items: `${input.items.reduce((sum, i) => sum + i.quantity, 0)} items`,
    created_at: new Date().toISOString(),
  }
  state.transactions.unshift(txn)
  for (const item of input.items) {
    const product = state.products.find(p => p.id === item.id)
    if (product) product.stock = Math.max(0, product.stock - item.quantity)
  }
  saveCommerceState(orgId, state)
  return txn
}
