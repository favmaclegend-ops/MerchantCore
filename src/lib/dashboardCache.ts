import { api } from './api'

const CACHE_TTL = 5 * 60 * 1000
const CACHE_KEY = 'dashboard_cache'
export const ORG_CACHE_KEY = 'org_dashboard_cache'

export interface DashboardStats {
  totalRevenue: number
  monthlyRevenue: number
  totalOrders: number
  activeCustomers: number
  lowStockAlerts: number
  inventoryValue: number
  creditOutstanding: number
  avgTicket: number
  totalProducts: number
}

export interface Tx {
  id: string
  type: string
  customer_name?: string
  amount: number
  status: string
  items?: string
  date?: string
  created_at?: string
}

export interface DashboardAlert {
  id: string
  type: 'low-stock' | 'overdue' | 'system' | 'info'
  title: string
  description: string
}

export interface DashboardCache {
  stats: DashboardStats
  revenueMonths: string[]
  revenueData: number[]
  txns: Tx[]
  alertList: DashboardAlert[]
  timestamp: number
}

export const defaultStats: DashboardStats = { totalRevenue: 0, monthlyRevenue: 0, totalOrders: 0, activeCustomers: 0, lowStockAlerts: 0, inventoryValue: 0, creditOutstanding: 0, avgTicket: 0, totalProducts: 0 }

export function loadDashboardCache(key: string = CACHE_KEY): DashboardCache | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const cache: DashboardCache = JSON.parse(raw)
    if (Date.now() - cache.timestamp > CACHE_TTL) {
      localStorage.removeItem(key)
      return null
    }
    return cache
  } catch {
    return null
  }
}

export function saveDashboardCache(data: Omit<DashboardCache, 'timestamp'>, key: string = CACHE_KEY) {
  try {
    const cache: DashboardCache = { ...data, timestamp: Date.now() }
    localStorage.setItem(key, JSON.stringify(cache))
  } catch {
    return
  }
}

export async function refreshDashboardCache(): Promise<DashboardCache | null> {
  const [s, trend, t, p] = await Promise.all([
    api.getDashboardStats().catch(() => null),
    api.getRevenueTrend().catch(() => null),
    api.getTransactions().catch(() => [] as Tx[]),
    api.getProducts().catch(() => []),
  ])

  const lowItems = (p || []).filter(x => x.status === 'low-stock')
  const alertList: DashboardAlert[] = lowItems.length
    ? [{ id: 'low-stock-1', type: 'low-stock', title: 'Low Stock Alert', description: `${lowItems.length} items are running low on stock. Restock suggested.` }]
    : []

  const data = {
    stats: s || defaultStats,
    revenueMonths: trend ? trend.months.map(m => m.month) : [],
    revenueData: trend ? trend.months.map(m => m.revenue) : [],
    txns: t || [],
    alertList,
  }
  saveDashboardCache(data)
  return { ...data, timestamp: Date.now() }
}

// Organisation dashboard — real backend aggregate at GET /organisations/{org_id}/dashboard.
// Mapped onto the same cache shape and stored under its own key so it can never collide
// with the personal-login cache.
export async function refreshOrgDashboardCache(): Promise<DashboardCache | null> {
  const [dashboard, txns, products] = await Promise.all([
    api.org.getDashboard().catch(() => null),
    api.org.getTransactions().catch(() => [] as Tx[]),
    api.org.getProducts().catch(() => []),
  ])

  const rawStats = (dashboard?.stats ?? {}) as Record<string, unknown>
  const trend = (dashboard?.revenueTrend ?? []) as Array<{ date: string; revenue: number }>
  const stockLevels = (dashboard?.stockLevels ?? []) as Array<{ name: string; stock: number; status: string }>

  const lowItems = stockLevels.filter(s => s.status === 'low-stock' || s.status === 'out-of-stock')
  const now = new Date()
  const monthlyRevenue = trend
    .filter(t => {
      const d = new Date(t.date)
      return !Number.isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, t) => sum + Number(t.revenue ?? 0), 0)

  const totalSales = Number(rawStats.totalSales ?? 0)
  const totalRevenue = Number(rawStats.totalRevenue ?? 0)
  const inventoryValue = (products || []).reduce((sum, p) => sum + Number(p.stock) * Number(p.price ?? 0), 0)

  const alertList: DashboardAlert[] = lowItems.slice(0, 5).map((s, i) => ({
    id: `low-stock-${i}`,
    type: 'low-stock',
    title: 'Low Stock Alert',
    description: `${s.name} has ${s.stock} units left. Restock suggested.`,
  }))

  const data = {
    stats: {
      totalRevenue,
      monthlyRevenue,
      totalOrders: totalSales,
      activeCustomers: Number(rawStats.customersCount ?? 0),
      lowStockAlerts: lowItems.length,
      inventoryValue,
      creditOutstanding: Number(rawStats.creditOutstanding ?? 0),
      avgTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
      totalProducts: Number(rawStats.productsCount ?? 0),
    },
    revenueMonths: trend.map(t => t.date),
    revenueData: trend.map(t => Number(t.revenue ?? 0)),
    txns: txns || [],
    alertList,
  }
  saveDashboardCache(data, ORG_CACHE_KEY)
  return { ...data, timestamp: Date.now() }
}
