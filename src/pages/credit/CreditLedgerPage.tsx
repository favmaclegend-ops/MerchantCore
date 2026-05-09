import { useEffect, useState } from 'react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'

const statusStyle = (status: string) => {
  switch (status) {
    case 'active': return { background: '#ecfdf5', color: '#047857' }
    case 'overdue': return { background: '#fffbeb', color: '#b45309' }
    case 'critical': return { background: '#fef2f2', color: '#b91c1c' }
    default: return { background: '#f1f5f9', color: '#475569' }
  }
}

export function CreditLedgerPage() {
  const bp = useBreakpoint()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCreditEntries().then(e => setEntries(e)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalOutstanding = entries.reduce((s, e) => s + (e.balance || 0), 0)
  const overdueCount = entries.filter(e => e.status === 'overdue' || e.status === 'critical').length
  const collectedMtd = entries.filter(e => e.last_payment_amount).reduce((s, e) => s + (e.last_payment_amount || 0), 0)

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: bp.sm ? 'repeat(3, 1fr)' : '1fr', gap: '12px' }}>
        <div style={{ background: '#0f172a', borderRadius: '8px', padding: '16px', color: '#fff' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Outstanding</span>
          <p style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', margin: '4px 0 0 0' }}>${totalOutstanding.toLocaleString()}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Overdue Accounts</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginTop: '4px', margin: '4px 0 0 0' }}>{overdueCount}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Collected</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#059669', marginTop: '4px', margin: '4px 0 0 0' }}>${collectedMtd.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Debtor Registry</h3>
            <span style={{ fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '999px' }}>{entries.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select style={{ fontSize: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px 8px', background: '#fff', color: '#0f172a' }}>
              <option>Status: All</option>
              <option>Active</option>
              <option>Overdue</option>
              <option>Critical</option>
            </select>
            <button style={{ padding: '4px 12px', fontSize: '10px', fontWeight: 500, color: '#fff', background: '#0f172a', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
              + New Entry
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ fontSize: '10px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ textAlign: 'left', fontWeight: 500, padding: '12px' }}>Customer</th>
                <th style={{ textAlign: 'right', fontWeight: 500, padding: '12px' }}>Balance</th>
                <th style={{ textAlign: 'left', fontWeight: 500, padding: '12px' }}>Last Payment</th>
                <th style={{ textAlign: 'left', fontWeight: 500, padding: '12px' }}>Status</th>
                <th style={{ textAlign: 'right', fontWeight: 500, padding: '12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: any) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', background: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>{entry.customer_name?.split(' ').map((n: string) => n[0]).join('') || '??'}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', margin: 0 }}>{entry.customer_name}</p>
                        <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>{entry.customer_code}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>${entry.balance?.toLocaleString() || '0'}</td>
                  <td style={{ padding: '12px' }}>
                    <p style={{ fontSize: '10px', color: '#0f172a', whiteSpace: 'nowrap', margin: 0 }}>{entry.last_payment}</p>
                    {entry.last_payment_amount && <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>${entry.last_payment_amount} PARTIAL</p>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '2px 6px', fontSize: '10px', fontWeight: 500, borderRadius: '999px', whiteSpace: 'nowrap',
                      ...statusStyle(entry.status),
                    }}>
                      {entry.status === 'active' ? 'Active' : `${entry.overdue_days || ''}d`}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>•••</button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && !loading && (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>No credit entries yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
