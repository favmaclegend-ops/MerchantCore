import { useContext, useEffect, useState } from 'react'
import { Authcontext } from '@/context'
import { canManageSupply } from '@/lib/orgAccess'
import { api } from '@/lib/api'
import type { OrgSupplyState } from '@/lib/orgTypes'
import type { OrgProduct } from '@/lib/orgTypes'
import { PageNotice } from './components'
import { SupplyOverview } from './SupplyOverview'
import { InventoryTracking } from './InventoryTracking'
import { PurchaseOrders } from './PurchaseOrders'
import { Suppliers } from './Suppliers'
import { ShippingLogistics } from './ShippingLogistics'
import { MarketOrders } from './MarketOrders'

type TabId = 'overview' | 'inventory' | 'purchase-orders' | 'suppliers' | 'shipping' | 'market-orders'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'inventory', label: 'Inventory Tracking' },
  { id: 'purchase-orders', label: 'Purchase Orders' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'shipping', label: 'Shipping & Logistics' },
  { id: 'market-orders', label: 'Orders' },
]

export function SupplyChainPage() {
  const { orgUser } = useContext(Authcontext)

  const [active, setActive] = useState<TabId>('overview')
  const [state, setState] = useState<OrgSupplyState | null>(null)
  const [products, setProducts] = useState<OrgProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const reload = () => {
    api.org.supply.getState()
      .then(s => setState(s))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load supply chain data'))
    api.org.getProducts()
      .then(setProducts)
      .catch(() => {})
  }

  useEffect(() => {
    api.org.supply.getState()
      .then(s => setState(s))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load supply chain data'))
      .finally(() => setLoading(false))
    api.org.getProducts()
      .then(setProducts)
      .catch(() => {})
  }, [])

  if (!orgUser || !canManageSupply(orgUser)) {
    return (
      <div style={{ width: '100%', padding: '40px 16px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Restricted area</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
          You do not have permission to view Supply Chain &amp; Logistics. This area is only available to the Supply Chain manager and the organisation super admin.
        </p>
      </div>
    )
  }

  const notify = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 4000)
  }

  const tabBar = (
    <div style={{ width: '100%', display: 'flex', gap: '4px', padding: '6px', borderRadius: '12px', background: 'transparent', overflowX: 'auto' }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          style={{
            padding: '9px 14px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
            color: active === t.id ? 'var(--bg-surface)' : 'var(--text-secondary)',
            background: active === t.id ? 'var(--bg-nav-active)' : 'transparent',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', padding: '0 8px' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}></div>

      {notice && <PageNotice message={notice} />}

      {tabBar}

      {loading ? (
        <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', padding: '24px' }}>Loading supply chain data...</p>
      ) : error && !state ? (
        <p style={{ fontSize: '12px', color: 'var(--text-danger)', padding: '24px' }}>{error}</p>
      ) : state ? (
        <>
          {active === 'overview' && <SupplyOverview state={state} products={products} />}
          {active === 'inventory' && <InventoryTracking products={products} reload={reload} notify={notify} orgUser={orgUser} />}
          {active === 'purchase-orders' && <PurchaseOrders state={state} products={products} reload={reload} notify={notify} />}
          {active === 'suppliers' && <Suppliers state={state} products={products} reload={reload} notify={notify} />}
          {active === 'shipping' && <ShippingLogistics state={state} reload={reload} notify={notify} />}
          {active === 'market-orders' && <MarketOrders notify={notify} />}
        </>
      ) : null}
    </div>
  )
}
