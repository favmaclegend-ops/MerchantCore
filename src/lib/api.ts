import {
  addOrgMember,
  deleteOrgMember,
  getOrgSession,
  getSessionOrganisation,
  loginOrganisation,
  registerOrganisation,
  updateOrgMember,
  type OrgMember,
  type OrgRegisterInput,
  type OrgSession,
} from '@/data/organisations'
import {
  createInvoice,
  loadFinanceState,
  setInvoiceStatus,
  type Invoice,
  type InvoiceInput,
} from '@/data/finance'
import * as orgCommerce from '@/data/orgCommerce'
import type { CheckoutInput, OrgCreditEntry, OrgCreditInput, OrgCustomerInput, OrgProductInput } from '@/data/orgCommerce'
import * as orgHRM from '@/data/orgHRM'
import type { OrgBenefitInput, OrgEmployeeInput, OrgPayrollStatus, OrgReviewInput, OrgTimeInput } from '@/data/orgHRM'
import * as orgNotifications from '@/data/orgNotifications'
import * as orgSupply from '@/data/orgSupply'
import type {
  OrgPoStatus,
  OrgPurchaseOrderInput,
  OrgShipmentInput,
  OrgShipmentStatus,
  OrgSupplierInput,
} from '@/data/orgSupply'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'
console.log(API_BASE) // debugging

