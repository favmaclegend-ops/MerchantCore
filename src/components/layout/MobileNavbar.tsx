import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Package, CreditCard, ShoppingCart, Users, Plus } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const navItems = [
  { path: '/home/dashboard', label: 'Sales', icon: LayoutGrid },
  { path: '/home/inventory', label: 'Stock', icon: Package },
  { path: '/home/pos', label: 'POS', icon: ShoppingCart },
  { path: '/home/credit', label: 'Credit', icon: CreditCard },
  { path: '/home/customers', label: 'More', icon: Users },
]

export function MobileNavbar() {
  const location = useLocation()
  const bp = useBreakpoint()

  if (bp.lg) return null

  return (
    <nav style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', alignItems: 'center', justifyContent: 'space-around', padding: '8px 4px', zIndex: 40 }}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
              textDecoration: 'none', minWidth: '56px',
              color: isActive ? '#0f172a' : '#94a3b8',
            }}
          >
            <Icon style={{ width: '20px', height: '20px', color: isActive ? '#0f172a' : undefined }} />
            <span>{item.label}</span>
          </Link>
        )
      })}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '4px 12px', minWidth: '56px' }}>
        <div style={{ width: '40px', height: '40px', background: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' }}>
          <Plus style={{ width: '20px', height: '20px', color: '#fff' }} />
        </div>
      </div>
    </nav>
  )
}
