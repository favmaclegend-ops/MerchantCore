import { getOrgSession } from './organisations'

// Mock Notifications & Alerts for ORGANISATION workspaces.
//
// Like `finance.ts` / `orgCommerce.ts` / `orgHRM.ts`, everything lives in localStorage
// behind the promise-based `api.org.notifications.*` calls so a real backend can be
// swapped in later. Data is scoped per organisation (`merchant_org_notifications_{orgId}`)
// and versioned so it never mixes with normal (server-backed) logins or between orgs.
//
// This is the TRANSPARENCY feed: every time any employee carries out a transaction
// (POS sale, credit payment, invoice paid/voided, payroll run) an alert is appended here
// and is visible to every member of the organisation. Delete permissions:
//   - only the Super Admin may delete alerts/notifications by default;
//   - the Super Admin can grant that delete access to normal Admins via the settings flag
//     `allow_admin_delete`.
//
// Seed notifications mirror the seeded Commerce / Finance / HRM data so the page, the
// bell dropdown and the unread badge all have deterministic demo content.

export type OrgNotificationKind =
  | 'sale'
  | 'credit'
  | 'invoice'
  | 'payroll'
  | 'low_stock'
  | 'check_in'
  | 'inventory'
  | 'system'

export type OrgNotificationSeverity = 'success' | 'info' | 'warning' | 'danger'

export interface OrgNotification {
  id: string
  kind: OrgNotificationKind
  severity: OrgNotificationSeverity
  is_alert: boolean
  title: string
  message: string
  amount: number
  ref: string
  actor_name: string
  actor_role: string
  read_by: string[] // member ids that have read it (per-member read state)
  created_at: string
}

export interface OrgNotificationSettings {
  allow_admin_delete: boolean
}

export interface OrgNotificationsState {
  notifications: OrgNotification[]
  settings: OrgNotificationSettings
}

export interface OrgNotificationInput {
  kind: OrgNotificationKind
  title: string
  message: string
  amount?: number
  ref?: string
  is_alert?: boolean
  severity?: OrgNotificationSeverity
}

const NOTIF_KEY_PREFIX = 'merchant_org_notifications_'
const NOTIF_VERSION = 2

const SEED_MEMBERS = [
  { id: 'ADM-001', name: 'Daniel Kofi', role: 'Super Admin' },
  { id: 'ADM-002', name: 'Sarah Mensah', role: 'Administrator' },
  { id: 'ADM-003', name: 'Efua Mensah', role: 'HR Manager' },
  { id: 'ADM-004', name: 'Kwame Asante', role: 'Accountant' },
  { id: 'ADM-005', name: 'Akosua Amoah', role: 'Supply Chain Manager' },
  { id: 'STF-101', name: 'Grace Addo', role: 'Cashier' },
  { id: 'STF-102', name: 'Michael Owusu', role: 'Sales' },
  { id: 'STF-103', name: 'Rita Boateng', role: 'Stock Clerk' },
]

function storageKey(orgId: string) {
  return `${NOTIF_KEY_PREFIX}${orgId}`
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString()
}

function severityForKind(kind: OrgNotificationKind): OrgNotificationSeverity {
  switch (kind) {
    case 'sale':
      return 'success'
    case 'low_stock':
      return 'warning'
    case 'inventory':
      return 'info'
    default:
      return 'info'
  }
}

function isAlertKind(kind: OrgNotificationKind): boolean {
  return (
    kind === 'sale' ||
    kind === 'credit' ||
    kind === 'invoice' ||
    kind === 'payroll' ||
    kind === 'low_stock' ||
    kind === 'inventory'
  )
}

interface SeedTemplate {
  kind: OrgNotificationKind
  title: string
  message: string
  amount: number
  ref: string
  actor: string
}

