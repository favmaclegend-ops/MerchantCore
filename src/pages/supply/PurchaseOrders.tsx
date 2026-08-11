import { useState } from 'react'
import { Plus, ArrowRight, ClipboardList, Zap, Minus } from 'lucide-react'
import { api } from '@/lib/api'
import type { OrgProduct } from '@/lib/orgTypes'
import type { OrgSupplyState, OrgPurchaseOrder, OrgPoStatus } from '@/lib/orgTypes'
import { Modal, FormButtons, StatusBadge, PageNotice } from './components'
import { inputStyle, selectStyle, thStyle, tdStyle, panelStyle, primaryBtn, ghostBtn, labelStyle, PO_STATUS_TONES, formatDate } from './styles'

type PoLine = { product_id: string; qty: string }

export function PurchaseOrders({ state, products, reload, notify }: { state: OrgSupplyState; products: OrgProduct[]; reload: () => void; notify: (msg: string) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [lines, setLines] = useState<PoLine[]>([{ product_id: '', qty: '10' }])
  const [submitting, setSubmitting] = useState(false)
  const [autoRunning, setAutoRunning] = useState(false)
  const [error, setError] = useState('')

  const supplierOptions = state.suppliers.filter(s => s.status === 'active')
  const selectedSupplier = state.suppliers.find(s => s.id === supplierId)
  const productOptions = selectedSupplier
    ? products.filter(p => selectedSupplier.categories.includes(p.category))
    : products

  const openAdd = () => {
    setSupplierId('')
    setLines([{ product_id: '', qty: '10' }])
    setError('')
    setShowForm(true)
  }

  const setLine = (index: number, patch: Partial<PoLine>) => {
    setLines(prev => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  const addLine = () => setLines(prev => [...prev, { product_id: '', qty: '10' }])

  const removeLine = (index: number) => {
    setLines(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const submit = async () => {
    if (!supplierId) {
      setError('Choose a supplier')
      return
    }
    const items = lines
      .map(line => ({ product_id: line.product_id, qty: Number(line.qty) }))
      .filter(line => line.product_id && !Number.isNaN(line.qty) && line.qty > 0)
    if (items.length === 0) {
      setError('Add at least one product line with a quantity')
      return
    }
    setSubmitting(true)
    try {
      const po = await api.org.supply.createPurchaseOrder({ supplier_id: supplierId, items })
      notify(`${po.po_number} raised for ${po.supplier_name}`)
      setShowForm(false)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const setStatus = async (po: OrgPurchaseOrder, status: OrgPoStatus) => {
    try {
      await api.org.supply.setPurchaseOrderStatus(po.id, status)
      if (status === 'received') notify(`${po.po_number} received — inventory restocked`)
      else if (status === 'cancelled') notify(`${po.po_number} cancelled`)
      else notify(`${po.po_number} ${status}`)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const remove = async (po: OrgPurchaseOrder) => {
    if (!window.confirm(`Delete purchase order ${po.po_number}?`)) return
    try {
      await api.org.supply.deletePurchaseOrder(po.id)
      notify(`${po.po_number} deleted`)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const autoGenerate = async () => {
    setAutoRunning(true)
    setError('')
    try {
      const created = await api.org.supply.autoGeneratePurchaseOrders()
      if (created.length === 0) {
        notify('No low-stock products to order')
      } else {
        notify(`Auto-raised ${created.length} purchase order${created.length === 1 ? '' : 's'}`)
      }
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setAutoRunning(false)
    }
  }

  const poActions = (po: OrgPurchaseOrder) => {
    switch (po.status) {
      case 'pending':
        return (
          <>
            <button onClick={() => setStatus(po, 'approved')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-info)', background: 'rgba(59,130,246,0.15)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Approve</button>
            <button onClick={() => setStatus(po, 'cancelled')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-danger)', background: 'var(--bg-danger)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </>
        )
      case 'approved':
        return (
          <>
            <button onClick={() => setStatus(po, 'received')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-success)', background: 'rgba(16,185,129,0.15)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Receive</button>
            <button onClick={() => setStatus(po, 'cancelled')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-danger)', background: 'var(--bg-danger)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </>
        )
      case 'cancelled':
        return <button onClick={() => remove(po)} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-danger)', background: 'var(--bg-danger)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
      case 'received':
        return <StatusBadge label="Done" tone="green" />
      case 'draft':
        return (
          <>
            <button onClick={() => setStatus(po, 'pending')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-warning)', background: 'rgba(245,158,11,0.15)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Submit</button>
            <button onClick={() => remove(po)} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-danger)', background: 'var(--bg-danger)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
          </>
        )
    }
  }

  return (
    <div style={{ ...panelStyle, padding: 0, overflow: 'hidden' }}>
      {error && <PageNotice message={error} tone="error" />}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Purchase Orders</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{state.purchaseOrders.length} total</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={autoGenerate} disabled={autoRunning} style={{ ...ghostBtn, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={13} />
            {autoRunning ? 'Generating…' : 'Auto-generate'}
          </button>
          <button onClick={openAdd} style={primaryBtn}>
            <Plus size={14} />
            Create Purchase Order
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={thStyle}>PO Number</th>
              <th style={thStyle}>Supplier</th>
              <th style={thStyle}>Items</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Ordered</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ClipboardList size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }} />
                  No purchase orders yet.
                </td>
              </tr>
            ) : (
              state.purchaseOrders.map(po => (
                <tr key={po.id}>
                  <td style={tdStyle}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{po.po_number}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{po.items.map(i => `${i.product_name} ×${i.qty}`).join(', ')}</p>
                  </td>
                  <td style={tdStyle}>{po.supplier_name}</td>
                  <td style={tdStyle}>{po.items.length}</td>
                  <td style={tdStyle}>{po.total.toFixed(2)}</td>
                  <td style={tdStyle}>{formatDate(po.ordered_at)}</td>
                  <td style={tdStyle}><StatusBadge label={po.status} tone={PO_STATUS_TONES[po.status]} /></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {poActions(po)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal
          title="Create Purchase Order"
          onClose={() => setShowForm(false)}
          footer={<FormButtons onCancel={() => setShowForm(false)} onSubmit={submit} submitLabel={submitting ? 'Creating…' : 'Create Purchase Order'} />}
        >
          {error && <PageNotice message={error} tone="error" />}
          <div>
            <label style={labelStyle}>Supplier</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} style={selectStyle}>
              <option value="">Select supplier…</option>
              {supplierOptions.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.categories.join(', ')})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Line Items</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {lines.map((line, index) => (
                <div key={index} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select value={line.product_id} onChange={e => setLine(index, { product_id: e.target.value })} style={{ ...selectStyle, flex: 1 }}>
                    <option value="">Select product…</option>
                    {productOptions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number" min="1" value={line.qty}
                    onChange={e => setLine(index, { qty: e.target.value })}
                    style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                  />
                  <button onClick={() => removeLine(index)} disabled={lines.length === 1} style={{ padding: '8px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '6px', border: 'none', cursor: 'pointer', opacity: lines.length === 1 ? 0.4 : 1 }}>
                    <Minus size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addLine} style={{ ...ghostBtn, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={13} />
              Add Line
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <ArrowRight size={13} />
            New purchase orders start as <StatusBadge label="pending" tone="amber" /> and can be approved, received or cancelled.
          </div>
        </Modal>
      )}
    </div>
  )
}
