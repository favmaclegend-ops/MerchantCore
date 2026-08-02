import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadDashboardCache, refreshDashboardCache, saveDashboardCache, type DashboardCache } from '@/lib/dashboardCache'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    getDashboardStats: vi.fn(),
    getRevenueTrend: vi.fn(),
    getTransactions: vi.fn(),
    getProducts: vi.fn(),
  },
}))

const mockApi = vi.mocked(api)

const TTL = 5 * 60 * 1000

function makeCache(): Omit<DashboardCache, 'timestamp'> {
  return {
    stats: {
      totalRevenue: 100, monthlyRevenue: 100, totalOrders: 1, activeCustomers: 1,
      lowStockAlerts: 1, inventoryValue: 10, creditOutstanding: 1, avgTicket: 1, totalProducts: 1,
    },
    revenueMonths: ['Aug'],
    revenueData: [100],
    txns: [],
    alertList: [],
  }
}

describe('dashboardCache', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('saves and loads a fresh cache', () => {
    saveDashboardCache(makeCache())
    const cache = loadDashboardCache()
    expect(cache?.stats.totalRevenue).toBe(100)
    expect(typeof cache?.timestamp).toBe('number')
  })

  it('returns null when nothing is stored', () => {
    expect(loadDashboardCache()).toBeNull()
  })

  it('returns null and clears expired caches', () => {
    localStorage.setItem('dashboard_cache', JSON.stringify({ ...makeCache(), timestamp: Date.now() - TTL - 1 }))
    expect(loadDashboardCache()).toBeNull()
    expect(localStorage.getItem('dashboard_cache')).toBeNull()
  })

  it('returns null for corrupt cache data', () => {
    localStorage.setItem('dashboard_cache', 'not-json')
    expect(loadDashboardCache()).toBeNull()
  })

  describe('refreshDashboardCache', () => {
    it('merges API data and flags low-stock alerts', async () => {
      mockApi.getDashboardStats.mockResolvedValue({ totalRevenue: 250 })
      mockApi.getRevenueTrend.mockResolvedValue({
        months: [
          { month: 'Jul', revenue: 1 },
          { month: 'Aug', revenue: 2 },
        ],
      })
      mockApi.getTransactions.mockResolvedValue([{ id: 't1', type: 'sale', amount: 5 }])
      mockApi.getProducts.mockResolvedValue([
        { id: 'p1', status: 'ok' },
        { id: 'p2', status: 'low-stock' },
      ])

      const result = await refreshDashboardCache()

      expect(result?.stats.totalRevenue).toBe(250)
      expect(result?.revenueMonths).toEqual(['Jul', 'Aug'])
      expect(result?.revenueData).toEqual([1, 2])
      expect(result?.txns).toEqual([{ id: 't1', type: 'sale', amount: 5 }])
      expect(result?.alertList).toHaveLength(1)
      expect(result?.alertList[0].type).toBe('low-stock')

      const cached = loadDashboardCache()
      expect(cached?.alertList).toHaveLength(1)
    })

    it('uses defaults when every API call fails', async () => {
      mockApi.getDashboardStats.mockRejectedValue(new Error('boom'))
      mockApi.getRevenueTrend.mockRejectedValue(new Error('boom'))
      mockApi.getTransactions.mockRejectedValue(new Error('boom'))
      mockApi.getProducts.mockRejectedValue(new Error('boom'))

      const result = await refreshDashboardCache()
      expect(result?.stats.totalRevenue).toBe(0)
      expect(result?.txns).toEqual([])
      expect(result?.alertList).toEqual([])
      expect(loadDashboardCache()).not.toBeNull()
    })
  })
})
