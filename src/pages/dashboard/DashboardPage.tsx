import { useEffect, useState, useContext, useRef } from 'react'
import { ArrowUpRight, AlertTriangle, DollarSign, Package, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DLineChart from '@/components/layout/chart'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { CurrencyContext } from '@/context/currency_context'
import { loadDashboardCache, saveDashboardCache, refreshDashboardCache, refreshOrgDashboardCache, defaultStats, ORG_CACHE_KEY, type Tx, type DashboardAlert, type DashboardStats } from '@/lib/dashboardCache'
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

const hideScrollbar: React.CSSProperties = { scrollbarWidth: 'none' as const }

function SkeletonStatCard({ pad }: { pad: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: pad, boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ ...skeletonPulse, width: '70px', height: '10px' }} />
        <div style={{ ...skeletonPulse, width: '12px', height: '12px' }} />
      </div>
      <div style={{ ...skeletonPulse, width: '80px', height: '20px', marginBottom: '6px' }} />
      <div style={{ ...skeletonPulse, width: '100px', height: '8px' }} />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div style={{ width: '100%', padding: '14px', background: 'var(--bg-surface)', borderRadius: '14px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ ...skeletonPulse, width: '110px', height: '14px' }} />
        <div style={{ ...skeletonPulse, width: '90px', height: '22px' }} />
      </div>
      <div style={{ ...skeletonPulse, width: '100%', height: '160px' }} />
    </div>
  )
}

function SkeletonTxRow() {
  return (
    <div style={{ width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ ...skeletonPulse, width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...skeletonPulse, width: '120px', height: '10px', marginBottom: '5px' }} />
        <div style={{ ...skeletonPulse, width: '90px', height: '8px' }} />
      </div>
      <div style={{ ...skeletonPulse, width: '70px', height: '10px', flexShrink: 0 }} />
    </div>
  )
}

function SkeletonAlerts() {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: '14px' }}>
      <div style={{ ...skeletonPulse, width: '50px', height: '14px', marginBottom: '10px' }} />
      <div style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--bg-tertiary)', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ ...skeletonPulse, width: '12px', height: '12px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...skeletonPulse, width: '90px', height: '8px', marginBottom: '4px' }} />
            <div style={{ ...skeletonPulse, width: '140px', height: '8px' }} />
          </div>
        </div>
      </div>
      <div style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--bg-tertiary)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ ...skeletonPulse, width: '12px', height: '12px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...skeletonPulse, width: '90px', height: '8px', marginBottom: '4px' }} />
            <div style={{ ...skeletonPulse, width: '140px', height: '8px' }} />
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
  const { user, orgUser } = useContext(Authcontext)

  const isOrg = !!orgUser

  const [cacheSnapshot] = useState(() => (isOrg ? loadDashboardCache(ORG_CACHE_KEY) : loadDashboardCache()))
  const [stats, setStats] = useState<DashboardStats>(cacheSnapshot?.stats ?? defaultStats)
  const [revenueMonths, setRevenueMonths] = useState<string[]>(cacheSnapshot?.revenueMonths ?? [])
  const [revenueData, setRevenueData] = useState<number[]>(cacheSnapshot?.revenueData ?? [])
  const [txns, setTxns] = useState<Tx[]>(cacheSnapshot?.txns ?? [])
  const [alertList, setAlertList] = useState<DashboardAlert[]>(cacheSnapshot?.alertList ?? [])
  const [loading, setLoading] = useState(!cacheSnapshot)

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
    if (isOrg) {
      saveDashboardCache({ stats, revenueMonths, revenueData, txns: [], alertList }, ORG_CACHE_KEY)
    } else {
      saveDashboardCache({ stats, revenueMonths, revenueData, txns: [], alertList })
    }
  }

  const fetchId = useRef(0)

  useEffect(() => {
    const id = ++fetchId.current
    if (cacheSnapshot) return

    const refresh = isOrg ? refreshOrgDashboardCache() : refreshDashboardCache()
    refresh.then((data) => {
      if (id !== fetchId.current || !data) return
      setStats(data.stats)
      setRevenueMonths(data.revenueMonths)
      setRevenueData(data.revenueData)
      setTxns(data.txns)
      setAlertList(data.alertList)
    }).finally(() => {
      if (id === fetchId.current) setLoading(false)
    })
  }, [cacheSnapshot, isOrg])

  const rangeChart = chartRange === '6m' ? { labels: revenueMonths, data: revenueData } : computeRangeChart(txns, chartRange)

  const dataBlocked = !!orgUser && orgUser.dataBlocked

  const tiny = bp.xxsm
  const mobile = bp.sm
  const cardPad = tiny ? '10px' : mobile ? '12px' : '16px'
  const gridGap = tiny ? '8px' : '12px'
  const valFs = tiny ? '15px' : mobile ? '17px' : '20px'
  const subFs = tiny ? '8px' : '10px'
  const sectionGap = mobile ? '20px' : '32px'

  const ellipsis: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, minWidth: 0 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sectionGap, width: '100%', padding: '0 8px', paddingBlockEnd: '2rem' }}>

      {/* Welcome banner */}
      <div style={{ width: '100%', padding: mobile ? '12px' : '16px', borderRadius: '14px', background: '#0f172a' }}>
        <h1 style={{ fontSize: mobile ? '17px' : '20px', fontWeight: 700, color: 'var(--text-on-dark)', margin: 0, ...ellipsis }}>{orgUser?.username || user?.username || 'Dashboard'}</h1>
        <p style={{ fontSize: subFs, color: 'var(--text-muted)', marginTop: '4px', marginBottom: 0, ...ellipsis }}>
          {loading ? 'Loading your data...' : "Here's what's happening with MerchantCore today."}
        </p>
      </div>

      {dataBlocked ? (
        <div style={{ width: '100%', padding: '40px 16px', background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-danger)', textAlign: 'center' }}>
          <AlertTriangle style={{ width: '28px', height: '28px', color: 'var(--text-danger)', margin: '0 auto' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '12px 0 0 0' }}>You have been blocked from seeing this data</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
            Your administrator has restricted your dashboard access. Contact them for more information.
          </p>
        </div>
      ) : loading ? (
        <>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: gridGap }}>
            <SkeletonStatCard pad={cardPad} />
            <SkeletonStatCard pad={cardPad} />
            <SkeletonStatCard pad={cardPad} />
            <SkeletonStatCard pad={cardPad} />
          </div>
          <SkeletonChart />
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? '2fr 1fr' : '1fr', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: cardPad, display: 'flex', flexDirection: 'column' }}>
              <div style={{ ...skeletonPulse, width: '110px', height: '14px', marginBottom: '10px' }} />
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
          {/* Stat cards */}
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: gridGap }}>

            {/* Total Revenue */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: cardPad, boxShadow: 'var(--shadow-card)', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: subFs, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', ...ellipsis }}>Total Revenue</span>
                <DollarSign style={{ width: '12px', height: '12px', color: 'var(--text-placeholder)', flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: valFs, fontWeight: 700, color: 'var(--text-primary)', margin: 0, ...ellipsis }}>{format(stats.totalRevenue)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px', minWidth: 0 }}>
                <ArrowUpRight style={{ width: '12px', height: '12px', color: 'var(--text-success)', flexShrink: 0 }} />
                <span style={{ fontSize: subFs, fontWeight: 500, color: 'var(--text-success)', ...ellipsis }}>{format(stats.monthlyRevenue)} this month</span>
              </div>
            </div>

            {/* Orders */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: cardPad, boxShadow: 'var(--shadow-card)', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: subFs, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', ...ellipsis }}>Orders</span>
                <TrendingUp style={{ width: '12px', height: '12px', color: 'var(--text-placeholder)', flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: valFs, fontWeight: 700, color: 'var(--text-primary)', margin: 0, ...ellipsis }}>{stats.totalOrders}</p>
              <div style={{ marginTop: '4px', fontSize: subFs, color: 'var(--text-muted)', ...ellipsis }}>
                <span>{stats.activeCustomers} active</span>
                <span style={{ color: 'var(--text-placeholder)' }}> · </span>
                <span>{format(stats.avgTicket)} avg</span>
              </div>
            </div>

            {/* Inventory */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: cardPad, display: 'flex', flexDirection: 'column', gap: mobile ? '8px' : '12px', boxShadow: 'var(--shadow-card)', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                <span style={{ fontSize: subFs, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', ...ellipsis }}>Inventory</span>
                <Package style={{ width: '12px', height: '12px', color: 'var(--text-placeholder)', flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: valFs, fontWeight: 700, color: 'var(--text-primary)', margin: 0, ...ellipsis }}>{format(stats.inventoryValue)}</p>
              <p style={{ fontSize: subFs, color: 'var(--text-muted)', margin: 0, ...ellipsis }}>{stats.totalProducts} products</p>
            </div>

            {/* Credit Outstanding */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: cardPad, display: 'flex', flexDirection: 'column', gap: mobile ? '8px' : '12px', boxShadow: 'var(--shadow-card)', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                <span style={{ fontSize: subFs, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', ...ellipsis }}>Credit</span>
                <AlertTriangle style={{ width: '12px', height: '12px', color: 'var(--text-warning)', flexShrink: 0 }} />
              </div>
              <p style={{ fontSize: valFs, fontWeight: 700, color: 'var(--text-warning)', margin: 0, ...ellipsis }}>{format(stats.creditOutstanding)}</p>
              <p style={{ fontSize: subFs, color: 'var(--text-muted)', margin: 0, ...ellipsis }}>{stats.lowStockAlerts} low stock</p>
            </div>

          </div>

          {/* Chart */}
          <div style={{ width: '100%', padding: mobile ? '12px' : '16px', background: 'var(--bg-surface)', borderRadius: '14px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minWidth: 0 }}>
              <h3 style={{ fontWeight: 700, fontSize: mobile ? '14px' : '16px', margin: 0, flexShrink: 0 }}>Revenue Trend</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px', borderRadius: '8px', background: 'var(--bg-tertiary)', overflowX: 'auto', maxWidth: '100%', flex: 1, minWidth: 0, ...hideScrollbar }}>
                {RANGE_OPTIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleChartRange(r.id)}
                    style={{
                      padding: tiny ? '4px 7px' : '5px 9px', borderRadius: '6px', fontSize: tiny ? '10px' : '11px', fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
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
              <DLineChart key={chartRange} datas={rangeChart.data} labels={rangeChart.labels} mobileHeight={mobile ? 'min(220px, 36vh)' : undefined} />
            ) : (
              <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-placeholder)', fontSize: '12px' }}>
                No revenue data yet
              </div>
            )}
          </div>

          {/* Bottom section: Transactions + Alerts */}
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? '2fr 1fr' : '1fr', gap: '16px', minWidth: 0 }}>

            {/* Recent Transactions */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: cardPad, display: 'flex', flexDirection: 'column', gap: mobile ? '10px' : '14px', width: '100%', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--bg-tertiary)', gap: '8px', minWidth: 0 }}>
                <h3 style={{ fontSize: mobile ? '14px' : '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, ...ellipsis }}>Recent Transactions</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button onClick={handleClearTxns} style={{ fontSize: subFs, color: 'var(--text-danger)', background: 'none', border: '1px solid var(--border-danger)', borderRadius: '6px', padding: '2px 6px', cursor: 'pointer', flexShrink: 0 }}>Clear</button>
                  <button onClick={() => navigate('/home/pos')} style={{ fontSize: subFs, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>View All</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? '8px' : '12px' }}>
                {txns.slice(0, 5).map((tx) => (
                  <div key={tx.id} style={{ width: '100%', padding: mobile ? '8px 10px' : '8px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, overflow: 'hidden', background: 'var(--bg-page)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? '8px' : '10px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <div style={{
                        width: mobile ? '28px' : '32px', height: mobile ? '28px' : '32px', borderRadius: '8px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: tx.type === 'sale' ? 'var(--bg-success)' : tx.type === 'payment' ? 'var(--bg-info)' : 'var(--bg-warning)',
                        color: tx.type === 'sale' ? 'var(--text-success)' : tx.type === 'payment' ? 'var(--text-info)' : 'var(--text-warning)',
                      }}>
                        {tx.type === 'sale' || tx.type === 'payment' ? <DollarSign style={{ width: '12px', height: '12px' }} /> : <Package style={{ width: '12px', height: '12px' }} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontSize: mobile ? '11px' : '12px', fontWeight: 500, color: 'var(--text-primary)', margin: 0, ...ellipsis }}>{tx.customer_name || 'Transaction'} #{tx.id}</p>
                        <p style={{ fontSize: subFs, color: 'var(--text-muted)', margin: '2px 0 0 0', ...ellipsis }}>{tx.items}{formatTxTime(tx)}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                      <p style={{ fontSize: mobile ? '11px' : '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, ...ellipsis }}>{format(tx.amount)}</p>
                      <p style={{ fontSize: subFs, fontWeight: 600, textTransform: 'uppercase', color: tx.status === 'completed' ? 'var(--text-success)' : 'var(--text-info)', margin: 0, ...ellipsis }}>{tx.status}</p>
                    </div>
                  </div>
                ))}
                {txns.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', textAlign: 'center', padding: '16px 0', margin: 0 }}>No transactions yet</p>}
              </div>
            </div>

            {/* Alerts */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
              <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid var(--border-default)', padding: cardPad, display: 'flex', flexDirection: 'column', gap: mobile ? '10px' : '14px', width: '100%', minWidth: 0, overflow: 'hidden' }}>
                <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--bg-tertiary)' }}>
                  <h3 style={{ fontSize: mobile ? '14px' : '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Alerts</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? '8px' : '10px' }}>
                  {alertList.map((alert) => (
                    <div key={alert.id} style={{
                      padding: mobile ? '8px' : '10px', borderRadius: '8px', border: '1px solid',
                      background: alert.type === 'low-stock' ? 'var(--bg-warning)' : alert.type === 'overdue' ? 'var(--bg-danger)' : 'var(--bg-secondary)',
                      borderColor: alert.type === 'low-stock' ? 'var(--border-warning)' : alert.type === 'overdue' ? 'var(--border-danger)' : 'var(--border-default)',
                      overflow: 'hidden',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', minWidth: 0 }}>
                        <AlertTriangle style={{ width: '12px', height: '12px', marginTop: '2px', flexShrink: 0, color: alert.type === 'low-stock' ? 'var(--text-warning)' : alert.type === 'overdue' ? 'var(--text-danger)' : undefined }} />
                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <p style={{ fontSize: subFs, fontWeight: 600, color: 'var(--text-primary)', margin: 0, ...ellipsis }}>{alert.title}</p>
                          <p style={{ fontSize: subFs, color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3, margin: '2px 0 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{alert.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {alertList.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', textAlign: 'center', padding: '12px 0', margin: 0 }}>No alerts</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
