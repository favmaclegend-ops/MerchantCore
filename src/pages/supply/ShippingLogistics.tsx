import { useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { api } from '@/lib/api'
import type { OrgShipmentStatus, OrgShipment, OrgSupplyState } from '@/data/orgSupply'
import { Modal, FormButtons, StatusBadge, PageNotice } from './components'
import { inputStyle, selectStyle, thStyle, tdStyle, panelStyle, primaryBtn, labelStyle, SHIPMENT_STATUS_TONES, formatDate } from './styles'

type ShipmentForm = {
  po_id: string
  carrier: string
  eta: string
}

const emptyShipmentForm: ShipmentForm = { po_id: '', carrier: '', eta: '' }

export function ShippingLogistics({ state, reload, notify }: { state: OrgSupplyState; reload: () => void; notify: (msg: string) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ShipmentForm>(emptyShipmentForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const shippable = state.purchaseOrders.filter(po => po.status === 'pending' || po.status === 'approved')
  const alreadyShipped = state.shipments.filter(s => s.status !== 'cancelled').map(s => s.po_id)
  const shippableOptions = shippable.filter(po => !alreadyShipped.includes(po.id))

  const openAdd = () => {
    setForm(emptyShipmentForm)
    setError('')
    setShowForm(true)
  }

  const submit = async () => {
    if (!form.po_id) {
      setError('Choose a purchase order to ship')
      return
    }
    if (!form.carrier.trim()) {
      setError('Enter a carrier')
      return
    }
    setSubmitting(true)
    try {
      const eta = form.eta ? new Date(form.eta).toISOString() : ''
      const shipment = await api.org.supply.createShipment({ po_id: form.po_id, carrier: form.carrier.trim(), eta })
      notify(`${shipment.tracking_number} created for ${shipment.po_number}`)
      setShowForm(false)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const setStatus = async (shipment: OrgShipment, status: OrgShipmentStatus) => {
    try {
      await api.org.supply.setShipmentStatus(shipment.id, status)
      if (status === 'delivered') notify(`${shipment.tracking_number} delivered — inventory restocked`)
      else if (status === 'delayed') notify(`${shipment.tracking_number} marked as delayed`)
      else notify(`${shipment.tracking_number} ${status}`)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const shipmentActions = (shipment: OrgShipment) => {
    switch (shipment.status) {
      case 'in-transit':
        return (
          <>
            <button onClick={() => setStatus(shipment, 'delivered')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-success)', background: 'rgba(16,185,129,0.15)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delivered</button>
            <button onClick={() => setStatus(shipment, 'delayed')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-warning)', background: 'rgba(245,158,11,0.15)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delayed</button>
            <button onClick={() => setStatus(shipment, 'cancelled')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-danger)', background: 'var(--bg-danger)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </>
        )
      case 'delayed':
        return (
          <>
            <button onClick={() => setStatus(shipment, 'delivered')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-success)', background: 'rgba(16,185,129,0.15)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delivered</button>
            <button onClick={() => setStatus(shipment, 'cancelled')} style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, color: 'var(--text-danger)', background: 'var(--bg-danger)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </>
        )
      case 'delivered':
        return <StatusBadge label="Done" tone="green" />
      case 'cancelled':
        return <StatusBadge label="Cancelled" tone="red" />
    }
  }

  return (
    <div style={{ ...panelStyle, padding: 0, overflow: 'hidden' }}>
      {error && <PageNotice message={error} tone="error" />}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Shipping & Logistics</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{state.shipments.length} total</span>
        <button onClick={openAdd} style={{ marginLeft: 'auto', ...primaryBtn }}>
          <Plus size={14} />
          Create Shipment
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={thStyle}>Tracking</th>
              <th style={thStyle}>Purchase Order</th>
              <th style={thStyle}>Carrier</th>
              <th style={thStyle}>ETA</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.shipments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Truck size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }} />
                  No shipments yet.
                </td>
              </tr>
            ) : (
              state.shipments.map(s => (
                <tr key={s.id}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{s.tracking_number}</td>
                  <td style={tdStyle}>
                    <p style={{ margin: 0 }}>{s.po_number}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{s.supplier_name}</p>
                  </td>
                  <td style={tdStyle}>{s.carrier}</td>
                  <td style={tdStyle}>{formatDate(s.eta)}</td>
                  <td style={tdStyle}>{formatDate(s.created_at)}</td>
                  <td style={tdStyle}><StatusBadge label={s.status} tone={SHIPMENT_STATUS_TONES[s.status]} /></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {shipmentActions(s)}
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
          title="Create Shipment"
          onClose={() => setShowForm(false)}
          footer={<FormButtons onCancel={() => setShowForm(false)} onSubmit={submit} submitLabel={submitting ? 'Creating…' : 'Create Shipment'} />}
        >
          {error && <PageNotice message={error} tone="error" />}
          <div>
            <label style={labelStyle}>Purchase Order</label>
            <select value={form.po_id} onChange={e => setForm({ ...form, po_id: e.target.value })} style={selectStyle}>
              <option value="">Select purchase order…</option>
              {shippableOptions.map(po => (
                <option key={po.id} value={po.id}>{po.po_number} · {po.supplier_name} ({po.items.length} lines)</option>
              ))}
            </select>
            {shippableOptions.length === 0 && (
              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>No pending or approved purchase orders left to ship.</p>
            )}
          </div>
          <div>
            <label style={labelStyle}>Carrier</label>
            <input value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} style={inputStyle} placeholder="e.g. Express Cargo" />
          </div>
          <div>
            <label style={labelStyle}>Expected Arrival</label>
            <input type="date" value={form.eta} onChange={e => setForm({ ...form, eta: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Truck size={13} />
            Delivering a shipment receives the linked purchase order and restocks inventory.
          </div>
        </Modal>
      )}
    </div>
  )
}
