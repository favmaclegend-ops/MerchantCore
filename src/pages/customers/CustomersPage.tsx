import { useEffect, useState } from 'react'
import { Search, Mail, Edit, CreditCard, UserPlus } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'

const tierStyle = (tier: string): React.CSSProperties => {
  switch (tier) {
    case 'platinum': return { background: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }
    case 'gold': return { background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }
    case 'silver': return { background: 'rgba(100,116,139,0.2)', color: '#cbd5e1' }
    case 'bronze': return { background: 'rgba(249,115,22,0.2)', color: '#fdba74' }
    default: return {}
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: '40px', padding: '0 12px', border: '1px solid #cbd5e1',
  borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', color: '#0f172a', boxSizing: 'border-box',
}

export function CustomersPage() {
  const bp = useBreakpoint()
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editCustomer, setEditCustomer] = useState<any | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', credit_limit: '' })

  useEffect(() => {
    api.getCustomers().then(c => {
      setCustomers(c)
      if (c.length && !selectedCustomer) setSelectedCustomer(c[0])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadCustomers = () => api.getCustomers().then(c => {
    setCustomers(c)
    if (c.length && !selectedCustomer) setSelectedCustomer(c[0])
  }).catch(() => {})

  const filtered = search
    ? customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
    : customers

  const openAdd = () => {
    setEditCustomer(null)
    setFormData({ name: '', email: '', phone: '', company: '', credit_limit: '' })
    setShowForm(true)
  }

  const openEdit = () => {
    if (!selectedCustomer) return
    setEditCustomer(selectedCustomer)
    setFormData({
      name: selectedCustomer.name || '',
      email: selectedCustomer.email || '',
      phone: selectedCustomer.phone || '',
      company: selectedCustomer.company || '',
      credit_limit: String(selectedCustomer.credit_limit || ''),
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) return
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      credit_limit: parseFloat(formData.credit_limit) || 0,
    }
    if (editCustomer) {
      await api.updateCustomer(editCustomer.id, payload)
    } else {
      await api.createCustomer(payload)
    }
    setShowForm(false)
    loadCustomers()
  }

  const handleAddToCredit = async () => {
    if (!selectedCustomer) return
    await api.createCreditEntry({
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      customer_code: selectedCustomer.id.substring(0, 8),
      balance: 0,
    })
  }

  const modalBackdrop: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px',
  }
  const modalCard: React.CSSProperties = {
    background: '#fff', borderRadius: '12px', padding: '24px', width: '100%',
    maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px',
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Customer Directory</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, color: '#fff', background: '#0f172a', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            <UserPlus style={{ width: '14px', height: '14px' }} />
            Add
          </button>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search customers..."
        style={{ width: '100%', height: '40px', padding: '0 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', color: '#0f172a', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: bp.xl ? '1fr 2fr' : '1fr', gap: bp.xl ? '16px' : '12px' }}>
        <div>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Customers</h3>
              <span style={{ fontSize: '10px', color: '#64748b' }}>{filtered.length}</span>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filtered.map((customer: any) => {
                const isSelected = selectedCustomer?.id === customer.id
                return (
                  <button key={customer.id} onClick={() => setSelectedCustomer(customer)} style={{
                    width: '100%', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                    textAlign: 'left', border: 'none', borderBottom: '1px solid #f8fafc',
                    background: isSelected ? '#f8fafc' : 'transparent', cursor: 'pointer',
                  }}>
                    <div style={{ width: '36px', height: '36px', background: '#e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>{customer.name?.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{customer.name}</p>
                      <p style={{ fontSize: '10px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{customer.email}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>${customer.total_spent?.toLocaleString() || '0'}</p>
                    </div>
                  </button>
                )
              })}
              {filtered.length === 0 && !loading && <p style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>No customers found</p>}
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
                      <span style={{ fontSize: '18px', fontWeight: 700 }}>{selectedCustomer.name?.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{selectedCustomer.name}</h2>
                        <span style={{ padding: '2px 6px', fontSize: '10px', fontWeight: 500, borderRadius: '999px', whiteSpace: 'nowrap', ...tierStyle(selectedCustomer.tier || '') }}>
                          {(selectedCustomer.tier || '').toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0 0' }}>{selectedCustomer.company}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{selectedCustomer.email}</span>
                        <span style={{ whiteSpace: 'nowrap' }}>{selectedCustomer.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button onClick={openEdit} style={{ padding: '6px', background: '#1e293b', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                      <Edit style={{ width: '14px', height: '14px', color: '#fff' }} />
                    </button>
                    <button onClick={handleAddToCredit} style={{ padding: '6px', background: '#1e293b', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                      <CreditCard style={{ width: '14px', height: '14px', color: '#fff' }} />
                    </button>
                    <button onClick={() => window.location.href = `mailto:${selectedCustomer.email}`} style={{ padding: '6px', background: '#1e293b', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                      <Mail style={{ width: '14px', height: '14px', color: '#fff' }} />
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

              <div style={{ padding: '16px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                Customer since {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              {loading ? 'Loading...' : 'Select a customer to view details'}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div style={modalBackdrop} onClick={() => setShowForm(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{editCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Name</label>
              <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Full name" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Email</label>
              <input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} style={inputStyle} placeholder="email@example.com" type="email" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Phone</label>
              <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={inputStyle} placeholder="+1 234 567 8900" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Company</label>
              <input value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} style={inputStyle} placeholder="Company name" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Credit Limit</label>
              <input value={formData.credit_limit} onChange={e => setFormData(p => ({ ...p, credit_limit: e.target.value }))} style={inputStyle} placeholder="0.00" type="number" min="0" step="0.01" />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, height: '40px', fontSize: '13px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{editCustomer ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
