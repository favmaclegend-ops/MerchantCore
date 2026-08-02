import { useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { OrgProduct } from '@/data/orgCommerce'
import type { OrgSupplyState, OrgSupplier, OrgSupplierStatus } from '@/data/orgSupply'
import { Modal, FormButtons, StatusBadge, PageNotice } from './components'
import { inputStyle, selectStyle, thStyle, tdStyle, panelStyle, primaryBtn, labelStyle, fieldRow, field, TONE_COLORS } from './styles'

type SupplierForm = {
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  categories: string[]
  payment_terms: string
  status: OrgSupplierStatus
}

const emptySupplierForm: SupplierForm = {
  name: '', contact_person: '', email: '', phone: '', address: '',
  categories: [], payment_terms: 'Net 30', status: 'active',
}

export function Suppliers({ state, products, reload, notify }: { state: OrgSupplyState; products: OrgProduct[]; reload: () => void; notify: (msg: string) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<OrgSupplier | null>(null)
  const [form, setForm] = useState<SupplierForm>(emptySupplierForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const allCategories = useMemo(
    () => Array.from(new Set([...products.map(p => p.category), ...state.suppliers.flatMap(s => s.categories)])).sort(),
    [products, state.suppliers],
  )

  const openAdd = () => {
    setEditing(null)
    setForm(emptySupplierForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (supplier: OrgSupplier) => {
    setEditing(supplier)
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      categories: supplier.categories,
      payment_terms: supplier.payment_terms,
      status: supplier.status,
    })
    setError('')
    setShowForm(true)
  }

  const toggleCategory = (category: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }))
  }

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        contact_person: form.contact_person.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        categories: form.categories,
        payment_terms: form.payment_terms,
        status: form.status,
      }
      if (editing) {
        await api.org.supply.updateSupplier(editing.id, payload)
        notify(`${form.name.trim()} was updated`)
      } else {
        await api.org.supply.createSupplier(payload)
        notify(`${form.name.trim()} was added as a supplier`)
      }
      setShowForm(false)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (supplier: OrgSupplier) => {
    if (!window.confirm(`Delete supplier ${supplier.name}? Existing purchase orders keep their supplier reference.`)) return
    try {
      await api.org.supply.deleteSupplier(supplier.id)
      notify(`${supplier.name} was removed`)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const toggleStatus = async (supplier: OrgSupplier) => {
    const next: OrgSupplierStatus = supplier.status === 'active' ? 'inactive' : 'active'
    try {
      await api.org.supply.updateSupplier(supplier.id, { status: next })
      notify(`${supplier.name} is now ${next}`)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div style={{ ...panelStyle, padding: 0, overflow: 'hidden' }}>
      {error && <PageNotice message={error} tone="error" />}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Suppliers</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{state.suppliers.length} total</span>
        <button onClick={openAdd} style={{ marginLeft: 'auto', ...primaryBtn }}>
          <Plus size={14} />
          Add Supplier
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={thStyle}>Supplier</th>
              <th style={thStyle}>Contact</th>
              <th style={thStyle}>Categories</th>
              <th style={thStyle}>Terms</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Building2 size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }} />
                  No suppliers yet.
                </td>
              </tr>
            ) : (
              state.suppliers.map(s => (
                <tr key={s.id}>
                  <td style={tdStyle}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{s.id} · {s.address}</p>
                  </td>
                  <td style={tdStyle}>
                    <p style={{ margin: 0, fontSize: '13px' }}>{s.contact_person}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{s.email}{s.phone ? ` · ${s.phone}` : ''}</p>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {s.categories.map(c => (
                        <span key={c} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c}</span>
                      ))}
                    </div>
                  </td>
                  <td style={tdStyle}>{s.payment_terms}</td>
                  <td style={tdStyle}>
                    <button onClick={() => toggleStatus(s)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                      <StatusBadge label={s.status} tone={s.status === 'active' ? 'green' : 'neutral'} />
                    </button>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => openEdit(s)} style={{ padding: '6px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => remove(s)} style={{ padding: '6px', color: 'var(--text-danger)', background: 'var(--bg-danger)', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
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
          title={editing ? `Edit ${editing.name}` : 'Add Supplier'}
          onClose={() => setShowForm(false)}
          footer={<FormButtons onCancel={() => setShowForm(false)} onSubmit={submit} submitLabel={submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Supplier'} />}
        >
          {error && <PageNotice message={error} tone="error" />}
          <div style={fieldRow}>
            <div style={field}>
              <label style={labelStyle}>Supplier Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="e.g. Golden Grains Co." />
            </div>
            <div style={field}>
              <label style={labelStyle}>Contact Person</label>
              <input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} style={inputStyle} placeholder="e.g. Kofi Darko" />
            </div>
          </div>
          <div style={fieldRow}>
            <div style={field}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="orders@supplier.example" />
            </div>
            <div style={field}>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="+1 555 010 9999" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} placeholder="e.g. 12 Industrial Ave, Accra" />
          </div>
          <div style={fieldRow}>
            <div style={field}>
              <label style={labelStyle}>Payment Terms</label>
              <select value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })} style={selectStyle}>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="COD">COD</option>
              </select>
            </div>
            <div style={field}>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as OrgSupplierStatus })} style={selectStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Categories Served</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {allCategories.map(c => {
                const selected = form.categories.includes(c)
                return (
                  <button
                    key={c}
                    onClick={() => toggleCategory(c)}
                    style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '999px', border: '1px solid var(--border-input)', cursor: 'pointer', ...(selected ? TONE_COLORS.green : { background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }) }}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
