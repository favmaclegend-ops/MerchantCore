import { useEffect, useState, useContext, useRef } from 'react'
import { ArrowUpRight, AlertTriangle, DollarSign, Package, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DLineChart from '@/components/layout/chart'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { CurrencyContext } from '@/context/currency_context'
import { loadDashboardCache, saveDashboardCache, refreshDashboardCache, defaultStats, type Tx, type DashboardAlert } from '@/lib/dashboardCache'
import { Authcontext } from '@/context'

const CHART_RANGE_KEY = 'dashboard_chart_range'

const RANGE_OPTIONS = [
  { id: '6m', label: 'Last 6 months' },
  { id: '7d', label: 'Last 7 days' },
  { id: '24h', label: 'Last 24 hours' },
  { id: '60m', label: 'Last 60 min' },
] as const

type ChartRange = (typeof RANGE_OPTIONS)[number]['id']

const RANGE_CONFIG: Record<'7d' | '24h' | '60m', { count: number; step: number; label: (d: Date) => string }> = {
  '60m': {
    count: 60,
    step: 60 * 1000,
    label: d => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }),
  },
  '24h': {
    count: 24,
    step: 60 * 60 * 1000,
    label: d => d.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true }),
  },
  '7d': {
    count: 7,
    step: 24 * 60 * 60 * 1000,
    label: d => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
  },
}

function computeRangeChart(txns: Tx[], range: '7d' | '24h' | '60m'): { labels: string[]; data: number[] } {
  const now = new Date()
  const config = RANGE_CONFIG[range]
  const start = now.getTime() - (config.count - 1) * config.step

  const labels: string[] = []
  for (let i = 0; i < config.count; i++) {
    labels.push(config.label(new Date(start + i * config.step)))
  }

  const data = new Array(config.count).fill(0) as number[]
  for (const tx of txns) {
    const raw = tx.created_at || tx.date
    if (!raw) continue
    const t = new Date(raw).getTime()
    if (Number.isNaN(t)) continue
    const clamped = Math.min(t, now.getTime())
    if (clamped < start) continue
    const idx = Math.floor((clamped - start) / config.step)
    if (idx >= 0 && idx < config.count) data[idx] += Number(tx.amount) || 0
  }

  return { labels, data }
}

function formatTxTime(tx: Tx): string {
  const raw = tx.created_at || tx.date
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ` • ${raw}`
  return ` • ${d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}`
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
  const [cacheSnapshot] = useState(loadDashboardCache)
  const [stats, setStats] = useState(cacheSnapshot?.stats ?? defaultStats)
  const [revenueMonths, setRevenueMonths] = useState<string[]>(cacheSnapshot?.revenueMonths ?? [])
  const [revenueData, setRevenueData] = useState<number[]>(cacheSnapshot?.revenueData ?? [])
  const [txns, setTxns] = useState<Tx[]>(cacheSnapshot?.txns ?? [])
  const [alertList, setAlertList] = useState<DashboardAlert[]>(cacheSnapshot?.alertList ?? [])
  const [loading, setLoading] = useState(!cacheSnapshot)
  const {user} = useContext(Authcontext)
  
  const [chartRange, setChartRange] = useState<ChartRange>(() => {
    try {
      const saved = localStorage.getItem(CHART_RANGE_KEY)
      if (saved && RANGE_OPTIONS.some(r => r.id === saved)) return saved as ChartRange
    } catch {
      return '6m'
    }
    return '6m'
  })

  const handleChartRange = (id: ChartRange) => {
    setChartRange(id)
    try {
      localStorage.setItem(CHART_RANGE_KEY, id)
    } catch {
      return
    }
  }

  const handleClearTxns = () => {
    setTxns([])
    saveDashboardCache({ stats, revenueMonths, revenueData, txns: [], alertList })
  }

  const fetchId = useRef(0)

  useEffect(() => {
    const id = ++fetchId.current
    if (cacheSnapshot) return

    refreshDashboardCache().then((data) => {
      if (id !== fetchId.current || !data) return
      setStats(data.stats)
      setRevenueMonths(data.revenueMonths)
      setRevenueData(data.revenueData)
      setTxns(data.txns)
      setAlertList(data.alertList)
    }).finally(() => {
      if (id === fetchId.current) setLoading(false)
    })
  }, [cacheSnapshot])

  const rangeChart = chartRange === '6m' ? { labels: revenueMonths, data: revenueData } : computeRangeChart(txns, chartRange)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%', padding: '0 8px',paddingBlockEnd: '2rem', }}>
      <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#0f172a' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-on-dark)', margin: 0 }}>{user.username}</h1>
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
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '12px'  }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', padding: '16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>
                <DollarSign style={{ width: '14px', height: '14px', color: 'var(--text-placeholder)' }} />
              </div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{format(stats.totalRevenue)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <ArrowUpRight style={{ width: '14px', height: '14px', color: 'var(--text-success)', flexShrink: 0 }} />
                <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-success)' }}>{format(stats.monthlyRevenue)} this month</span>
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
                <AlertTriangle style={{ width: '14px', height: '14px', color: 'var(--text-warning)' }} />
              </div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-warning)', margin: 0 }}>{format(stats.creditOutstanding)}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{stats.lowStockAlerts} low stock alerts</p>
            </div>
          </div>

          <div style={{ width: '100%', padding: '16px', background: 'var(--bg-surface)', borderRadius: '16px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', margin: 0 }}>Revenue Trend</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px', borderRadius: '8px', background: 'var(--bg-tertiary)', overflowX: 'auto', maxWidth: '100%', scrollbarWidth: 'none' }}>
                {RANGE_OPTIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleChartRange(r.id)}
                    style={{
                      padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      color: chartRange === r.id ? 'var(--text-on-dark)' : 'var(--text-muted)',
                      background: chartRange === r.id ? 'var(--bg-nav-active)' : 'transparent',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            {rangeChart.data.length > 0 ? (
              <DLineChart key={chartRange} datas={rangeChart.data} labels={rangeChart.labels} />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={handleClearTxns} style={{ fontSize: '10px', color: 'var(--text-danger)', background: 'none', border: '1px solid var(--border-danger)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', flexShrink: 0 }}>Clear</button>
                  <button onClick={() => navigate('/home/pos')} style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>View All</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                {txns.slice(0, 5).map((tx) => (
                  <div key={tx.id} style={{ width: '100%', padding: '8px 16px', boxShadow: 'var(--shadow-card)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: tx.type === 'sale' ? 'var(--bg-success)' : tx.type === 'payment' ? 'var(--bg-info)' : 'var(--bg-warning)',
                        color: tx.type === 'sale' ? 'var(--text-success)' : tx.type === 'payment' ? 'var(--text-info)' : 'var(--text-warning)',
                      }}>
                        {tx.type === 'sale' || tx.type === 'payment' ? <DollarSign style={{ width: '14px', height: '14px' }} /> : <Package style={{ width: '14px', height: '14px' }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{tx.customer_name || 'Transaction'} #{tx.id}</p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{tx.items}{formatTxTime(tx)}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{format(tx.amount)}</p>
                      <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: tx.status === 'completed' ? 'var(--text-success)' : 'var(--text-info)', margin: 0 }}>{tx.status}</p>
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
                        <AlertTriangle style={{ width: '14px', height: '14px', marginTop: '2px', flexShrink: 0, color: alert.type === 'low-stock' ? 'var(--text-warning)' : alert.type === 'overdue' ? 'var(--text-danger)' : undefined }} />
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