// Only public (unauthenticated) endpoints may be called without a token. Organisation logins
// have NO token — the real server only belongs to normal (personal) logins, so any server call
// without a token is rejected here instead of reaching the backend "anyhow".
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/verify-email']

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const isPublic = PUBLIC_PATHS.some(p => path === p || path.startsWith(`${p}?`))
  if (!token && !isPublic) {
    throw new Error('Not authenticated. The live server is only available to normal (personal) logins.')
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options?.headers as Record<string, string>) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { email: string; username: string; full_name: string; password: string }) =>
    request<{ message: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmail: (email: string, otp: string) =>
    request<{ message: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, otp }) }),

  getProfile: () => request<{ id: string; email: string; username: string; full_name: string; is_active: boolean; is_verified: boolean }>('/users/me'),

  getProducts: () => request<any[]>('/products'),
  getProduct: (id: string) => request<any>(`/products/${id}`),
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),

  getCustomers: () => request<any[]>('/customers'),
  getCustomer: (id: string) => request<any>(`/customers/${id}`),
  createCustomer: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) => request<any>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) => request<void>(`/customers/${id}`, { method: 'DELETE' }),

  getTransactions: () => request<any[]>('/transactions'),

  getDashboardStats: () => request<any>('/dashboard/stats'),
  getRevenueTrend: () => request<{ months: { month: string; revenue: number }[] }>('/dashboard/revenue-trend'),

  getCreditEntries: () => request<any[]>('/credit-entries'),
  createCreditEntry: (data: any) => request<any>('/credit-entries', { method: 'POST', body: JSON.stringify(data) }),
  updateCreditEntry: (id: string, data: any) => request<any>(`/credit-entries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  checkout: async (data: { items: any[]; total: number; payment_method: string }) => {
    const res = await request<any>('/pos/checkout', { method: 'POST', body: JSON.stringify(data) })
    localStorage.removeItem('dashboard_cache')
    return res
  },

  getNotifications: () => request<any[]>('/notifications'),
  getUnreadNotificationCount: () => request<{ count: number }>('/notifications/unread-count'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PATCH' }),

  // Organisation (business workspace) — mock-backed for now. See ORGANIZATION.md
  // for the endpoints these will map to once the backend implements the feature.
  org: {
    register: async (data: OrgRegisterInput) => {
      await delay(400)
      return registerOrganisation(data)
    },
    login: async (orgName: string, email: string, password: string) => {
      await delay(400)
      return loginOrganisation(orgName, email, password)
    },
    getUsers: async () => {
      await delay(200)
      const org = getSessionOrganisation()
      if (!org) throw new Error('No active organisation session')
      return org.members
    },
    addUser: async (member: Omit<OrgMember, 'id'>) => {
      await delay(200)
      return addOrgMember(member)
    },
    updateUser: async (memberId: string, patch: Partial<OrgMember>) => {
      await delay(200)
      return updateOrgMember(memberId, patch)
    },
    deleteUser: async (memberId: string) => {
      await delay(200)
      deleteOrgMember(memberId)
    },

    // Finance & Accounting — mock-backed, scoped to the active organisation session.
    finance: {
      getState: async () => {
        await delay(250)
        const org = getSessionOrganisation()
        if (!org) throw new Error('No active organisation session')
        return loadFinanceState(org.id)
      },
      createInvoice: async (input: InvoiceInput) => {
        await delay(250)
        const org = getSessionOrganisation()
        if (!org) throw new Error('No active organisation session')
        const invoice = createInvoice(org.id, input)
        orgNotifications.addOrgNotification(org.id, {
          kind: 'invoice',
          title: 'Invoice created',
          message: `Invoice ${invoice.number} drafted for ${invoice.customer}`,
          amount: invoice.amount,
          ref: invoice.id,
          is_alert: false,
        })
        return invoice
      },
      setInvoiceStatus: async (invoiceId: string, status: Invoice['status']) => {
        await delay(200)
        const org = getSessionOrganisation()
        if (!org) throw new Error('No active organisation session')
        const invoice = setInvoiceStatus(org.id, invoiceId, status)
        if (invoice.status === 'paid') {
          orgNotifications.addOrgNotification(org.id, {
            kind: 'invoice',
            title: 'Invoice paid',
            message: `Invoice ${invoice.number} for ${invoice.customer} was marked as paid`,
            amount: invoice.amount,
            ref: invoice.id,
          })
        } else if (invoice.status === 'void') {
          orgNotifications.addOrgNotification(org.id, {
            kind: 'invoice',
            title: 'Invoice voided',
            message: `Invoice ${invoice.number} for ${invoice.customer} was voided`,
            amount: invoice.amount,
            ref: invoice.id,
            is_alert: false,
          })
        }
        return invoice
      },
    },

    // Commerce (Inventory / POS / Customers / Credit) — mock-backed. These mirror the
    // normal server API shapes so pages can call `api.org.*` for org accounts and
    // `api.*` for normal accounts interchangeably.
    getProducts: async () => {
      await delay(200)
      return orgCommerce.getOrgProducts(requireOrgId())
    },
    // Product creation / edit / delete is restricted to the head of the Supply Chain
    // department (logistics-manager) and the Super Admin. Every change is broadcast on
    // the transparency feed so all members stay informed.
    createProduct: async (data: OrgProductInput) => {
      await delay(200)
      const session = requireOrgSession()
      requireInventoryPermission(session.member.role)
      const orgId = session.orgId
      const product = orgCommerce.createOrgProduct(orgId, data)
      orgNotifications.addOrgNotification(orgId, {
        kind: 'inventory',
        title: 'Item added to inventory',
        message: `${product.name} added with ${product.stock} units on hand`,
        amount: product.price * product.stock,
        ref: product.id,
        severity: 'success',
      })
      return product
    },
    updateProduct: async (id: string, data: Partial<OrgProductInput>) => {
      await delay(200)
      const session = requireOrgSession()
      requireInventoryPermission(session.member.role)
      const orgId = session.orgId
      const before = orgCommerce.getOrgProducts(orgId).find(p => p.id === id)
      const product = orgCommerce.updateOrgProduct(orgId, id, data)
      orgNotifications.addOrgNotification(orgId, {
        kind: 'inventory',
        title: 'Inventory item updated',
        message: `${product.name} details were changed${before ? ` (stock ${before.stock} → ${product.stock})` : ''}`,
        amount: product.price * product.stock,
        ref: product.id,
      })
      return product
    },
    deleteProduct: async (id: string) => {
      await delay(200)
      const session = requireOrgSession()
      requireInventoryPermission(session.member.role)
      const orgId = session.orgId
      const before = orgCommerce.getOrgProducts(orgId).find(p => p.id === id)
      orgCommerce.deleteOrgProduct(orgId, id)
      orgNotifications.addOrgNotification(orgId, {
        kind: 'inventory',
        title: 'Inventory item deleted',
        message: before ? `${before.name} was removed from inventory` : 'An inventory item was removed',
        ref: id,
        severity: 'danger',
      })
    },

    getCustomers: async () => {
      await delay(200)
      return orgCommerce.getOrgCustomers(requireOrgId())
    },
    createCustomer: async (data: OrgCustomerInput) => {
      await delay(200)
      return orgCommerce.createOrgCustomer(requireOrgId(), data)
    },
    updateCustomer: async (id: string, data: Partial<OrgCustomerInput>) => {
      await delay(200)
      return orgCommerce.updateOrgCustomer(requireOrgId(), id, data)
    },
    deleteCustomer: async (id: string) => {
      await delay(200)
      orgCommerce.deleteOrgCustomer(requireOrgId(), id)
    },

    getCreditEntries: async () => {
      await delay(200)
      return orgCommerce.getOrgCreditEntries(requireOrgId())
    },
    createCreditEntry: async (data: OrgCreditInput) => {
      await delay(200)
      return orgCommerce.createOrgCreditEntry(requireOrgId(), data)
    },
    updateCreditEntry: async (id: string, data: Partial<OrgCreditEntry>) => {
      await delay(200)
      const orgId = requireOrgId()
      const entry = orgCommerce.updateOrgCreditEntry(orgId, id, data)
      const payment = data.last_payment_amount
      if (payment && payment > 0) {
        orgNotifications.addOrgNotification(orgId, {
          kind: 'credit',
          title: 'Credit payment received',
          message: `${entry.customer_name} paid towards their credit balance`,
          amount: payment,
          ref: entry.id,
        })
      }
      return entry
    },

    getTransactions: async () => {
      await delay(200)
      return orgCommerce.getOrgPosTransactions(requireOrgId())
    },
    checkout: async (data: CheckoutInput) => {
      await delay(250)
      const orgId = requireOrgId()
      const txn = orgCommerce.checkoutOrg(orgId, data)
      orgNotifications.addOrgNotification(orgId, {
        kind: 'sale',
        title: 'New sale completed',
        message: `${data.payment_method} payment · ${txn.items}`,
        amount: txn.amount,
        ref: txn.id,
      })
      return txn
    },

    // HRM (Human Resources) — admin-only, mock-backed, scoped to the active org session.
    hrm: {
      getState: async () => {
        await delay(250)
        return orgHRM.loadHrmState(requireOrgId())
      },
      getEmployees: async () => {
        await delay(200)
        return orgHRM.getOrgEmployees(requireOrgId())
      },
      createEmployee: async (data: OrgEmployeeInput) => {
        await delay(200)
        return orgHRM.createOrgEmployee(requireOrgId(), data)
      },
      updateEmployee: async (id: string, patch: Partial<OrgEmployeeInput>) => {
        await delay(200)
        return orgHRM.updateOrgEmployee(requireOrgId(), id, patch)
      },
      retireEmployee: async (id: string) => {
        await delay(200)
        return orgHRM.retireOrgEmployee(requireOrgId(), id)
      },
      terminateEmployee: async (id: string) => {
        await delay(200)
        return orgHRM.terminateOrgEmployee(requireOrgId(), id)
      },
      getBenefits: async () => {
        await delay(200)
        return orgHRM.getOrgBenefits(requireOrgId())
      },
      createBenefit: async (data: OrgBenefitInput) => {
        await delay(200)
        return orgHRM.createOrgBenefit(requireOrgId(), data)
      },
      updateBenefit: async (id: string, patch: Partial<OrgBenefitInput>) => {
        await delay(200)
        return orgHRM.updateOrgBenefit(requireOrgId(), id, patch)
      },
      deleteBenefit: async (id: string) => {
        await delay(200)
        orgHRM.deleteOrgBenefit(requireOrgId(), id)
      },
      getPayrollRuns: async () => {
        await delay(200)
        return orgHRM.getOrgPayrollRuns(requireOrgId())
      },
      runPayroll: async (period: string) => {
        await delay(250)
        const orgId = requireOrgId()
        const runs = orgHRM.runOrgPayroll(orgId, period)
        if (runs.length) {
          orgNotifications.addOrgNotification(orgId, {
            kind: 'payroll',
            title: 'Payroll processed',
            message: `${period} payroll · ${runs.length} employees`,
            amount: runs.reduce((sum, r) => sum + r.gross, 0),
            ref: period,
          })
        }
        return runs
      },
      setPayrollStatus: async (id: string, status: OrgPayrollStatus) => {
        await delay(200)
        return orgHRM.setOrgPayrollStatus(requireOrgId(), id, status)
      },
      getTimeEntries: async () => {
        await delay(200)
        return orgHRM.getOrgTimeEntries(requireOrgId())
      },
      logTime: async (data: OrgTimeInput) => {
        await delay(200)
        return orgHRM.logOrgTime(requireOrgId(), data)
      },
      getAttendance: async () => {
        await delay(200)
        return orgHRM.getOrgAttendance(requireOrgId())
      },
      getSummary: async () => {
        await delay(200)
        return orgHRM.getOrgAttendanceSummary(requireOrgId())
      },
      getReviews: async () => {
        await delay(200)
        return orgHRM.getOrgReviews(requireOrgId())
      },
      createReview: async (data: OrgReviewInput) => {
        await delay(200)
        return orgHRM.createOrgReview(requireOrgId(), data)
      },
      updateReview: async (id: string, patch: Parameters<typeof orgHRM.updateOrgReview>[2]) => {
        await delay(200)
        return orgHRM.updateOrgReview(requireOrgId(), id, patch)
      },
    },

    // Attendance / self check-in — available to every org member (self-service). The
    // logged-in member is matched to their HRM employee record by email; if they have
    // none yet, one is provisioned so the check-in flows into the HRM attendance view.
    attendance: {
      self: async () => {
        await delay(200)
        const session = getOrgSession()
        if (!session) throw new Error('No active organisation session')
        const employee = orgHRM.getOrgEmployees(session.orgId)
          .find(e => e.email.toLowerCase() === session.member.email.toLowerCase())
        return employee ?? null
      },
      getRecords: async () => {
        await delay(200)
        return orgHRM.getOrgAttendance(requireOrgId())
      },
      getSummary: async () => {
        await delay(200)
        return orgHRM.getOrgAttendanceSummary(requireOrgId())
      },
      checkIn: async () => {
        await delay(250)
        const session = getOrgSession()
        if (!session) throw new Error('No active organisation session')
        const orgId = session.orgId
        let employee = orgHRM.getOrgEmployees(orgId)
          .find(e => e.email.toLowerCase() === session.member.email.toLowerCase())
        if (!employee) {
          employee = orgHRM.createOrgEmployee(orgId, {
            name: session.member.name,
            email: session.member.email,
            phone: session.member.phone || undefined,
            department: 'Unassigned',
            jobTitle: session.member.jobTitle || 'Staff',
            employmentType: 'full-time',
            hireDate: new Date().toISOString().slice(0, 10),
            salary: 0,
            status: 'probation',
          })
        }
        const record = orgHRM.checkInOrg(orgId, employee.id)
        orgNotifications.addOrgNotification(orgId, {
          kind: 'check_in',
          title: 'Employee check-in',
          message: `${employee.name} checked in at ${record.check_in}`,
          ref: record.id,
        })
        return record
      },
    },

    // Supply Chain & Logistics — department head (logistics-manager) or Super Admin only.
    // Reading is session-scoped; every mutation is permission-gated and broadcast on the
    // transparency feed (inventory kind alerts).
    supply: {
      getState: async () => {
        await delay(250)
        return orgSupply.loadOrgSupplyState(requireOrgId())
      },
      getSuppliers: async () => {
        await delay(200)
        return orgSupply.getOrgSuppliers(requireOrgId())
      },
      createSupplier: async (data: OrgSupplierInput) => {
        await delay(200)
        const session = requireSupplyPermission()
        return orgSupply.createOrgSupplier(session.orgId, data)
      },
      updateSupplier: async (id: string, patch: Partial<OrgSupplierInput>) => {
        await delay(200)
        const session = requireSupplyPermission()
        return orgSupply.updateOrgSupplier(session.orgId, id, patch)
      },
      deleteSupplier: async (id: string) => {
        await delay(200)
        const session = requireSupplyPermission()
        orgSupply.deleteOrgSupplier(session.orgId, id)
      },

      getPurchaseOrders: async () => {
        await delay(200)
        return orgSupply.getOrgPurchaseOrders(requireOrgId())
      },
      createPurchaseOrder: async (data: OrgPurchaseOrderInput) => {
        await delay(200)
        const session = requireSupplyPermission()
        const po = orgSupply.createOrgPurchaseOrder(session.orgId, data, 'pending')
        orgNotifications.addOrgNotification(session.orgId, {
          kind: 'inventory',
          title: 'Purchase order created',
          message: `${po.po_number} raised for ${po.supplier_name} · ${po.items.length} line item${po.items.length === 1 ? '' : 's'}`,
          amount: po.total,
          ref: po.po_number,
        })
        return po
      },
      setPurchaseOrderStatus: async (id: string, status: OrgPoStatus) => {
        await delay(200)
        const session = requireSupplyPermission()
        const po = orgSupply.setOrgPurchaseOrderStatus(session.orgId, id, status)
        if (status === 'received') {
          orgNotifications.addOrgNotification(session.orgId, {
            kind: 'inventory',
            title: 'Inventory restocked',
            message: `${po.po_number} received from ${po.supplier_name} · stock updated`,
            amount: po.total,
            ref: po.po_number,
            severity: 'success',
          })
        } else if (status === 'cancelled') {
          orgNotifications.addOrgNotification(session.orgId, {
            kind: 'inventory',
            title: 'Purchase order cancelled',
            message: `${po.po_number} for ${po.supplier_name} was cancelled`,
            amount: po.total,
            ref: po.po_number,
            severity: 'warning',
          })
        }
        return po
      },
      deletePurchaseOrder: async (id: string) => {
        await delay(200)
        const session = requireSupplyPermission()
        orgSupply.deleteOrgPurchaseOrder(session.orgId, id)
      },

      suggestRestockProducts: async () => {
        await delay(200)
        return orgSupply.suggestRestockProducts(requireOrgId())
      },
      autoGeneratePurchaseOrders: async (supplierId?: string) => {
        await delay(300)
        const session = requireSupplyPermission()
        const created = orgSupply.autoGeneratePurchaseOrders(session.orgId, supplierId)
        for (const po of created) {
          orgNotifications.addOrgNotification(session.orgId, {
            kind: 'inventory',
            title: 'Purchase order created',
            message: `${po.po_number} auto-raised for ${po.supplier_name} · ${po.items.length} line item${po.items.length === 1 ? '' : 's'}`,
            amount: po.total,
            ref: po.po_number,
          })
        }
        return created
      },

      getShipments: async () => {
        await delay(200)
        return orgSupply.getOrgShipments(requireOrgId())
      },
      createShipment: async (data: OrgShipmentInput) => {
        await delay(200)
        const session = requireSupplyPermission()
        const shipment = orgSupply.createOrgShipment(session.orgId, data)
        orgNotifications.addOrgNotification(session.orgId, {
          kind: 'inventory',
          title: 'Shipment created',
          message: `Shipment ${shipment.tracking_number} for ${shipment.po_number} · ${shipment.carrier}`,
          ref: shipment.tracking_number,
        })
        return shipment
      },
      setShipmentStatus: async (id: string, status: OrgShipmentStatus) => {
        await delay(200)
        const session = requireSupplyPermission()
        const shipment = orgSupply.setOrgShipmentStatus(session.orgId, id, status)
        if (status === 'delayed') {
          orgNotifications.addOrgNotification(session.orgId, {
            kind: 'inventory',
            title: 'Shipment delayed',
            message: `Shipment ${shipment.tracking_number} for ${shipment.po_number} is delayed`,
            ref: shipment.tracking_number,
            severity: 'warning',
          })
        } else if (status === 'cancelled') {
          orgNotifications.addOrgNotification(session.orgId, {
            kind: 'inventory',
            title: 'Shipment cancelled',
            message: `Shipment ${shipment.tracking_number} for ${shipment.po_number} was cancelled`,
            ref: shipment.tracking_number,
            severity: 'warning',
          })
        }
        return shipment
      },
    },

    // Notifications & Alerts — the transparency feed. Every member sees every transaction
    // any employee performs. Deletion is restricted to the Super Admin, or to normal Admins
    // once the Super Admin grants `allow_admin_delete` in the settings.
    notifications: {
      getFeed: async () => {
        await delay(200)
        return orgNotifications.getOrgNotificationsState(requireOrgId())
      },
      markRead: async (notificationId: string) => {
        await delay(120)
        const session = getOrgSession()
        if (!session) throw new Error('No active organisation session')
        orgNotifications.markOrgNotificationRead(session.orgId, notificationId, session.member.id)
      },
      markAllRead: async () => {
        await delay(150)
        const session = getOrgSession()
        if (!session) throw new Error('No active organisation session')
        orgNotifications.markAllOrgNotificationsRead(session.orgId, session.member.id)
      },
      deleteNotification: async (notificationId: string) => {
        await delay(150)
        const session = getOrgSession()
        if (!session) throw new Error('No active organisation session')
        const { settings } = orgNotifications.loadOrgNotificationsState(session.orgId)
        if (!orgNotifications.canDeleteOrgNotifications(session.member.role, settings)) {
          throw new Error('Not authorised to delete notifications')
        }
        orgNotifications.deleteOrgNotification(session.orgId, notificationId)
      },
      clearAll: async () => {
        await delay(150)
        const session = getOrgSession()
        if (!session) throw new Error('No active organisation session')
        const { settings } = orgNotifications.loadOrgNotificationsState(session.orgId)
        if (!orgNotifications.canDeleteOrgNotifications(session.member.role, settings)) {
          throw new Error('Not authorised to delete notifications')
        }
        orgNotifications.clearOrgNotifications(session.orgId)
      },
      setSettings: async (patch: Partial<orgNotifications.OrgNotificationSettings>) => {
        await delay(150)
        const session = getOrgSession()
        if (!session) throw new Error('No active organisation session')
        if (session.member.role !== 'super-admin') {
          throw new Error('Only the super admin can manage notification settings')
        }
        orgNotifications.setOrgNotificationSettings(session.orgId, patch)
        return orgNotifications.loadOrgNotificationsState(session.orgId).settings
      },
    },
  },
}

function requireOrgId(): string {
  const org = getSessionOrganisation()
  if (!org) throw new Error('No active organisation session')
  return org.id
}

function requireOrgSession(): OrgSession {
  const session = getOrgSession()
  if (!session) throw new Error('No active organisation session')
  return session
}

const SUPPLY_ROLES = ['super-admin', 'logistics-manager']

function requireSupplyPermission(): OrgSession {
  const session = requireOrgSession()
  if (!SUPPLY_ROLES.includes(session.member.role)) {
    throw new Error('Only the supply chain manager or super admin can manage the supply chain')
  }
  return session
}

function requireInventoryPermission(role: OrgMember['role']): void {
  if (!SUPPLY_ROLES.includes(role)) {
    throw new Error('Only the supply chain manager or super admin can modify inventory')
  }
}

function delay(ms: number) {
  return new Promise<void>(res => setTimeout(res, ms))
}
