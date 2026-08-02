import { useState, useContext } from 'react'
import type { ElementType } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Package, CreditCard, ShoppingCart, Calculator, Users, UserCog, Settings, MoreHorizontal, ChevronRight, Wallet, Contact, Clock, Bell, Truck } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Authcontext } from '@/context/auth_context'
import { canAccess, type OrgPermissions } from '@/lib/orgAccess'

const primaryItems = [
  { path: '/home/dashboard', label: 'Sales', icon: LayoutGrid },
  { path: '/home/inventory', label: 'Stock', icon: Package },
  { path: '/home/pos', label: 'POS', icon: ShoppingCart },
  { path: '/home/credit', label: 'Credit', icon: CreditCard },
  { path: '/home/calculator', label: 'Calc', icon: Calculator },
]

type MoreItem = { path: string; label: string; icon: ElementType; permission?: OrgPermissions; orgMemberOnly?: boolean }

const moreItems: MoreItem[] = [
  { path: '/home/customers', label: 'Customers', icon: Users },
  { path: '/home/finance', label: 'Finance', icon: Wallet, permission: 'finance' },
  { path: '/home/hrm', label: 'HRM', icon: Contact, permission: 'hrm' },
  { path: '/home/supply', label: 'Supply Chain', icon: Truck, permission: 'supply' },
  { path: '/home/attendance', label: 'Attendance', icon: Clock, orgMemberOnly: true },
  { path: '/home/notifications', label: 'Alerts', icon: Bell, orgMemberOnly: true },
  { path: '/home/users', label: 'Users', icon: UserCog, permission: 'users' },
  { path: '/home/settings', label: 'Settings', icon: Settings },
]

export function MobileNavbar() {
  const location = useLocation()
  const bp = useBreakpoint()
  const { orgUser } = useContext(Authcontext)
  const [open, setOpen] = useState(false)

  const visibleMoreItems = moreItems.filter(item =>
    item.permission
      ? canAccess(orgUser, item.permission)
      : item.orgMemberOnly
        ? !!orgUser
        : true,
  )

  if (bp.lg) return null

  const isMoreActive = open || visibleMoreItems.some(i => location.pathname === i.path)

  return (
    <>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 45 }} />
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: '72px', background: 'var(--bg-surface)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', boxShadow: 'var(--shadow-menu)', zIndex: 50, padding: '8px 8px 12px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-default)', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '8px 12px 4px' }}>More</p>
            {visibleMoreItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                    borderRadius: '10px', fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                    color: isActive ? 'var(--bg-surface)' : 'var(--text-primary)',
                    background: isActive ? 'var(--bg-nav-active)' : 'transparent',
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--text-placeholder)' }} />
                </Link>
              )
            })}
          </div>
        </>
      )}

      <nav style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)', alignItems: 'center', justifyContent: 'space-around', padding: '8px 4px', zIndex: 40 }}>
        {primaryItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
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

        <button
          onClick={() => setOpen(p => !p)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer', minWidth: '56px',
            color: isMoreActive ? 'var(--text-primary)' : 'var(--text-placeholder)',
          }}
        >
          <MoreHorizontal style={{ width: '20px', height: '20px', color: isMoreActive ? 'var(--text-primary)' : undefined }} />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
