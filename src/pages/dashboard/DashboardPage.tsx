import { useEffect, useState, useContext, useRef } from 'react'
import { ArrowUpRight, AlertTriangle, DollarSign, Package, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DLineChart from '@/components/layout/chart'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'
import { CurrencyContext } from '@/context/currency_context'

interface Tx {
  id: string
  type: string
  customer_name?: string
  amount: number
  status: string
  items?: string
  date?: string
}

interface Alert {
  id: string
  type: 'low-stock' | 'overdue' | 'system' | 'info'
  title: string
  description: string
}

interface DashboardCache {
  stats: typeof defaultStats
  revenueMonths: string[]
  revenueData: number[]
  txns: Tx[]
  alertList: Alert[]
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000
const CACHE_KEY = 'dashboard_cache'

const defaultStats = { totalRevenue: 0, monthlyRevenue: 0, totalOrders: 0, activeCustomers: 0, lowStockAlerts: 0, inventoryValue: 0, creditOutstanding: 0, avgTicket: 0, totalProducts: 0 }

function loadCache(): DashboardCache | null {
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

function saveCache(data: Omit<DashboardCache, 'timestamp'>) {
  try {
    const cache: DashboardCache = { ...data, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

const skeletonPulse: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--border-default) 50%, var(--bg-tertiary) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
  borderRadius: '8px',
}

function SkeletonStatCard() {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '16px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ ...skeletonPulse, width: '80px', height: '12px' }} />
        <div style={{ ...skeletonPulse, width: '14px', height: '14px' }} />
      </div>
      <div style={{ ...skeletonPulse, width: '100px', height: '24px', marginBottom: '8px' }} />
      <div style={{ ...skeletonPulse, width: '120px', height: '10px' }} />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div style={{ width: '100%', padding: '16px', background: 'var(--bg-surface)', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ ...skeletonPulse, width: '120px', height: '16px' }} />
        <div style={{ ...skeletonPulse, width: '100px', height: '24px' }} />
      </div>
      <div style={{ ...skeletonPulse, width: '100%', height: '180px' }} />
    </div>
  )
}

function SkeletonTxRow() {
  return (
    <div style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ ...skeletonPulse, width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...skeletonPulse, width: '140px', height: '12px', marginBottom: '6px' }} />
        <div style={{ ...skeletonPulse, width: '100px', height: '10px' }} />
      </div>
      <div style={{ ...skeletonPulse, width: '80px', height: '12px' }} />
    </div>
  )
}

function SkeletonAlerts() {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '16px' }}>
      <div style={{ ...skeletonPulse, width: '60px', height: '16px', marginBottom: '12px' }} />
      <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--bg-tertiary)', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ ...skeletonPulse, width: '14px', height: '14px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...skeletonPulse, width: '100px', height: '10px', marginBottom: '4px' }} />
            <div style={{ ...skeletonPulse, width: '160px', height: '10px' }} />
          </div>
        </div>
      </div>
      <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--bg-tertiary)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ ...skeletonPulse, width: '14px', height: '14px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...skeletonPulse, width: '100px', height: '10px', marginBottom: '4px' }} />
            <div style={{ ...skeletonPulse, width: '160px', height: '10px' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const { format } = useContext(CurrencyContext)
  const [stats, setStats] = useState(defaultStats)
  const [revenueMonths, setRevenueMonths] = useState<string[]>([])
  const [revenueData, setRevenueData] = useState<number[]>([])
  const [txns, setTxns] = useState<Tx[]>([])
  const [alertList, setAlertList] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchId = useRef(0)

  useEffect(() => {
    const id = ++fetchId.current

    const cached = loadCache()
    if (cached) {
      setStats(cached.stats)
      setRevenueMonths(cached.revenueMonths)
      setRevenueData(cached.revenueData)
      setTxns(cached.txns)
      setAlertList(cached.alertList)
      setLoading(false)
      return
    }

    Promise.all([
      api.getDashboardStats().catch(() => null),
      api.getRevenueTrend().catch(() => null),
      api.getTransactions().catch(() => [] as Tx[]),
      api.getProducts().catch(() => []),
    ]).then(([s, trend, t, p]) => {
      if (id !== fetchId.current) return
      if (s) setStats(s)
      if (trend) {
        setRevenueMonths(trend.months.map(m => m.month))
        setRevenueData(trend.months.map(m => m.revenue))
      }
      if (t) setTxns(t)
      const alerts: Alert[] = []
      const lowItems = (p as any[]).filter(x => x.status === 'low-stock')
      if (lowItems.length) {
        alerts.push({
          id: 'low-stock-1',
          type: 'low-stock',
          title: 'Low Stock Alert',
          description: `${lowItems.length} items are running low on stock. Restock suggested.`,
        })
      }
      setAlertList(alerts)
      saveCache({
        stats: s || defaultStats,
        revenueMonths: trend ? trend.months.map(m => m.month) : [],
        revenueData: trend ? trend.months.map(m => m.revenue) : [],
        txns: t || [],
        alertList: alerts,
      })
    }).finally(() => {
      if (id === fetchId.current) setLoading(false)
    })
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#0f172a' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--bg-surface)', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0 }}>
          {loading ? 'Loading your data...' : "Here's what's happening with MerchantCore today."}
        </p>
      </div>

      {loading ? (
        <>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '12px' }}>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          <SkeletonChart />
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? '2fr 1fr' : '1fr', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ ...skeletonPulse, width: '120px', height: '16px', marginBottom: '12px' }} />
              <SkeletonTxRow />
              <SkeletonTxRow />
              <SkeletonTxRow />
              <SkeletonTxRow />
            </div>
            <SkeletonAlerts />
          </div>
        </>
      ) : (
        <>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>
                <DollarSign style={{ width: '14px', height: '14px', color: 'var(--text-placeholder)' }} />
              </div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{format(stats.totalRevenue)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <ArrowUpRight style={{ width: '14px', height: '14px', color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '10px', fontWeight: 500, color: '#059669' }}>{format(stats.monthlyRevenue)} this month</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders</span>
                <TrendingUp style={{ width: '14px', height: '14px', color: 'var(--text-placeholder)' }} />
              </div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{stats.totalOrders}</p>
              <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>{stats.activeCustomers} active customers</span> <span style={{ color: 'var(--text-placeholder)' }}>•</span> <span>{format(stats.avgTicket)} avg ticket</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inventory</span>
                <Package style={{ width: '14px', height: '14px', color: 'var(--text-placeholder)' }} />
              </div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{format(stats.inventoryValue)}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{stats.totalProducts} products</p>
            </div>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Credit Outstanding</span>
                <AlertTriangle style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
              </div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#d97706', margin: 0 }}>{format(stats.creditOutstanding)}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{stats.lowStockAlerts} low stock alerts</p>
            </div>
          </div>

          <div style={{ width: '100%', padding: '16px', background: 'var(--bg-surface)', borderRadius: '16px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', margin: 0 }}>Revenue Trend</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 3px rgb(227,222,222)', padding: '6px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Last 6 months
              </div>
            </div>
            {revenueData.length > 0 ? (
              <DLineChart datas={revenueData} labels={revenueMonths} />
            ) : (
              <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-placeholder)', fontSize: '12px' }}>
                No revenue data yet
              </div>
            )}
          </div>

          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? '2fr 1fr' : '1fr', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--bg-tertiary)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Transactions</h3>
                <button onClick={() => navigate('/home/pos')} style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>View All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                {txns.slice(0, 5).map((tx) => (
                  <div key={tx.id} style={{ width: '100%', padding: '8px 16px', boxShadow: 'var(--shadow-card)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: tx.type === 'sale' ? 'var(--bg-success)' : tx.type === 'payment' ? '#eff6ff' : 'var(--bg-warning)',
                        color: tx.type === 'sale' ? '#059669' : tx.type === 'payment' ? '#2563eb' : '#d97706',
                      }}>
                        {tx.type === 'sale' || tx.type === 'payment' ? <DollarSign style={{ width: '14px', height: '14px' }} /> : <Package style={{ width: '14px', height: '14px' }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{tx.customer_name || 'Transaction'} #{tx.id}</p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{tx.items} {tx.date ? `• ${tx.date}` : ''}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{format(tx.amount)}</p>
                      <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: tx.status === 'completed' ? '#059669' : '#2563eb', margin: 0 }}>{tx.status}</p>
                    </div>
                  </div>
                ))}
                {txns.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>No transactions yet</p>}
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', fontSize: '16px', lineHeight: '16px' }}>
                <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--bg-tertiary)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Alerts</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {alertList.map((alert) => (
                    <div key={alert.id} style={{
                      padding: '10px', borderRadius: '8px', border: '1px solid',
                      background: alert.type === 'low-stock' ? 'var(--bg-warning)' : alert.type === 'overdue' ? 'var(--bg-danger)' : 'var(--bg-secondary)',
                      borderColor: alert.type === 'low-stock' ? 'var(--border-warning)' : alert.type === 'overdue' ? 'var(--border-danger)' : 'var(--border-default)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <AlertTriangle style={{ width: '14px', height: '14px', marginTop: '2px', flexShrink: 0, color: alert.type === 'low-stock' ? '#f59e0b' : alert.type === 'overdue' ? '#ef4444' : undefined }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{alert.title}</p>
                          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3, margin: '2px 0 0 0' }}>{alert.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {alertList.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-placeholder)' }}>No alerts</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