function seedNotificationsState(): OrgNotificationsState {
  const memberIds = SEED_MEMBERS.map(m => m.id)
  const actorOf = (name: string) => SEED_MEMBERS.find(m => m.name === name) ?? SEED_MEMBERS[0]
  // Newest first. The 3 most recent stay unread so the badge has something to show;
  // older demo items are marked read by every member.
  const templates: SeedTemplate[] = [
    { kind: 'sale', title: 'New sale completed', message: 'Walk-in customer · 52 items', amount: 12480, ref: 'POS-0914', actor: 'Michael Owusu' },
    { kind: 'sale', title: 'New sale completed', message: 'Adom Fresh Foods · 3 items', amount: 4850, ref: 'POS-0913', actor: 'Grace Addo' },
    { kind: 'low_stock', title: 'Low stock alert', message: 'Sugar 50kg is below the restock threshold', amount: 0, ref: 'PRD-018', actor: 'Rita Boateng' },
    { kind: 'invoice', title: 'Invoice paid', message: 'Invoice INV-2026-0103 for Total Trust Wholesale was marked as paid', amount: 6400, ref: 'INV-2026-0103', actor: 'Sarah Mensah' },
    { kind: 'credit', title: 'Credit payment received', message: 'Total Trust Wholesale paid their credit balance', amount: 6400, ref: 'CRD-004', actor: 'Grace Addo' },
    { kind: 'sale', title: 'New sale completed', message: 'Walk-in customer · 47 items', amount: 10920, ref: 'POS-0910', actor: 'Michael Owusu' },
    { kind: 'credit', title: 'Credit payment received', message: 'City Restaurants Ltd paid for delivery services', amount: 2400, ref: 'CRD-005', actor: 'Daniel Kofi' },
    { kind: 'payroll', title: 'Payroll processed', message: 'Monthly payroll for the current period · 11 employees', amount: 40300, ref: 'Jul 2026', actor: 'Daniel Kofi' },
    { kind: 'sale', title: 'New sale completed', message: 'Efua Bakery · 38 items', amount: 11350, ref: 'POS-0903', actor: 'Grace Addo' },
    { kind: 'low_stock', title: 'Low stock alert', message: 'Pringles 165g is below the restock threshold', amount: 0, ref: 'PRD-029', actor: 'Michael Owusu' },
    { kind: 'sale', title: 'New sale completed', message: 'Walk-in customer · 41 items', amount: 9860, ref: 'POS-0896', actor: 'Grace Addo' },
    { kind: 'low_stock', title: 'Low stock alert', message: 'Fruit Cake Slice is below the restock threshold', amount: 0, ref: 'PRD-032', actor: 'Rita Boateng' },
    { kind: 'sale', title: 'New sale completed', message: 'Walk-in customer · 55 items', amount: 13100, ref: 'POS-0889', actor: 'Rita Boateng' },
    { kind: 'check_in', title: 'Employee check-in', message: 'Grace Addo checked in at 08:05', amount: 0, ref: '', actor: 'Grace Addo' },
    { kind: 'inventory', title: 'Inventory restocked', message: 'PO-2026-002 received from Essential Foods Ltd · 20 units', amount: 6000, ref: 'PO-2026-002', actor: 'Akosua Amoah' },
    { kind: 'inventory', title: 'Purchase order created', message: 'PO-2026-003 raised for Snacks & Treats Ltd', amount: 140, ref: 'PO-2026-003', actor: 'Akosua Amoah' },
  ]

  const notifications: OrgNotification[] = templates.map((t, i) => {
    const actor = actorOf(t.actor)
    return {
      id: `NTF-${String(i + 1).padStart(3, '0')}`,
      kind: t.kind,
      severity: severityForKind(t.kind),
      is_alert: isAlertKind(t.kind),
      title: t.title,
      message: t.message,
      amount: t.amount,
      ref: t.ref,
      actor_name: actor.name,
      actor_role: actor.role,
      read_by: i < 3 ? [] : [...memberIds],
      created_at: hoursAgo(i * 3 + 1),
    }
  })

  return { notifications, settings: { allow_admin_delete: false } }
}

export function loadOrgNotificationsState(orgId: string): OrgNotificationsState {
  const key = storageKey(orgId)
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as { version: number; state: OrgNotificationsState }
      if (parsed && parsed.version === NOTIF_VERSION && parsed.state) return parsed.state
    }
  } catch {
    // corrupt or outdated storage -> reseed fresh
  }
  const fresh = seedNotificationsState()
  saveOrgNotificationsState(orgId, fresh)
  return fresh
}

