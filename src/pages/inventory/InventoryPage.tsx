import { useEffect, useState } from 'react'
import { Plus, AlertTriangle, BarChart3, Eye, Edit2, Trash2 } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'

const inputStyle: React.CSSProperties = {
  width: '100%', height: '40px', padding: '0 12px', border: '1px solid #cbd5e1',
  borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', color: '#0f172a', boxSizing: 'border-box',
}

export function InventoryPage() {
  const bp = useBreakpoint()
  const [items, setItems] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [formData, setFormData] = useState({ name: '', sku: '', price: '', stock: '', category: '' })

  useEffect(() => {
    api.getProducts().then(p => setItems(p)).catch(() => {})
  }, [])

  const loadItems = () => api.getProducts().then(p => setItems(p)).catch(() => {})

  const filtered = items.filter(p => {
    if (filter === 'low' && p.status !== 'low-stock') return false
    if (filter === 'out' && p.status !== 'out-of-stock') return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalValue = items.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0)
  const lowCount = items.filter(p => p.status === 'low-stock').length
  const outCount = items.filter(p => p.status === 'out-of-stock').length

  const openAdd = () => {
    setEditItem(null)
    setFormData({ name: '', sku: '', price: '', stock: '', category: '' })
    setShowForm(true)
  }

  const openEdit = (p: any) => {
    setEditItem(p)
    setFormData({ name: p.name, sku: p.sku, price: String(p.price), stock: String(p.stock), category: p.category })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.sku || !formData.price || !formData.category) return
    const payload = {
      name: formData.name,
      sku: formData.sku,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      category: formData.category,
    }
    if (editItem) {
      await api.updateProduct(editItem.id, payload)
    } else {
      await api.createProduct(payload)
    }
    setShowForm(false)
    loadItems()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product?')) return
    await api.deleteProduct(id)
    loadItems()
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
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', gap: '16px' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Inventory</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button onClick={openAdd} style={{ display: 'flex', padding: '6px 12px', fontSize: '12px', fontWeight: 500, color: '#fff', background: '#0f172a', borderRadius: '8px', border: 'none', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Plus style={{ width: '14px', height: '14px' }} />
            Add Item
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: bp.lg ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', width: '100%', gap: bp.lg ? '12px' : '8px' }}>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', boxShadow: '0 6px 3px rgba(128,128,128,0.287)' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>Total Items</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{items.length}</p>
        </div>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', boxShadow: '0 6px 3px rgba(128,128,128,0.287)' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>Low Stock</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{lowCount}</p>
        </div>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', boxShadow: '0 6px 3px rgba(128,128,128,0.287)' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>Value</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>${(totalValue / 1000).toFixed(1)}k</p>
        </div>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', boxShadow: '0 6px 3px rgba(128,128,128,0.287)' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>Out of Stock</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{outCount}</p>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search inventory..."
        style={{ width: '100%', height: '40px', padding: '0 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff', color: '#0f172a', boxSizing: 'border-box' }}
      />

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {(['all', 'low', 'out'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                display: 'flex', padding: '6px 12px', borderRadius: '16px', border: filter !== f ? '1px solid #808080' : 'none',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                color: filter === f ? '#fff' : '#475569', background: filter === f ? '#0f172a' : 'transparent',
              }}>
                {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {filtered.map((product: any) => (
            <div key={product.id} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#fff', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '10px', flexShrink: 0 }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#64748b' }}>{product.name.substring(0, 1)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{product.name}</h2>
                  <span style={{ fontSize: '10px', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{product.category}</span>
                  <span style={{
                    padding: '2px 6px', fontSize: '10px', fontWeight: 500, borderRadius: '4px',
                    background: product.status === 'in-stock' ? '#ecfdf5' : product.status === 'low-stock' ? '#fffbeb' : '#fef2f2',
                    color: product.status === 'in-stock' ? '#047857' : product.status === 'low-stock' ? '#b45309' : '#b91c1c',
                  }}>
                    {product.status === 'in-stock' ? 'In Stock' : product.status === 'low-stock' ? 'Low' : 'Out'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                  <span>SKU: {product.sku}</span>
                  <span>Stock: {product.stock}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>${Number(product.price).toFixed(2)}</p>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => openEdit(product)} style={{ padding: '6px', color: '#64748b', background: '#f1f5f9', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                  <Edit2 style={{ width: '14px', height: '14px' }} />
                </button>
                <button onClick={() => handleDelete(product.id)} style={{ padding: '6px', color: '#dc2626', background: '#fef2f2', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p style={{ fontSize: '12px', color: '#94a3b8', padding: '24px' }}>No items found</p>}
        </div>
      </div>

      {showForm && (
        <div style={modalBackdrop} onClick={() => setShowForm(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{editItem ? 'Edit Product' : 'Add Product'}</h3>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Product Name</label>
              <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Product name" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>SKU</label>
              <input value={formData.sku} onChange={e => setFormData(p => ({ ...p, sku: e.target.value }))} style={inputStyle} placeholder="SKU-001" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Price</label>
                <input value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} style={inputStyle} placeholder="0.00" type="number" min="0" step="0.01" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Stock</label>
                <input value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} style={inputStyle} placeholder="0" type="number" min="0" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155', marginBottom: '4px', display: 'block' }}>Category</label>
              <input value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} style={inputStyle} placeholder="e.g. Beverages, Snacks" />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, height: '40px', fontSize: '13px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{editItem ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
