import { useEffect, useRef, useState, useContext } from 'react'
import { Plus, Edit2, Trash2, Lock, Store, ShoppingCart } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'
import { Authcontext } from '@/context'
import { CurrencyContext } from '@/context/currency_context'
import { canEditInventory } from '@/lib/orgAccess'
import { useShopOwner } from '@/pages/market/useShopOwner'
import {
  
  getMyShop,
  getUploadedSourceIds,
  removeProductFromMarket,
  updateMarketProductFromInventory,
} from '@/pages/market/marketUpload'
import { syncUserMarketData } from '@/pages/market/marketApi'
import { Link } from 'react-router-dom'

const inputStyle: React.CSSProperties = {
  width: '100%', height: '40px', padding: '0 12px', border: '1px solid var(--border-input)',
  borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box',
}

const LOW_STOCK_THRESHOLD = 20

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  stock: number
  category: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  image?: string
}

function stockStatus(stock: number): Product['status'] {
  if (stock <= 0) return 'out-of-stock'
  if (stock <= LOW_STOCK_THRESHOLD) return 'low-stock'
  return 'in-stock'
}

function normalizeProducts(products: Product[]): Product[] {
  return products.map(p => ({ ...p, status: stockStatus(p.stock) }))
}

const REVEAL_WIDTH = 132
const SNAP_THRESHOLD = 64

