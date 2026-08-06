import { useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, Search, Lock, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { canEditInventory } from '@/lib/orgAccess'
import type { OrgMember } from '@/data/organisations'
import type { OrgProduct } from '@/data/orgCommerce'
import { Modal, FormButtons, StatusBadge, PageNotice } from './components'
import { inputStyle, selectStyle, thStyle, tdStyle, panelStyle, primaryBtn, labelStyle, fieldRow, field } from './styles'

type ProductForm = {
  name: string
  sku: string
  category: string
  price: string
  stock: string
  image: string
  rating: string
}

const emptyProductForm: ProductForm = { name: '', sku: '', category: '', price: '', stock: '', image: '', rating: '5' }

export function InventoryTracking({ products, reload, notify, orgUser }: { products: OrgProduct[]; reload: () => void; notify: (msg: string) => void; orgUser: OrgMember }) {
  const canEdit = canEditInventory(orgUser)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<OrgProduct | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyProductForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  }, [products, query])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyProductForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (product: OrgProduct) => {
    setEditing(product)
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image || '',
      rating: product.rating != null ? String(product.rating) : '5',
    })
    setError('')
    setShowForm(true)
  }

  const submit = async () => {
    if (!form.name.trim() || !form.sku.trim() || !form.category) {
      setError('Name, SKU and category are required')
      return
    }
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (Number.isNaN(price) || price < 0) {
      setError('Enter a valid unit price')
      return
    }
    if (Number.isNaN(stock) || stock < 0) {
      setError('Enter a valid stock count')
      return
    }
    const image = form.image.trim()
    if (!image) {
      setError('A product image is required')
      return
    }
    const rating = form.rating === '' ? 5 : Number(form.rating)
    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      setError('Rating must be a number between 0 and 5')
      return
    }
    setSubmitting(true)
    try {
      const payload = { name: form.name.trim(), sku: form.sku.trim(), category: form.category, price, stock, image, rating }
      if (editing) {
        await api.org.updateProduct(editing.id, payload)
        notify(`${form.name.trim()} was updated`)
      } else {
        await api.org.createProduct(payload)
        notify(`${form.name.trim()} was added to inventory`)
      }
      setShowForm(false)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (product: OrgProduct) => {
    if (!window.confirm(`Delete ${product.name} from inventory?`)) return
    try {
      await api.org.deleteProduct(product.id)
      notify(`${product.name} was removed from inventory`)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div style={{ ...panelStyle, padding: 0, overflow: 'hidden' }}>
          {error && <PageNotice message={error} tone="error" />}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Inventory Tracking</h3>
        {!canEdit && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '999px' }}>
            <Lock size={11} />
            Read only
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products…" style={{ ...inputStyle, width: 220, paddingLeft: 30 }} />
          </div>
          {canEdit && (
            <button onClick={openAdd} style={primaryBtn}>
              <Plus size={14} />
              Add Product
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Unit Price</th>
              <th style={thStyle}>Stock</th>
              <th style={thStyle}>Status</th>
              {canEdit && <th style={thStyle}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 6 : 5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Package size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }} />
                  No products match.
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 6, flexShrink: 0, overflow: 'hidden', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.image
                          ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{p.name.substring(0, 1)}</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>{p.category}</td>
                  <td style={tdStyle}>{p.price.toFixed(2)}</td>
                  <td style={tdStyle}>{p.stock}</td>
                  <td style={tdStyle}><StatusBadge label={p.status} tone={p.status === 'in-stock' ? 'green' : p.status === 'low-stock' ? 'amber' : 'red'} /></td>
                  {canEdit && (
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => openEdit(p)} style={{ padding: '6px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => remove(p)} style={{ padding: '6px', color: 'var(--text-danger)', background: 'var(--bg-danger)', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal
          title={editing ? `Edit ${editing.name}` : 'Add Product'}
          onClose={() => setShowForm(false)}
          footer={<FormButtons onCancel={() => setShowForm(false)} onSubmit={submit} submitLabel={submitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Product'} />}
        >
      {error && <PageNotice message={error} tone="error" />}
          <div>
            <label style={labelStyle}>Product Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="e.g. Frutel Juice 500ml" />
          </div>
          <div style={fieldRow}>
            <div style={field}>
              <label style={labelStyle}>SKU</label>
              <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} style={inputStyle} placeholder="e.g. BEV-007" />
            </div>
            <div style={field}>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={selectStyle}>
                <option value="">Select…</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={fieldRow}>
            <div style={field}>
              <label style={labelStyle}>Unit Price</label>
              <input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} placeholder="0.00" />
            </div>
            <div style={field}>
              <label style={labelStyle}>Stock</label>
              <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={inputStyle} placeholder="0" />
            </div>
          </div>
          <div style={fieldRow}>
            <div style={field}>
              <label style={labelStyle}>Initial Rating</label>
              <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })} style={inputStyle} placeholder="0-5" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Product Image *</label>
            <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} style={inputStyle} placeholder="https://... or /path/to/image.png" />
            {form.image.trim() ? (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={form.image.trim()} alt="preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-tertiary)' }} onError={e => { e.currentTarget.style.display = 'none' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Products without an image cannot be saved.</span>
              </div>
            ) : (
              <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-warning)' }}>A product image is required.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
