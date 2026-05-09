import { useEffect, useState } from 'react'
import { ArrowUpRight, AlertTriangle, DollarSign, Package, Eye } from 'lucide-react'
import DLineChart from '@/components/layout/chart'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'

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

export function DashboardPage() {
  const bp = useBreakpoint()
  const [stats, setStats] = useState({ totalRevenue: 0, monthlyRevenue: 0, totalOrders: 0, activeCustomers: 0, lowStockAlerts: 0, inventoryValue: 0 })
  const [txns, setTxns] = useState<Tx[]>([])
  const [alertList, setAlertList] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getDashboardStats().catch(() => null),
      api.getTransactions().catch(() => [] as Tx[]),
      api.getProducts().catch(() => []),
    ]).then(([s, t, p]) => {
      if (s) setStats(s)
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
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#0f172a' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>Here's what's happening with MerchantCore today.</p>
      </div>

      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: '12px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '1px 6px 3px rgba(128,128,128,0.287)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>
            <button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}><Eye style={{ width: '14px', height: '14px' }} /></button>
          </div>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>${stats.totalRevenue.toLocaleString()}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <ArrowUpRight style={{ width: '14px', height: '14px', color: '#10b981', flexShrink: 0 }} />
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#059669' }}>Current</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '1px 6px 3px rgba(128,128,128,0.287)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders</span>
          </div>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{stats.totalOrders}</p>
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>{stats.activeCustomers} active customers</span>
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '1px 6px 3px rgba(128,128,128,0.287)' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>Inventory Value</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: '4px', margin: 0 }}>${stats.inventoryValue.toLocaleString()}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '1px 6px 3px rgba(128,128,128,0.287)' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>Low Stock Alerts</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#d97706', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            {stats.lowStockAlerts} Items <AlertTriangle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
          </p>
        </div>
      </div>

      <div style={{ width: '100%', padding: '16px', background: '#fff', borderRadius: '16px', boxShadow: '1px 6px 3px rgba(128,128,128,0.287)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 700, fontSize: '16px', margin: 0 }}>Sales</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 3px rgb(227,222,222)', padding: '6px', borderRadius: '6px' }}>
            <img src='https://img.icons8.com/?size=100&id=23&format=png&color=7a7a7a' width="20" height="20" alt='calender' />
            <span style={{ fontSize: '14px' }}>Monthly</span>
          </div>
        </div>
        <DLineChart datas={[2900, 4500, 6709, 1000, 4980, 8370]} labels={['1st', '2nd', '3rd', '4th', '5th', '6th']}/>
      </div>

      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: bp.lg ? '2fr 1fr' : '1fr', gap: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Recent Transactions</h3>
            <button style={{ fontSize: '10px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {txns.slice(0, 5).map((tx) => (
              <div key={tx.id} style={{ width: '100%', padding: '8px 16px', boxShadow: '0 6px 3px rgba(128,128,128,0.287)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: tx.type === 'sale' ? '#ecfdf5' : tx.type === 'payment' ? '#eff6ff' : '#fffbeb',
                    color: tx.type === 'sale' ? '#059669' : tx.type === 'payment' ? '#2563eb' : '#d97706',
                  }}>
                    {tx.type === 'sale' || tx.type === 'payment' ? <DollarSign style={{ width: '14px', height: '14px' }} /> : <Package style={{ width: '14px', height: '14px' }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{tx.customer_name || 'Transaction'} #{tx.id}</p>
                    <p style={{ fontSize: '10px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{tx.items} {tx.date ? `• ${tx.date}` : ''}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>${tx.amount.toLocaleString()}</p>
                  <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: tx.status === 'completed' ? '#059669' : '#2563eb', margin: 0 }}>{tx.status}</p>
                </div>
              </div>
            ))}
            {txns.length === 0 && !loading && <p style={{ fontSize: '12px', color: '#94a3b8' }}>No transactions yet</p>}
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', fontSize: '16px', lineHeight: '16px' }}>
            <div style={{ paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Alerts</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {alertList.map((alert) => (
                <div key={alert.id} style={{
                  padding: '10px', borderRadius: '8px', border: '1px solid',
                  background: alert.type === 'low-stock' ? '#fffbeb' : alert.type === 'overdue' ? '#fef2f2' : '#f8fafc',
                  borderColor: alert.type === 'low-stock' ? '#fde68a' : alert.type === 'overdue' ? '#fecaca' : '#e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <AlertTriangle style={{ width: '14px', height: '14px', marginTop: '2px', flexShrink: 0, color: alert.type === 'low-stock' ? '#f59e0b' : alert.type === 'overdue' ? '#ef4444' : undefined }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '10px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{alert.title}</p>
                      <p style={{ fontSize: '10px', color: '#475569', marginTop: '2px', lineHeight: 1.3, margin: '2px 0 0 0' }}>{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              {alertList.length === 0 && !loading && <p style={{ fontSize: '12px', color: '#94a3b8' }}>No alerts</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
