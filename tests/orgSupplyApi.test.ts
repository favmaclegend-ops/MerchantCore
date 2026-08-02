import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import { setOrgSession, type OrgRegisterInput, type OrgSession } from '@/data/organisations'

const registerInput: OrgRegisterInput = {
  orgName: 'Kofi Stores',
  businessEmail: 'hello@kofistores.example',
  superAdminName: 'Kofi Mensah',
  superAdminUsername: 'kofi',
  superAdminEmail: 'kofi@kofistores.example',
  password: 'Pass@123',
  phone: '+233 555 010 9999',
}

async function registerAndSession(): Promise<OrgSession> {
  const org = await api.org.register(registerInput)
  return { orgId: org.id, orgName: org.name, member: org.members[0] }
}

async function addRoleUser(session: OrgSession, role: OrgSession['member']['role']): Promise<OrgSession> {
  const user = await api.org.addUser({
    name: `${role} User`,
    email: `${role}@kofistores.example`,
    username: role,
    password: 'StaffPass@123',
    phone: '',
    role,
    jobTitle: role,
    isActive: true,
    dataBlocked: false,
    disabled: false,
  })
  return { orgId: session.orgId, orgName: session.orgName, member: user }
}

const SUPPLY_ONLY_ROLES = ['finance-manager', 'hrm-manager', 'admin', 'staff'] as const

describe('api.org.supply (permissions & alerts)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('requires an active session to read supply state', async () => {
    await expect(api.org.supply.getState()).rejects.toThrow('No active organisation session')
  })

  it('serves the seeded supply state to a session member', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    const state = await api.org.supply.getState()
    expect(state.suppliers.length).toBeGreaterThan(0)
    expect(state.purchaseOrders.length).toBeGreaterThan(0)
    expect(state.shipments.length).toBeGreaterThan(0)
  })

  it('lets super-admin and logistics-manager mutate suppliers', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    const logistics = await addRoleUser(session, 'logistics-manager')
    for (const active of [session, logistics]) {
      setOrgSession(active)
      await expect(api.org.supply.createSupplier({
        name: 'Fresh Farms', email: 'sales@freshfarms.example', categories: ['Snacks'],
      })).resolves.toMatchObject({ id: expect.stringMatching(/^SUP-/) })
    }
  })

  it('rejects suppliers, POs and shipments for non-supply roles', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    for (const role of SUPPLY_ONLY_ROLES) {
      const user = await addRoleUser(session, role)
      setOrgSession(user)
      await expect(api.org.supply.createSupplier({ name: 'x', email: 'x@y.example', categories: [] }))
        .rejects.toThrow('Only the supply chain manager or super admin can manage the supply chain')
      await expect(api.org.supply.createPurchaseOrder({ supplier_id: 'SUP-001', items: [{ product_id: 'PRD-001', qty: 5 }] }))
        .rejects.toThrow('Only the supply chain manager or super admin can manage the supply chain')
      await expect(api.org.supply.createShipment({ po_id: 'PO-001', carrier: 'x', eta: '' }))
        .rejects.toThrow('Only the supply chain manager or super admin can manage the supply chain')
    }
  })

  it('emits an inventory alert when a PO is created, received and cancelled', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const po = await api.org.supply.createPurchaseOrder({ supplier_id: 'SUP-001', items: [{ product_id: 'PRD-001', qty: 5 }] })
    let feed = await api.org.notifications.getFeed()
    expect(feed.notifications[0].kind).toBe('inventory')
    expect(feed.notifications[0].title).toBe('Purchase order created')
    expect(feed.notifications[0].is_alert).toBe(true)

    await api.org.supply.setPurchaseOrderStatus(po.id, 'approved')
    await api.org.supply.setPurchaseOrderStatus(po.id, 'received')
    feed = await api.org.notifications.getFeed()
    expect(feed.notifications[0].title).toBe('Inventory restocked')
    expect(feed.notifications[0].severity).toBe('success')

    const po2 = await api.org.supply.createPurchaseOrder({ supplier_id: 'SUP-001', items: [{ product_id: 'PRD-001', qty: 5 }] })
    await api.org.supply.setPurchaseOrderStatus(po2.id, 'cancelled')
    feed = await api.org.notifications.getFeed()
    expect(feed.notifications[0].title).toBe('Purchase order cancelled')
    expect(feed.notifications[0].severity).toBe('warning')
  })

  it('emits inventory alerts for product add, update and delete', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const product = await api.org.createProduct({ name: 'Frutel Juice', sku: 'BEV-777', price: 8, stock: 12, category: 'Beverages' })
    let feed = await api.org.notifications.getFeed()
    expect(feed.notifications[0].kind).toBe('inventory')
    expect(feed.notifications[0].title).toBe('Item added to inventory')
    expect(feed.notifications[0].severity).toBe('success')

    await api.org.updateProduct(product.id, { stock: 20 })
    feed = await api.org.notifications.getFeed()
    expect(feed.notifications[0].title).toBe('Inventory item updated')

    await api.org.deleteProduct(product.id)
    feed = await api.org.notifications.getFeed()
    expect(feed.notifications[0].title).toBe('Inventory item deleted')
    expect(feed.notifications[0].severity).toBe('danger')
  })

  it('only lets supply roles add, edit or delete inventory products', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    for (const role of SUPPLY_ONLY_ROLES) {
      const user = await addRoleUser(session, role)
      setOrgSession(user)
      await expect(api.org.createProduct({ name: 'x', sku: 'X-1', price: 1, stock: 1, category: 'Snacks' }))
        .rejects.toThrow('Only the supply chain manager or super admin can modify inventory')
      await expect(api.org.updateProduct('PRD-001', { stock: 999 }))
        .rejects.toThrow('Only the supply chain manager or super admin can modify inventory')
      await expect(api.org.deleteProduct('PRD-001'))
        .rejects.toThrow('Only the supply chain manager or super admin can modify inventory')
    }
  })

  it('auto-generates POs and alerts per generated order', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    const created = await api.org.supply.autoGeneratePurchaseOrders()
    expect(created.length).toBeGreaterThan(0)
    const feed = await api.org.notifications.getFeed()
    const refs = new Set(created.map(po => po.po_number))
    const alerts = feed.notifications.filter(n => n.kind === 'inventory' && n.title === 'Purchase order created' && refs.has(n.ref))
    expect(alerts.length).toBe(created.length)
  })

  it('emits shipment alerts on create, delay and cancel', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const po = await api.org.supply.createPurchaseOrder({ supplier_id: 'SUP-001', items: [{ product_id: 'PRD-001', qty: 5 }] })
    const shipment = await api.org.supply.createShipment({ po_id: po.id, carrier: 'Swift', eta: '' })
    let feed = await api.org.notifications.getFeed()
    expect(feed.notifications[0].title).toBe('Shipment created')

    await api.org.supply.setShipmentStatus(shipment.id, 'delayed')
    feed = await api.org.notifications.getFeed()
    expect(feed.notifications[0].title).toBe('Shipment delayed')
    expect(feed.notifications[0].severity).toBe('warning')

    await api.org.supply.setShipmentStatus(shipment.id, 'cancelled')
    feed = await api.org.notifications.getFeed()
    expect(feed.notifications[0].title).toBe('Shipment cancelled')
    expect(feed.notifications[0].severity).toBe('warning')
  })
})
