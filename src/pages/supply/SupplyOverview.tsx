import { useContext } from 'react'
import { Package, AlertTriangle, Truck, ClipboardList, CheckCircle2, Timer, ArrowRight, TrendingUp } from 'lucide-react'
import { CurrencyContext } from '@/context/currency_context'
import type { OrgSupplyState } from '@/data/orgSupply'
import type { OrgProduct } from '@/data/orgCommerce'
import { StatCard, StatusBadge } from './components'
import { PO_STATUS_TONES, SHIPMENT_STATUS_TONES, panelStyle, formatDate } from './styles'

export function SupplyOverview({ state, products }: { state: OrgSupplyState; products: OrgProduct[] }) {
  const { format } = useContext(CurrencyContext)

  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)
  const lowOrOut = products.filter(p => p.status === 'low-stock' || p.status === 'out-of-stock')
  const openOrders = state.purchaseOrders.filter(p => p.status === 'pending' || p.status === 'approved')
  const receivedOrders = state.purchaseOrders.filter(p => p.status === 'received')
  const inTransit = state.shipments.filter(s => s.status === 'in-transit')
  const activeSuppliers = state.suppliers.filter(s => s.status === 'active')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <StatCard label="Inventory Value" value={format(inventoryValue)} sub={`${products.length} products tracked`} icon={<Package size={18} />} tone="accent" />
        <StatCard label="Low / Out of Stock" value={String(lowOrOut.length)} sub="Products needing restock" icon={<AlertTriangle size={18} />} tone="amber" />
        <StatCard label="Open Purchase Orders" value={String(openOrders.length)} sub={`${receivedOrders.length} received`} icon={<ClipboardList size={18} />} tone="green" />
        <StatCard label="Shipments In Transit" value={String(inTransit.length)} sub={`${state.suppliers.length} suppliers`} icon={<Truck size={18} />} tone="neutral" />
      </div>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ ...panelStyle, flex: '1.3', minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ClipboardList size={16} color="var(--text-muted)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Open Purchase Orders</h3>
          </div>
          {openOrders.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No open purchase orders. Create one or auto-generate from low stock.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {openOrders.map(po => (
                <div key={po.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{po.po_number}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{po.supplier_name} · {po.items.length} line item{po.items.length === 1 ? '' : 's'} · {formatDate(po.ordered_at)}</p>
                  </div>
                  <StatusBadge label={po.status} tone={PO_STATUS_TONES[po.status]} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{format(po.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...panelStyle, flex: '1', minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Truck size={16} color="var(--text-muted)" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>In-transit Shipments</h3>
          </div>
          {inTransit.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Nothing on the road right now.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {inTransit.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.tracking_number} · {s.carrier}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{s.po_number} · {s.supplier_name}</p>
                  </div>
                  <StatusBadge label={s.status} tone={SHIPMENT_STATUS_TONES[s.status]} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    <Timer size={11} style={{ display: 'inline', marginRight: 3, verticalAlign: '-1px' }} />
                    eta {formatDate(s.eta)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...panelStyle }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <TrendingUp size={16} color="var(--text-muted)" />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Restock Watchlist</h3>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>{activeSuppliers.length} active suppliers</span>
        </div>
        {lowOrOut.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
            Every product is sufficiently stocked.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lowOrOut.slice(0, 6).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{p.category}</p>
                </div>
                <StatusBadge label={p.status} tone={p.status === 'out-of-stock' ? 'red' : 'amber'} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{p.stock} in stock</span>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        )}
        <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
          Restock suggestions are based on the seeded low-stock / out-of-stock thresholds.
        </p>
      </div>
    </div>
  )
}
