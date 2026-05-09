const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
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

  checkout: (data: { items: any[]; total: number; payment_method: string }) =>
    request<any>('/pos/checkout', { method: 'POST', body: JSON.stringify(data) }),

  getNotifications: () => request<any[]>('/notifications'),
  getUnreadNotificationCount: () => request<{ count: number }>('/notifications/unread-count'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PATCH' }),
}
