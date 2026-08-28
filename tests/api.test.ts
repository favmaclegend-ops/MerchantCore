import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import { setOrgSession, type OrgSession } from '@/data/organisations'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(body),
  } as Response
}

function sessionFor(token = 'org-jwt'): OrgSession {
  return {
    orgId: 'ORG-001',
    orgName: 'Kofi Stores',
    member: {
      id: 'M-001',
      name: 'Kofi Mensah',
      email: 'kofi@kofistores.example',
      username: 'kofi',
      password: '',
      phone: '',
      role: 'super-admin',
      jobTitle: 'Owner',
      isActive: true,
      dataBlocked: false,
      disabled: false,
    },
    token,
  }
}

describe('api server guard (live server available to all logins)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('no longer blocks unauthenticated calls — sends the request and lets the backend respond', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response)
    await expect(api.getProfile()).resolves.toBeDefined()
    expect(fetchMock).toHaveBeenCalled()
    const [, init] = fetchMock.mock.calls[0]
    expect(init?.headers).toBeDefined()
    expect(init?.headers).not.toHaveProperty('Authorization')
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

  it('attaches the organisation session token when no personal token is present', async () => {
    const fetchMock = vi.mocked(fetch)
    setOrgSession({
      orgId: 'ORG-001',
      orgName: 'Kofi Stores',
      member: {
        id: 'M-001', name: 'Kofi Mensah', email: 'kofi@example.com', username: 'kofi',
        password: '', phone: '', role: 'super-admin', jobTitle: 'Owner',
        isActive: true, dataBlocked: false, disabled: false,
      },
      token: 'org-jwt',
    })
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ id: 'x' }) } as Response)
    await api.getProfile()
    const [, init] = fetchMock.mock.calls[0]
    expect((init?.headers as Record<string, string>)?.Authorization).toBe('Bearer org-jwt')
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

describe('api.org (real backend organisation workspace)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registers an organisation through the public auth endpoint', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(jsonResponse({ message: 'registered', org_id: 'ORG-001' }, 201))
    const result = await api.org.register({
      orgName: 'Kofi Stores',
      businessEmail: 'hello@kofistores.example',
      superAdminName: 'Kofi Mensah',
      superAdminUsername: 'kofi',
      superAdminEmail: 'kofi@kofistores.example',
      password: 'Pass@123',
    })
    expect(result.org_id).toBe('ORG-001')
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/auth/org/register`)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body).toEqual({
      name: 'Kofi Stores',
      business_email: 'hello@kofistores.example',
      username: 'kofi',
      full_name: 'Kofi Mensah',
      password: 'Pass@123',
    })
  })

  it('verifies an organisation email through the public endpoint', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(jsonResponse({ message: 'verified' }))
    await api.org.verifyEmail('kofi@kofistores.example', '123456')
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/auth/org/verify-email`)
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      email: 'kofi@kofistores.example',
      otp: '123456',
    })
  })

  it('logs in and maps the snake_case response to the app contract', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      jsonResponse({
        access_token: 'jwt-123',
        token_type: 'bearer',
        member_id: 'M-001',
        role: 'super-admin',
        full_name: 'Kofi Mensah',
        username: 'kofi',
        email: 'kofi@kofistores.example',
        org_id: 'ORG-001',
        org_name: 'Kofi Stores',
      }),
    )
    const result = await api.org.login('Kofi Stores', 'kofi@kofistores.example', 'Pass@123')
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/auth/org/login`)
    expect(result.token).toBe('jwt-123')
    expect(result.org).toEqual({ id: 'ORG-001', name: 'Kofi Stores' })
    expect(result.member).toMatchObject({ id: 'M-001', name: 'Kofi Mensah', role: 'super-admin' })
  })

  it('requires an active organisation session for org endpoints', async () => {
    const fetchMock = vi.mocked(fetch)
    await expect(api.org.getUsers()).rejects.toThrow('No active organisation session')
    await expect(api.org.finance.getState()).rejects.toThrow('No active organisation session')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('authenticates org requests with the org session token, not the personal token', async () => {
    localStorage.setItem('token', 'personal-tok')
    setOrgSession(sessionFor('org-jwt'))
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(jsonResponse({ members: [] }))
    await api.org.getUsers()
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/organisations/ORG-001/members`)
    const [, options] = fetchMock.mock.calls[0]
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer org-jwt' })
    expect(String(options?.headers)).not.toContain('personal-tok')
  })

  it('maps member responses into the camelCase app contract', async () => {
    setOrgSession(sessionFor())
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      jsonResponse({
        members: [
          {
            id: 'M-002',
            name: 'Ama Serwaa',
            email: 'ama@kofistores.example',
            username: 'ama',
            phone: '+233',
            role: 'staff',
            jobTitle: 'Cashier',
            isActive: true,
            dataBlocked: false,
            disabled: false,
          },
        ],
      }),
    )
    const users = await api.org.getUsers()
    expect(users[0]).toMatchObject({
      id: 'M-002',
      name: 'Ama Serwaa',
      jobTitle: 'Cashier',
      role: 'staff',
      isActive: true,
    })
  })

  it('serves the organisation dashboard aggregate', async () => {
    setOrgSession(sessionFor())
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      jsonResponse({
        stats: { totalRevenue: 250, totalSales: 4, creditOutstanding: 10, customersCount: 3, productsCount: 8 },
        revenueTrend: [{ date: '2026-08-01', revenue: 100 }],
        stockLevels: [{ name: 'Milk', stock: 2, status: 'low-stock' }],
      }),
    )
    const dashboard = await api.org.getDashboard()
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/organisations/ORG-001/dashboard`)
    expect(dashboard).toMatchObject({ stats: { totalRevenue: 250 } })
  })
})