function ProductRow({
  product,
  uploaded,
  canEdit,
  format,
  onEdit,
  onDelete,
  onRemoveFromMarket,
}: {
  product: Product
  uploaded: boolean
  canEdit: boolean
  format: (n: number) => string
  onEdit: (p: Product) => void
  onDelete: (id: string) => void
  onRemoveFromMarket: (p: Product) => void
}) {
  const bp = useBreakpoint()
  // Offset is per-row so dragging one card never moves the others.
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const offsetRef = useRef(0)
  const gesture = useRef<{ startX: number; base: number; active: boolean }>({
    startX: 0,
    base: 0,
    active: false,
  })

  const setOffsetBoth = (v: number) => {
    offsetRef.current = v
    setOffset(v)
  }

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!bp.sm) return
    const t = e.touches[0]
    gesture.current = { startX: t.clientX, base: offsetRef.current, active: true }
    setDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!bp.sm || !gesture.current.active) return
    // Distance relative to where the finger started, clamped to the reveal width.
    const delta = e.touches[0].clientX - gesture.current.startX
    const next = Math.min(0, Math.max(-REVEAL_WIDTH, gesture.current.base + delta))
    setOffsetBoth(next)
  }

  const endGesture = () => {
    if (!gesture.current.active) return
    gesture.current.active = false
    setDragging(false)
    // Snap open only when the swipe actually crossed the threshold.
    setOffsetBoth(offsetRef.current <= -SNAP_THRESHOLD ? -REVEAL_WIDTH : 0)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {bp.sm && canEdit && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: REVEAL_WIDTH,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
            padding: '0 10px',
            borderRadius: '16px',
            background: 'var(--bg-tertiary)',
          }}
        >
          <button
            aria-label="Edit"
            onTouchStart={(e) => e.stopPropagation()}
            onClick={() => onEdit(product)}
            style={{ display: 'flex', padding: '1rem', background: 'var(--bg-nav-active)', color: 'var(--bg-surface)', borderRadius: '.5rem', border: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Edit2 style={{ width: '18px', height: '18px' }} />
          </button>
          <button
            aria-label="Delete"
            onTouchStart={(e) => e.stopPropagation()}
            onClick={() => onDelete(product.id)}
            style={{ display: 'flex', padding: '1rem', background: 'rgba(255, 0, 0, 0.42)', color: 'var(--text-danger)', borderRadius: '.5rem', border: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Trash2 style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      )}

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={endGesture}
        onTouchCancel={endGesture}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
          padding: '16px',
          borderRadius: '16px',
          background: 'var(--bg-surface)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          border: uploaded ? '1px solid var(--border-info)' : '1px solid transparent',
          boxShadow: 'var(--shadow-card)',
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.18s ease',
          touchAction: 'pan-y',
        }}
      >
        <div style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '10px', flexShrink: 0, overflow: 'hidden' }}>
          {product.image ? (
            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-muted)' }}>{product.name.substring(0, 1)}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{product.name}</h2>
            {!bp.sm && <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>{product.category}</span>}
            <span style={{
              padding: '2px 6px', fontSize: '10px', fontWeight: 500, borderRadius: '4px',
              background: product.status === 'in-stock' ? 'var(--bg-success)' : product.status === 'low-stock' ? 'var(--bg-warning)' : 'var(--bg-danger)',
              color: product.status === 'in-stock' ? 'var(--text-success)' : product.status === 'low-stock' ? 'var(--text-warning)' : 'var(--text-danger)',
            }}>
              {product.status === 'in-stock' ? 'In Stock' : product.status === 'low-stock' ? 'Low' : 'Out'}
            </span>
            {uploaded && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 600, borderRadius: '4px', color: 'var(--text-info)', background: 'var(--bg-info)' }}>
                <Store style={{ width: '10px', height: '10px' }} />
                On market
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 'clamp(.5rem, 1svw, .8rem)' }}>SKU: {product.sku}</span>
            <span style={{ fontSize: 'clamp(.5rem, 1svw, .8rem)' }}>Stock: {product.stock}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{format(product.price)}</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {!bp.sm && uploaded && (
            <button
              onClick={() => onRemoveFromMarket(product)}
              title="Remove from market"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 8px', fontSize: '11px', fontWeight: 500, color: 'var(--text-danger)', background: 'var(--bg-danger)', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
            >
              <Store style={{ width: '13px', height: '13px' }} />
              Remove from market
            </button>
          )}
          {!bp.sm && canEdit ? (
            <>
              <button onClick={() => onEdit(product)} style={{ padding: '6px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                <Edit2 style={{ width: '14px', height: '14px' }} />
              </button>
              <button onClick={() => onDelete(product.id)} style={{ padding: '6px', color: 'var(--text-danger)', background: 'var(--bg-danger)', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
                <Trash2 style={{ width: '14px', height: '14px' }} />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function InventoryPage() {
  const bp = useBreakpoint()
  const { format, currency } = useContext(CurrencyContext)
  const { orgUser } = useContext(Authcontext)
  const productsApi = orgUser ? api.org : api
  // Only the head of the Supply Chain department and the Super Admin may add/edit/delete
  // products in an organisation workspace. Normal (personal) logins keep full control.
  const canEdit = orgUser ? canEditInventory(orgUser) : true
  const { ownerKey } = useShopOwner()
  const [items, setItems] = useState<Product[]>([])
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Product | null>(null)
  const [formData, setFormData] = useState({ name: '', sku: '', price: '', stock: '', category: '', image: '' })
  const [formError, setFormError] = useState('')
  const [uploadedSourceIds, setUploadedSourceIds] = useState<Set<string>>(new Set())
  const [marketMsg, setMarketMsg] = useState('')
  const [shopId, setShopId] = useState<string | undefined>(undefined)

  const refreshUploaded = async () => {
    const ids = await getUploadedSourceIds(ownerKey)
    setUploadedSourceIds(new Set(ids))
  }

  useEffect(() => {
    getMyShop(ownerKey).then(s => setShopId(s?.shop_id))
    refreshUploaded()
  }, [ownerKey])

  useEffect(() => {
    productsApi.getProducts().then(p => setItems(normalizeProducts(p))).catch(() => {})
  }, [productsApi])

  const loadItems = () => productsApi.getProducts().then(p => setItems(normalizeProducts(p))).catch(() => {})

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
    setFormData({ name: '', sku: '', price: '', stock: '', category: '', image: '' })
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditItem(p)
    setFormData({ name: p.name, sku: p.sku, price: String(p.price), stock: String(p.stock), category: p.category, image: p.image || '' })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.sku || !formData.price || !formData.category) {
      setFormError('Name, SKU, price and category are required')
      return
    }
    const image = formData.image.trim()
    if (!image) {
      setFormError('A product image is required')
      return
    }
    const payload = {
      name: formData.name,
      sku: formData.sku,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      category: formData.category,
      image,
      status: stockStatus(parseInt(formData.stock) || 0),
    }
    if (editItem) {
      await productsApi.updateProduct(editItem.id, payload)
      if (uploadedSourceIds.has(editItem.id)) {
        await updateMarketProductFromInventory(ownerKey, editItem.id, {
          name: payload.name,
          price: payload.price,
          stock: payload.stock,
          category: payload.category,
          image: payload.image,
        })
        syncUserMarketData()
      }
    } else {
      await productsApi.createProduct(payload)
    }
    setShowForm(false)
    loadItems()
  }

  const handleRemoveFromMarket = async (product: Product) => {
    if (!window.confirm(`Remove "${product.name}" from the market? It stays in your inventory.`)) return
    if (await removeProductFromMarket(ownerKey, product.id)) {
      syncUserMarketData()
      await refreshUploaded()
      setMarketMsg(`"${product.name}" removed from the market`)
      window.setTimeout(() => setMarketMsg(''), 4000)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product?')) return
    await productsApi.deleteProduct(id)
    loadItems()
  }

  const modalBackdrop: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px',
  }
  const modalCard: React.CSSProperties = {
    background: 'var(--bg-surface)', borderRadius: '12px', padding: '24px', width: '100%',
    maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px',
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', gap: '16px' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Inventory</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {canEdit ? (
            <>
            <button onClick={openAdd} style={{ display: 'flex', padding: '6px 12px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary-b)', background: 'var(--bg-nav-active)', borderRadius: '8px', border: 'none', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <Plus style={{ width: '14px', height: '14px' }} />
              Add Item
            </button>
            {
              shopId &&
              <Link to={`/home/market/${shopId}`} style={{ display: 'flex', padding: '6px 12px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary-b)', background: 'var(--bg-nav-active)', borderRadius: '8px', border: 'none', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <ShoppingCart  style={{ width: '14px', height: '14px' }}  />
              Shop
            </Link>}
            </>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <Lock style={{ width: '13px', height: '13px' }} />
              Read only
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: bp.lg ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', width: '100%', gap: bp.lg ? '12px' : '8px' }}>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Items</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{items.length}</p>
        </div>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Stock</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{lowCount}</p>
        </div>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Value</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{currency}{(totalValue / 1000).toFixed(1)}k</p>
        </div>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Out of Stock</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{outCount}</p>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search inventory..."
        style={{ width: '100%', height: '40px', padding: '0 14px', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '16px', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
      />

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--bg-tertiary)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {(['all', 'low', 'out'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                display: 'flex', padding: '6px 12px', borderRadius: '16px', border: filter !== f ? '1px solid var(--border-default)' : 'none',
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                color: filter === f ? 'var(--bg-surface)' : 'var(--text-secondary)', background: filter === f ? 'var(--bg-nav-active)' : 'transparent',
              }}>
                {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {marketMsg && (
            <div style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-success)', background: 'var(--bg-success)' }}>
              {marketMsg}
            </div>
          )}
          {filtered.map((product: Product) => (
            <ProductRow
              key={product.id}
              product={product}
              uploaded={uploadedSourceIds.has(product.id)}
              canEdit={canEdit}
              format={format}
              onEdit={openEdit}
              onDelete={handleDelete}
              onRemoveFromMarket={handleRemoveFromMarket}
            />
          ))}
          {filtered.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', padding: '24px' }}>No items found</p>}
        </div>
      </div>

      {showForm && (
        <div style={modalBackdrop} onClick={() => setShowForm(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{editItem ? 'Edit Product' : 'Add Product'}</h3>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Product Name</label>
              <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Product name" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>SKU</label>
              <input value={formData.sku} onChange={e => setFormData(p => ({ ...p, sku: e.target.value }))} style={inputStyle} placeholder="SKU-001" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Price</label>
                <input value={formData.price} onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} style={inputStyle} placeholder="0.00" type="number" min="0" step="0.01" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Stock</label>
                <input value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))} style={inputStyle} placeholder="0" type="number" min="0" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Category</label>
              <input value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} style={inputStyle} placeholder="e.g. Beverages, Snacks" />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-label)', marginBottom: '4px', display: 'block' }}>Product Image *</label>
              <input value={formData.image} onChange={e => setFormData(p => ({ ...p, image: e.target.value }))} style={inputStyle} placeholder="https://... or /path/to/image.png" />
              {formData.image.trim() ? (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={formData.image.trim()} alt="preview" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-tertiary)' }} onError={e => { e.currentTarget.style.display = 'none' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Image preview. Products without an image cannot be saved.</span>
                </div>
              ) : (
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-warning)' }}>A product image is required.</p>
              )}
            </div>
            {formError && (
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-danger)', background: 'var(--bg-danger)', padding: '8px 10px', borderRadius: '6px' }}>{formError}</p>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, height: '40px', fontSize: '13px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 1, height: '40px', fontSize: '13px', fontWeight: 500, background: 'var(--bg-nav-active)', color: 'var(--text-on-dark)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{editItem ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
