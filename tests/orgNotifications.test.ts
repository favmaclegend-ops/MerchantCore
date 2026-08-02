import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import { setOrgSession, type OrgRegisterInput, type OrgSession } from '@/data/organisations'
import {
  addOrgNotification,
  canDeleteOrgNotifications,
  clearOrgNotifications,
  deleteOrgNotification,
  getOrgNotifications,
  getOrgNotificationsState,
  loadOrgNotificationsState,
  markAllOrgNotificationsRead,
  markOrgNotificationRead,
  setOrgNotificationSettings,
} from '@/data/orgNotifications'

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

describe('orgNotifications data layer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('seeds a deterministic transparency feed with sensible defaults', () => {
    const { notifications, settings } = getOrgNotificationsState('ORG-001')
    expect(notifications.length).toBeGreaterThan(0)
    expect(settings.allow_admin_delete).toBe(false)
    for (let i = 0; i < notifications.length - 1; i += 1) {
      expect(new Date(notifications[i].created_at).getTime()).toBeGreaterThanOrEqual(
        new Date(notifications[i + 1].created_at).getTime(),
      )
    }
    expect(notifications.some(n => n.kind === 'sale')).toBe(true)
    expect(notifications.some(n => n.kind === 'low_stock' && n.is_alert)).toBe(true)
    expect(notifications.some(n => n.kind === 'check_in' && !n.is_alert)).toBe(true)
    expect(notifications[0].read_by).toEqual([])
    expect(notifications[3].read_by).toContain('ADM-001')
  })

  it('adds a notification attributed to the active session member', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    const added = addOrgNotification(session.orgId, {
      kind: 'sale',
      title: 'New sale completed',
      message: 'Walk-in · 2 items',
      amount: 120,
      ref: 'TX-1',
    })
    expect(added.actor_name).toBe('Kofi Mensah')
    expect(added.is_alert).toBe(true)
    expect(added.severity).toBe('success')
    const feed = getOrgNotifications(session.orgId)
    expect(feed[0].id).toBe(added.id)
    expect(feed.length).toBeGreaterThan(1)
  })

  it('falls back to System when no session is active', () => {
    const added = addOrgNotification('ORG-001', {
      kind: 'check_in',
      title: 'Employee check-in',
      message: 'Checked in',
    })
    expect(added.actor_name).toBe('System')
    expect(added.is_alert).toBe(false)
  })

  it('tracks per-member read state without duplicating member ids', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    const target = getOrgNotifications(session.orgId)[0]

    markOrgNotificationRead(session.orgId, target.id, session.member.id)
    let feed = getOrgNotifications(session.orgId)
    expect(feed[0].read_by).toEqual([session.member.id])

    markOrgNotificationRead(session.orgId, target.id, session.member.id)
    feed = getOrgNotifications(session.orgId)
    expect(feed[0].read_by).toEqual([session.member.id])
  })

  it('marks every notification read for a member', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    markAllOrgNotificationsRead(session.orgId, session.member.id)
    const feed = getOrgNotifications(session.orgId)
    expect(feed.every(n => n.read_by.includes(session.member.id))).toBe(true)
  })

  it('deletes and clears notifications', async () => {
    const session = await registerAndSession()
    const target = getOrgNotifications(session.orgId)[0]
    deleteOrgNotification(session.orgId, target.id)
    expect(getOrgNotifications(session.orgId).some(n => n.id === target.id)).toBe(false)

    clearOrgNotifications(session.orgId)
    expect(getOrgNotifications(session.orgId)).toEqual([])
  })

  it('persists notification settings', async () => {
    setOrgNotificationSettings('ORG-001', { allow_admin_delete: true })
    expect(loadOrgNotificationsState('ORG-001').settings.allow_admin_delete).toBe(true)
  })

  it('implements the delete permission rule', () => {
    const granted = { allow_admin_delete: true }
    const denied = { allow_admin_delete: false }
    expect(canDeleteOrgNotifications('super-admin', denied)).toBe(true)
    expect(canDeleteOrgNotifications('admin', denied)).toBe(false)
    expect(canDeleteOrgNotifications('admin', granted)).toBe(true)
    expect(canDeleteOrgNotifications('staff', granted)).toBe(false)
    expect(canDeleteOrgNotifications('hrm-manager', granted)).toBe(false)
    expect(canDeleteOrgNotifications('finance-manager', granted)).toBe(false)
  })
})

