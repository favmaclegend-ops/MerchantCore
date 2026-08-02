import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import { setOrgSession, type OrgRegisterInput, type OrgSession } from '@/data/organisations'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

const registerInput: OrgRegisterInput = {
  orgName: 'Kofi Stores',
  businessEmail: 'hello@kofistores.example',
  superAdminName: 'Kofi Mensah',
  superAdminUsername: 'kofi',
  superAdminEmail: 'kofi@kofistores.example',
  password: 'Pass@123',
  phone: '+233 555 010 9999',
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  } as Response
}

async function registerAndSession(): Promise<OrgSession> {
  const org = await api.org.register(registerInput)
  return { orgId: org.id, orgName: org.name, member: org.members[0] }
}

describe('api server guard (real server is normal-login only)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects every non-public endpoint without a token, before calling fetch', async () => {
    const fetchMock = vi.mocked(fetch)
    await expect(api.getProfile()).rejects.toThrow(
      'Not authenticated. The live server is only available to normal (personal) logins.',
    )
    await expect(api.getProducts()).rejects.toThrow('Not authenticated')
    await expect(api.getDashboardStats()).rejects.toThrow('Not authenticated')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('allows public auth endpoints without a token', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(jsonResponse({ access_token: 'abc', token_type: 'bearer' }))
    const result = await api.login('a@b.example', 'pw')
    expect(result.access_token).toBe('abc')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/auth/login`)
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST')
  })

  it('attaches the bearer token for authenticated requests', async () => {
    localStorage.setItem('token', 'tok-123')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(jsonResponse({ id: 'u1' }))
    await api.getProfile()
    const [, options] = fetchMock.mock.calls[0]
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer tok-123' })
  })

  it('throws the server detail for failed responses', async () => {
    localStorage.setItem('token', 'tok')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Email already registered' }, 400))
    await expect(
      api.register({ email: 'a@b.example', username: 'a', full_name: 'A', password: 'x' }),
    ).rejects.toThrow('Email already registered')
  })

  it('returns undefined for 204 responses', async () => {
    localStorage.setItem('token', 'tok')
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(jsonResponse(null, 204))
    await expect(api.deleteProduct('p1')).resolves.toBeUndefined()
  })
})

describe('api.org (mock-backed organisation workspace)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('registers and logs into a new organisation', async () => {
    const org = await api.org.register(registerInput)
    expect(org.id).toBe('ORG-002')

    const result = await api.org.login('Kofi Stores', 'kofi@kofistores.example', 'Pass@123')
    expect(result.member.role).toBe('super-admin')
  })

  it('rejects org logins for disabled members', async () => {
    const session = await registerAndSession()
    setOrgSession(session)
    await api.org.updateUser(session.member.id, { disabled: true })
    await expect(api.org.login('Kofi Stores', 'kofi@kofistores.example', 'Pass@123')).rejects.toThrow('disabled')
  })

  it('requires an active session for org endpoints', async () => {
    await expect(api.org.getUsers()).rejects.toThrow('No active organisation session')
    await expect(api.org.finance.getState()).rejects.toThrow('No active organisation session')
  })

  it('manages members of the active organisation', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const users = await api.org.getUsers()
    expect(users).toHaveLength(1)

    const added = await api.org.addUser({
      name: 'Ama', email: 'ama@kofistores.example', username: 'ama', password: 'StaffPass@123',
      phone: '', role: 'staff', jobTitle: 'Cashier', isActive: true, dataBlocked: false, disabled: false,
    })
    expect(added.id).toBe('STF-001')

    const updated = await api.org.updateUser(added.id, { jobTitle: 'Supervisor' })
    expect(updated.jobTitle).toBe('Supervisor')

    await api.org.deleteUser(added.id)
    const after = await api.org.getUsers()
    expect(after.find(u => u.id === added.id)).toBeUndefined()
  })

  it('serves finance state for the active organisation', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const state = await api.org.finance.getState()
    expect(state.invoices).toHaveLength(5)
    expect(state.ledger).toHaveLength(18)

    const created = await api.org.finance.createInvoice({
      customer: 'New Client',
      dueAt: '2030-01-01',
      items: [{ description: 'Service', qty: 2, unitPrice: 25.5 }],
    })
    expect(created.amount).toBe(51)
    expect(created.status).toBe('draft')

    const paid = await api.org.finance.setInvoiceStatus(created.id, 'paid')
    expect(paid.status).toBe('paid')
  })

  it('serves commerce (inventory) for the active organisation', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const products = await api.org.getProducts()
    expect(products).toHaveLength(48)
    expect(products.reduce((sum, p) => sum + p.price * p.stock, 0)).toBe(58200)

    const created = await api.org.createProduct({ name: 'Test Item', sku: 'TST-001', price: 10, stock: 5, category: 'Testing' })
    expect(created.id).toBe('PRD-049')

    const updated = await api.org.updateProduct(created.id, { stock: 0 })
    expect(updated.status).toBe('out-of-stock')

    await api.org.deleteProduct(created.id)
    const after = await api.org.getProducts()
    expect(after.find(p => p.id === created.id)).toBeUndefined()
  })

  it('serves customers and credit for the active organisation', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const customers = await api.org.getCustomers()
    expect(customers).toHaveLength(5)

    const customer = await api.org.createCustomer({ name: 'Ama', email: 'ama@example.com', credit_limit: 1000 })
    expect(customer.tier).toBe('bronze')

    const updatedCustomer = await api.org.updateCustomer(customer.id, { credit_limit: 5000 })
    expect(updatedCustomer.credit_limit).toBe(5000)

    const credit = await api.org.getCreditEntries()
    expect(credit.reduce((sum, e) => sum + e.balance, 0)).toBe(10025)

    const entry = await api.org.updateCreditEntry('CRD-001', { balance: 0 })
    expect(entry.balance).toBe(0)
  })

  it('handles a POS checkout for the active organisation', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const before = (await api.org.getProducts()).find(p => p.id === 'PRD-007')?.stock

    const txn = await api.org.checkout({
      items: [{ id: 'PRD-007', name: 'Bama Rice 5kg', price: 60, quantity: 3 }],
      total: 189,
      payment_method: 'Card',
    })
    expect(txn.type).toBe('sale')
    expect(txn.amount).toBe(189)

    const after = await api.org.getProducts()
    expect(after.find(p => p.id === 'PRD-007')?.stock).toBe((before ?? 0) - 3)

    const log = await api.org.getTransactions()
    expect(log[0].id).toBe(txn.id)
  })

  it('serves HRM data for the active organisation', async () => {
    const session = await registerAndSession()
    setOrgSession(session)

    const state = await api.org.hrm.getState()
    expect(state.employees).toHaveLength(13)
    expect(state.payrollRuns).toHaveLength(11)

    const created = await api.org.hrm.createEmployee({
      name: 'Ama Owusu', email: 'ama@kofistores.example', phone: '', department: 'Sales',
      jobTitle: 'Associate', employmentType: 'full-time', hireDate: '2026-08-01', salary: 1800,
    })
    expect(created.id).toBe('EMP-014')
    expect(created.status).toBe('probation')

    const retired = await api.org.hrm.retireEmployee('EMP-002')
    expect(retired.status).toBe('retired')

    const benefits = await api.org.hrm.getBenefits()
    expect(benefits.find(b => b.id === 'BNF-001')?.enrollment).toBe(9)

    const runs = await api.org.hrm.runPayroll('Sep 2099')
    expect(runs).toHaveLength(11)

    const paid = await api.org.hrm.setPayrollStatus(runs[0].id, 'paid')
    expect(paid.status).toBe('paid')

    const entry = await api.org.hrm.logTime({ employee_id: 'EMP-004', date: '2026-08-01', hours: 8 })
    expect(entry.employee_name).toBe('Michael Owusu')

    const review = await api.org.hrm.createReview({ employee_id: 'EMP-003', period: 'H2 2026', score: 4.7 })
    expect(review.rating).toBe('exceeds')
  })
})
