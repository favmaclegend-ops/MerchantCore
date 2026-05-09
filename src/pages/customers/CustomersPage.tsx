import { useEffect, useState } from 'react'
import { Search, Filter, Mail, Edit, MoreVertical, CreditCard } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'

const tierStyle = (tier: string) => {
  switch (tier) {
    case 'platinum': return { background: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }
    case 'gold': return { background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }
    case 'silver': return { background: 'rgba(100,116,139,0.2)', color: '#cbd5e1' }
    case 'bronze': return { background: 'rgba(249,115,22,0.2)', color: '#fdba74' }
    default: return {}
  }
}

const statusColor = (status: string) => {
  switch (status) {
    case 'paid': case 'active': return '#059669'
    case 'overdue': return '#dc2626'
    case 'pending': return '#d97706'
    default: return '#64748b'
  }
}

export function CustomersPage() {
  const bp = useBreakpoint()
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCustomers().then(c => {
      setCustomers(c)
      if (c.length) setSelectedCustomer(c[0])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Customer Directory</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', display: bp.sm ? 'block' : 'none' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search..."
              style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', width: '192px', outline: 'none', color: '#0f172a' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button style={{ padding: '6px', color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}>
              <Mail style={{ width: '14px', height: '14px' }} />
            </button>
            <button style={{ padding: '6px', color: '#64748b', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}>
              <CreditCard style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: bp.xl ? '1fr 2fr' : '1fr', gap: bp.xl ? '16px' : '12px' }}>
        <div>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Customers</h3>
              <button style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Filter style={{ width: '12px', height: '12px' }} /> Filter
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {customers.map((customer: any) => {
                const isSelected = selectedCustomer?.id === customer.id
                return (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    style={{
                      width: '100%', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                      textAlign: 'left', border: 'none', borderBottom: '1px solid #f8fafc',
                      background: isSelected ? '#f8fafc' : 'transparent', cursor: 'pointer',
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>{customer.avatar || customer.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{customer.name}</p>
                      <p style={{ fontSize: '10px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{customer.email}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>${customer.total_spent?.toLocaleString() || '0'}</p>
                      <span style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', color: statusColor(customer.status) }}>{customer.status}</span>
                    </div>
                  </button>
                )
              })}
              {customers.length === 0 && !loading && <p style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>No customers yet</p>}
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {selectedCustomer ? (
            <>
              <div style={{ background: '#0f172a', padding: '20px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <div style={{ width: '56px', height: '56px', background: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '18px', fontWeight: 700 }}>{selectedCustomer.avatar || selectedCustomer.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{selectedCustomer.name}</h2>
                        <span style={{
                          padding: '2px 6px', fontSize: '10px', fontWeight: 500, borderRadius: '999px', whiteSpace: 'nowrap',
                          ...tierStyle(selectedCustomer.tier || ''),
                        }}>{(selectedCustomer.tier || '').toUpperCase()}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0 0' }}>{selectedCustomer.company}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{selectedCustomer.email}</span>
                        <span style={{ whiteSpace: 'nowrap' }}>{selectedCustomer.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button style={{ padding: '6px', background: '#1e293b', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                      <Edit style={{ width: '14px', height: '14px', color: '#fff' }} />
                    </button>
                    <button style={{ padding: '6px', background: '#1e293b', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                      <MoreVertical style={{ width: '14px', height: '14px', color: '#fff' }} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ padding: '16px', borderRight: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Total Spent</span>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '2px', margin: '2px 0 0 0' }}>${selectedCustomer.total_spent?.toLocaleString() || '0'}</p>
                </div>
                <div style={{ padding: '16px', borderRight: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Credit Limit</span>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '2px', margin: '2px 0 0 0' }}>${selectedCustomer.credit_limit?.toLocaleString() || '0'}</p>
                </div>
                <div style={{ padding: '16px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Last Purchase</span>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '2px', margin: '2px 0 0 0' }}>{selectedCustomer.last_purchase || 'N/A'}</p>
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <button style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '-10px', background: 'none', border: 'none', cursor: 'pointer' }}>History</button>
                  <button style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Ledger</button>
                  <button style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Analytics</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              {loading ? 'Loading...' : 'Select a customer to view details'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
