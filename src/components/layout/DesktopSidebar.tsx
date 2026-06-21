import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, Package, CreditCard, ShoppingCart, Users, Calculator, Settings, HelpCircle, Plus } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const navItems = [
  { path: '/home/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { path: '/home/inventory', label: 'Inventory', icon: Package },
  { path: '/home/credit', label: 'Credit Ledger', icon: CreditCard },
  { path: '/home/pos', label: 'POS', icon: ShoppingCart },
  { path: '/home/customers', label: 'Customers', icon: Users },
  { path: '/home/calculator', label: 'Calculator', icon: Calculator },
]

export function DesktopSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const bp = useBreakpoint()

  if (!bp.lg) return null

  return (
    <aside style={{ flexShrink: 0, width: '224px', background: 'var(--bg-nav)', borderRight: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', zIndex: 40 }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--bg-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--bg-surface-hover)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package style={{ width: '16px', height: '16px', color: 'var(--bg-surface)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>MerchantCore</h1>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Business Pro</p>
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
                color: isActive ? 'var(--bg-surface)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-nav-active)' : 'transparent',
                marginBottom: '2px',
              }}
            >
              <Icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid var(--bg-tertiary)' }}>
        <button onClick={() => navigate('/home/pos')} style={{ width: '100%', background: 'var(--bg-nav-active)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, padding: '8px 0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', cursor: 'pointer', marginBottom: '4px' }}>
          <Plus style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          Quick Sale
        </button>
        <button onClick={() => navigate('/home/settings')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', fontSize: '14px', color: location.pathname === '/home/settings' ? 'var(--bg-surface)' : 'var(--text-secondary)', background: location.pathname === '/home/settings' ? 'var(--bg-nav-active)' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px' }}>
          <Settings style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          Settings
        </button>
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', fontSize: '14px', color: 'var(--text-secondary)', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          <HelpCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          Support
        </button>
      </div>
    </aside>
  )
}