describe('api.org.notifications (mock-backed)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('requires an active session for the feed', async () => {
    await expect(api.org.notifications.getFeed()).rejects.toThrow('No active organisation session')
  })

  it('serves the feed and lets the session member mark items read', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const feed = await api.org.notifications.getFeed()
    expect(feed.notifications.length).toBeGreaterThan(0)
    expect(feed.settings.allow_admin_delete).toBe(false)

    const target = feed.notifications[0]
    await api.org.notifications.markRead(target.id)
    const after = await api.org.notifications.getFeed()
    expect(after.notifications[0].read_by).toContain(session.member.id)

    await api.org.notifications.markAllRead()
    const all = await api.org.notifications.getFeed()
    expect(all.notifications.every(n => n.read_by.includes(session.member.id))).toBe(true)
  })

  it('only lets the super admin manage settings', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    await expect(api.org.notifications.setSettings({ allow_admin_delete: true })).resolves.toMatchObject({ allow_admin_delete: true })

    const staff = await api.org.addUser({
      name: 'Ama Staff', email: 'ama@kofistores.example', username: 'ama',
      password: 'StaffPass@123', phone: '', role: 'staff', jobTitle: 'Cashier',
      isActive: true, dataBlocked: false, disabled: false,
    })
    setOrgSession({ orgId: session.orgId, orgName: session.orgName, member: staff })
    await expect(api.org.notifications.setSettings({ allow_admin_delete: false })).rejects.toThrow(
      'Only the super admin can manage notification settings',
    )
  })

  it('restricts deletion to the super admin until admins are granted access', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const admin = await api.org.addUser({
      name: 'Sarah Admin', email: 'sarah@kofistores.example', username: 'sarah',
      password: 'StaffPass@123', phone: '', role: 'admin', jobTitle: 'Administrator',
      isActive: true, dataBlocked: false, disabled: false,
    })
    const staff = await api.org.addUser({
      name: 'Ama Staff', email: 'ama@kofistores.example', username: 'ama',
      password: 'StaffPass@123', phone: '', role: 'staff', jobTitle: 'Cashier',
      isActive: true, dataBlocked: false, disabled: false,
    })

    // Super admin can always delete.
    const feed = await api.org.notifications.getFeed()
    await expect(api.org.notifications.deleteNotification(feed.notifications[0].id)).resolves.toBeUndefined()

    // Admin without the grant cannot.
    setOrgSession({ orgId: session.orgId, orgName: session.orgName, member: admin })
    const adminFeed = await api.org.notifications.getFeed()
    await expect(api.org.notifications.deleteNotification(adminFeed.notifications[0].id)).rejects.toThrow(
      'Not authorised to delete notifications',
    )

    // Staff can never delete, even after the grant.
    setOrgSession({ orgId: session.orgId, orgName: session.orgName, member: staff })
    await expect(api.org.notifications.deleteNotification(getOrgNotifications(session.orgId)[0].id)).rejects.toThrow(
      'Not authorised to delete notifications',
    )

    // Super admin grants admins delete access -> the admin can delete.
    setOrgSession(session)
    await api.org.notifications.setSettings({ allow_admin_delete: true })
    setOrgSession({ orgId: session.orgId, orgName: session.orgName, member: admin })
    await expect(api.org.notifications.deleteNotification(getOrgNotifications(session.orgId)[0].id)).resolves.toBeUndefined()

    // "Clear all" follows the same rule.
    setOrgSession({ orgId: session.orgId, orgName: session.orgName, member: staff })
    await expect(api.org.notifications.clearAll()).rejects.toThrow('Not authorised to delete notifications')
    setOrgSession(session)
    await expect(api.org.notifications.clearAll()).resolves.toBeUndefined()
  })

  it('emits a sale alert when a POS checkout happens', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    await api.org.checkout({ items: [{ id: 'PRD-007', name: 'Bama Rice 5kg', price: 60, quantity: 1 }], total: 60, payment_method: 'Cash' })
    const feed = await api.org.notifications.getFeed()
    const alert = feed.notifications[0]
    expect(alert.kind).toBe('sale')
    expect(alert.is_alert).toBe(true)
    expect(alert.amount).toBe(60)
    expect(alert.actor_name).toBe('Kofi Mensah')
  })

  it('emits a credit alert when a payment is recorded', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    await api.org.updateCreditEntry('CRD-001', { balance: 0, last_payment: 'today', last_payment_amount: 4850, status: 'active' })
    const feed = await api.org.notifications.getFeed()
    expect(feed.notifications[0].kind).toBe('credit')
    expect(feed.notifications[0].amount).toBe(4850)
  })

  it('emits invoice alerts on create and on payment', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    const invoice = await api.org.finance.createInvoice({ customer: 'New Client', dueAt: '2030-01-01', items: [{ description: 'Service', qty: 1, unitPrice: 100 }] })
    await api.org.finance.setInvoiceStatus(invoice.id, 'paid')
    const feed = await api.org.notifications.getFeed()
    const alerts = feed.notifications.filter(n => n.kind === 'invoice')
    expect(alerts[0].title).toBe('Invoice paid')
    expect(alerts[0].is_alert).toBe(true)
    expect(alerts[1].title).toBe('Invoice created')
    expect(alerts[1].is_alert).toBe(false)
  })

  it('emits a payroll alert when payroll is run', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    await api.org.hrm.runPayroll('Sep 2099')
    const feed = await api.org.notifications.getFeed()
    const alert = feed.notifications.find(n => n.kind === 'payroll')
    expect(alert).toBeDefined()
    expect(alert?.is_alert).toBe(true)
    expect(alert?.amount).toBe(40300)
  })

  it('emits a check-in notification when a member checks in', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    await api.org.attendance.checkIn()
    const feed = await api.org.notifications.getFeed()
    const notice = feed.notifications.find(n => n.kind === 'check_in')
    expect(notice).toBeDefined()
    expect(notice?.is_alert).toBe(false)
    expect(notice?.actor_name).toBe('Kofi Mensah')
  })
})
