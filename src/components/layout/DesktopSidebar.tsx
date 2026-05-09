import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Package, CreditCard, ShoppingCart, Users, Settings, HelpCircle, Plus } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const navItems = [
  { path: '/home/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { path: '/home/inventory', label: 'Inventory', icon: Package },
  { path: '/home/credit', label: 'Credit Ledger', icon: CreditCard },
  { path: '/home/pos', label: 'POS', icon: ShoppingCart },
  { path: '/home/customers', label: 'Customers', icon: Users },
]

export function DesktopSidebar() {
  const location = useLocation()
  const bp = useBreakpoint()

  if (!bp.lg) return null

  return (
    <aside style={{ flexShrink: 0, width: '224px', background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', zIndex: 40 }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package style={{ width: '16px', height: '16px', color: '#fff' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>MerchantCore</h1>
            <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, margin: 0 }}>Business Pro</p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                color: isActive ? '#fff' : '#475569',
                background: isActive ? '#0f172a' : 'transparent',
                marginBottom: '2px',
              }}
            >
              <Icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9' }}>
        <button style={{ width: '100%', background: '#0f172a', color: '#fff', fontSize: '14px', fontWeight: 500, padding: '8px 0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer', marginBottom: '4px' }}>
          <Plus style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          Quick Sale
        </button>
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', fontSize: '14px', color: '#475569', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px' }}>
          <Settings style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          Settings
        </button>
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', fontSize: '14px', color: '#475569', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          <HelpCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          Support
        </button>
      </div>
    </aside>
  )
}