export function saveOrgNotificationsState(orgId: string, state: OrgNotificationsState) {
  try {
    localStorage.setItem(storageKey(orgId), JSON.stringify({ version: NOTIF_VERSION, state }))
  } catch {
    return
  }
}

// The feed is returned newest-first (new records are unshifted in `addOrgNotification`).
export function getOrgNotificationsState(orgId: string): OrgNotificationsState {
  return loadOrgNotificationsState(orgId)
}

export function getOrgNotifications(orgId: string): OrgNotification[] {
  return loadOrgNotificationsState(orgId).notifications
}

function nextId(ids: string[], prefix: string): string {
  const nums = ids
    .filter(id => id.startsWith(`${prefix}-`))
    .map(id => parseInt(id.replace(`${prefix}-`, ''), 10))
    .filter(n => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

// The acting employee is taken from the active org session (whoever pressed the button).
// With no session (e.g. a scheduled job or a migration) it falls back to the platform.
function resolveActor(): { name: string; role: string } {
  const session = getOrgSession()
  if (!session?.member) return { name: 'System', role: 'Platform' }
  return { name: session.member.name, role: session.member.jobTitle || 'Staff' }
}

export function addOrgNotification(orgId: string, input: OrgNotificationInput): OrgNotification {
  const state = loadOrgNotificationsState(orgId)
  const actor = resolveActor()
  const notification: OrgNotification = {
    id: nextId(state.notifications.map(n => n.id), 'NTF'),
    kind: input.kind,
    severity: input.severity ?? severityForKind(input.kind),
    is_alert: input.is_alert ?? isAlertKind(input.kind),
    title: input.title,
    message: input.message,
    amount: input.amount ?? 0,
    ref: input.ref ?? '',
    actor_name: actor.name,
    actor_role: actor.role,
    read_by: [],
    created_at: new Date().toISOString(),
  }
  state.notifications.unshift(notification)
  saveOrgNotificationsState(orgId, state)
  return notification
}

export function markOrgNotificationRead(orgId: string, notificationId: string, memberId: string) {
  const state = loadOrgNotificationsState(orgId)
  const notification = state.notifications.find(n => n.id === notificationId)
  if (!notification) throw new Error('Notification not found')
  if (!notification.read_by.includes(memberId)) notification.read_by.push(memberId)
  saveOrgNotificationsState(orgId, state)
}

export function markAllOrgNotificationsRead(orgId: string, memberId: string) {
  const state = loadOrgNotificationsState(orgId)
  let changed = false
  for (const notification of state.notifications) {
    if (!notification.read_by.includes(memberId)) {
      notification.read_by.push(memberId)
      changed = true
    }
  }
  if (changed) saveOrgNotificationsState(orgId, state)
}

export function deleteOrgNotification(orgId: string, notificationId: string) {
  const state = loadOrgNotificationsState(orgId)
  state.notifications = state.notifications.filter(n => n.id !== notificationId)
  saveOrgNotificationsState(orgId, state)
}

export function clearOrgNotifications(orgId: string) {
  const state = loadOrgNotificationsState(orgId)
  state.notifications = []
  saveOrgNotificationsState(orgId, state)
}

export function setOrgNotificationSettings(orgId: string, patch: Partial<OrgNotificationSettings>) {
  const state = loadOrgNotificationsState(orgId)
  state.settings = { ...state.settings, ...patch }
  saveOrgNotificationsState(orgId, state)
}

// Permission rule: the Super Admin always deletes; a normal Admin deletes only when the
// Super Admin has granted `allow_admin_delete`. Everyone else (hrm/finance managers,
// staff) can read but never delete.
export function canDeleteOrgNotifications(
  role: string,
  settings: OrgNotificationSettings,
): boolean {
  if (role === 'super-admin') return true
  if (role === 'admin') return settings.allow_admin_delete
  return false
}
