import { useEffect, useRef, useState } from 'react'
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

const inputStyle: React.CSSProperties = {
  width: '100%', height: '40px', padding: '0 12px', border: '1px solid #cbd5e1',
  borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', color: '#0f172a', boxSizing: 'border-box',
}

export function CreditLedgerPage() {
  const bp = useBreakpoint()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [showPayForm, setShowPayForm] = useState<any | null>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({ customer_name: '', customer_code: '', balance: '' })
  const [payAmount, setPayAmount] = useState('')

  useEffect(() => {
    api.getCreditEntries().then(e => setEntries(e)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const loadEntries = () => api.getCreditEntries().then(e => setEntries(e)).catch(() => {})

  const handleCreate = async () => {
    if (!formData.customer_name || !formData.balance) return
    await api.createCreditEntry({
      customer_id: crypto.randomUUID(),
      customer_name: formData.customer_name,
      customer_code: formData.customer_code || undefined,
      balance: parseFloat(formData.balance) || 0,
    })
    setShowForm(false)
    setFormData({ customer_name: '', customer_code: '', balance: '' })
    loadEntries()
  }

  const handlePay = async (entry: any) => {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) return
    const newBalance = Math.max(0, (entry.balance || 0) - amount)
    await api.updateCreditEntry(entry.id, {
      balance: newBalance,
      last_payment: new Date().toLocaleDateString(),
      last_payment_amount: amount,
      status: newBalance === 0 ? 'active' : entry.status,
    })
    setShowPayForm(null)
    setPayAmount('')
    loadEntries()
  }

  const handleUpdateStatus = async (entry: any, status: string) => {
    await api.updateCreditEntry(entry.id, { status })
    setOpenMenu(null)
    loadEntries()
  }

  const filteredEntries = statusFilter === 'all' ? entries : entries.filter(e => e.status === statusFilter)

  const totalOutstanding = filteredEntries.reduce((s, e) => s + (e.balance || 0), 0)
  const overdueCount = filteredEntries.filter(e => e.status === 'overdue' || e.status === 'critical').length
  const collectedMtd = filteredEntries.filter(e => e.last_payment_amount).reduce((s, e) => s + (e.last_payment_amount || 0), 0)

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
            <span style={{ fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '999px' }}>{filteredEntries.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px 8px', background: '#fff', color: '#0f172a' }}>
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="critical">Critical</option>
            </select>
            <button onClick={() => setShowForm(true)} style={{ padding: '4px 12px', fontSize: '10px', fontWeight: 500, color: '#fff', background: '#0f172a', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
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
              {filteredEntries.map((entry: any) => (
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
                    <span style={{ padding: '2px 6px', fontSize: '10px', fontWeight: 500, borderRadius: '999px', whiteSpace: 'nowrap', ...statusStyle(entry.status) }}>
                      {entry.status === 'active' ? 'Active' : `${entry.overdue_days || ''}d`}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', position: 'relative' }}>
                    <button onClick={() => setOpenMenu(openMenu === entry.id ? null : entry.id)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>•••</button>
                    {openMenu === entry.id && (
                      <div ref={menuRef} style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 999, minWidth: '120px', overflow: 'hidden' }}>
                        <button onClick={() => { setShowPayForm(entry); setOpenMenu(null) }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer' }}>Record Payment</button>
                        <button onClick={() => handleUpdateStatus(entry, entry.status === 'active' ? 'overdue' : 'active')} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer' }}>
                          Mark {entry.status === 'active' ? 'Overdue' : 'Active'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && !loading && (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>{statusFilter === 'all' ? 'No credit entries yet' : 'No entries match this status'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div style={modalBackdrop} onClick={() => setShowForm(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>New Credit Entry</h3>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Customer Name</label>
              <input value={formData.customer_name} onChange={e => setFormData(p => ({ ...p, customer_name: e.target.value }))} style={inputStyle} placeholder="Enter full name" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Customer Code (optional)</label>
              <input value={formData.customer_code} onChange={e => setFormData(p => ({ ...p, customer_code: e.target.value }))} style={inputStyle} placeholder="e.g. CUST-001" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Initial Balance</label>
              <input value={formData.balance} onChange={e => setFormData(p => ({ ...p, balance: e.target.value }))} style={inputStyle} placeholder="0.00" type="number" min="0" step="0.01" />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, height: '40px', fontSize: '13px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} style={{ flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Create Entry</button>
            </div>
          </div>
        </div>
      )}

      {showPayForm && (
        <div style={modalBackdrop} onClick={() => setShowPayForm(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Record Payment</h3>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{showPayForm.customer_name} — Current balance: <strong>${showPayForm.balance?.toLocaleString() || '0'}</strong></p>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Payment Amount</label>
              <input value={payAmount} onChange={e => setPayAmount(e.target.value)} style={inputStyle} placeholder="0.00" type="number" min="0" step="0.01" />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowPayForm(null)} style={{ flex: 1, height: '40px', fontSize: '13px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handlePay(showPayForm)} style={{ flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
