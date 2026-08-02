import {
  addOrgMember,
  deleteOrgMember,
  getSessionOrganisation,
  loginOrganisation,
  registerOrganisation,
  updateOrgMember,
  type OrgMember,
  type OrgRegisterInput,
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
        return createInvoice(org.id, input)
      },
      setInvoiceStatus: async (invoiceId: string, status: Invoice['status']) => {
        await delay(200)
        const org = getSessionOrganisation()
        if (!org) throw new Error('No active organisation session')
        return setInvoiceStatus(org.id, invoiceId, status)
      },
    },

    // Commerce (Inventory / POS / Customers / Credit) — mock-backed. These mirror the
    // normal server API shapes so pages can call `api.org.*` for org accounts and
    // `api.*` for normal accounts interchangeably.
    getProducts: async () => {
      await delay(200)
      return orgCommerce.getOrgProducts(requireOrgId())
    },
    createProduct: async (data: OrgProductInput) => {
      await delay(200)
      return orgCommerce.createOrgProduct(requireOrgId(), data)
    },
    updateProduct: async (id: string, data: Partial<OrgProductInput>) => {
      await delay(200)
      return orgCommerce.updateOrgProduct(requireOrgId(), id, data)
    },
    deleteProduct: async (id: string) => {
      await delay(200)
      orgCommerce.deleteOrgProduct(requireOrgId(), id)
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
      return orgCommerce.updateOrgCreditEntry(requireOrgId(), id, data)
    },

    getTransactions: async () => {
      await delay(200)
      return orgCommerce.getOrgPosTransactions(requireOrgId())
    },
    checkout: async (data: CheckoutInput) => {
      await delay(250)
      return orgCommerce.checkoutOrg(requireOrgId(), data)
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
        return orgHRM.runOrgPayroll(requireOrgId(), period)
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
  },
}

function requireOrgId(): string {
  const org = getSessionOrganisation()
  if (!org) throw new Error('No active organisation session')
  return org.id
}

function delay(ms: number) {
  return new Promise<void>(res => setTimeout(res, ms))
}
