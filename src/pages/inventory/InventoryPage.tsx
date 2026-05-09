import { useEffect, useState } from 'react'
import { Plus, AlertTriangle, BarChart3, Eye } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { api } from '@/lib/api'
import SearchInput from '@/components/layout/search_cmp'

export function InventoryPage() {
  const bp = useBreakpoint()
  const [items, setItems] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')

  useEffect(() => {
    api.getProducts().then(p => setItems(p)).catch(() => {})
  }, [])

  const filtered = filter === 'all' ? items : filter === 'low' ? items.filter(p => p.status === 'low-stock') : items.filter(p => p.status === 'out-of-stock')
  const totalValue = items.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0)
  const lowCount = items.filter(p => p.status === 'low-stock').length
  const outCount = items.filter(p => p.status === 'out-of-stock').length

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', gap: '16px' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Inventory</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button style={{ display: 'flex', padding: '6px 12px', fontSize: '12px', fontWeight: 500, color: '#fff', background: '#0f172a', borderRadius: '8px', border: 'none', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Plus style={{ width: '14px', height: '14px' }} />
            Add Item
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: bp.lg ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', width: '100%', gap: bp.lg ? '12px' : '8px' }}>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', boxShadow: '0 6px 3px rgba(128,128,128,0.287)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>Total Items</span>
            <BarChart3 style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
          </div>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{items.length}</p>
        </div>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', boxShadow: '0 6px 3px rgba(128,128,128,0.287)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>Low Stock</span>
            <AlertTriangle style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
          </div>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{lowCount}</p>
        </div>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', boxShadow: '0 6px 3px rgba(128,128,128,0.287)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>Value</span>
            <Eye style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
          </div>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>${(totalValue / 1000).toFixed(1)}k</p>
        </div>
        <div style={{ width: '100%', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fff', boxShadow: '0 6px 3px rgba(128,128,128,0.287)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase' }}>Out of Stock</span>
            <AlertTriangle style={{ width: '14px', height: '14px', color: '#ef4444' }} />
          </div>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{outCount}</p>
        </div>
      </div>

      <SearchInput />

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {(['all', 'low', 'out'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  display: 'flex', padding: '6px 12px', borderRadius: '16px', border: filter !== f ? '1px solid #808080' : 'none',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  color: filter === f ? '#fff' : '#475569',
                  background: filter === f ? '#0f172a' : 'transparent',
                }}
              >
                {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {filtered.map((product: any) => (
            <div key={product.id} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#fff', display: 'grid', gridTemplateColumns: '0.2fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#64748b' }}>{product.name.substring(0, 1)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px', fontSize: '13px', lineHeight: '13px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{product.name}</h2>
                  <span style={{ color: '#808080', marginTop: '4px', fontSize: '12px' }}>{product.category}</span>
                </div>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '16px' }}>{product.price}</strong>
                  <span style={{ color: '#808080', fontSize: '12px' }}>{product.sku}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9', fontSize: '10px', color: '#64748b', width: '100%' }}>
          Showing {filtered.length} of {items.length} items
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginBottom: '12px', margin: 0 }}>Stock Trends</h3>
          <div style={{ width: '100%', flex: 1, overflowX: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
            <span>Under Development</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', gap: '16px', background: '#0f172a', borderRadius: '8px', color: '#fff' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', alignSelf: 'flex-start', margin: 0 }}>Automate Orders</h3>
          <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '12px', alignSelf: 'flex-start', margin: 0 }}>Enable smart replenishment to auto-reorder stock.</p>
          <button style={{ width: '100%', padding: '8px 16px', fontSize: '10px', fontWeight: 500, color: '#fff', background: '#1e293b', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Configure AI Agent
          </button>
        </div>
      </div>
    </div>
  )
}
