import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Package, CreditCard, ShoppingCart, Users, Calculator} from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const navItems = [
  { path: '/home/dashboard', label: 'Sales', icon: LayoutGrid },
  { path: '/home/inventory', label: 'Stock', icon: Package },
  { path: '/home/pos', label: 'POS', icon: ShoppingCart },
  { path: '/home/credit', label: 'Credit', icon: CreditCard },
  { path: '/home/calculator', label: 'Calc', icon: Calculator },
  { path: '/home/customers', label: 'More', icon: Users },
]

export function MobileNavbar() {
  const location = useLocation()
  const bp = useBreakpoint()

  if (bp.lg) return null

  return (
    <nav style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)', alignItems: 'center', justifyContent: 'space-around', padding: '8px 4px', zIndex: 40 }}>
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
              color: isActive ? 'var(--text-primary)' : 'var(--text-placeholder)',
            }}
          >
            <Icon style={{ width: '20px', height: '20px', color: isActive ? 'var(--text-primary)' : undefined }} />
            <span>{item.label}</span>
          </Link>
        )
      })}
      
    </nav>
  )
}
