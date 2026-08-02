import { api } from './api'

const CACHE_TTL = 5 * 60 * 1000
const CACHE_KEY = 'dashboard_cache'

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

export function loadDashboardCache(): DashboardCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache: DashboardCache = JSON.parse(raw)
    if (Date.now() - cache.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return cache
  } catch {
    return null
  }
}

export function saveDashboardCache(data: Omit<DashboardCache, 'timestamp'>) {
  try {
    const cache: DashboardCache = { ...data, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
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
