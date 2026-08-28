import { useState, useContext } from 'react'
import type { ElementType } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Package, CreditCard, ShoppingCart, Calculator, Users, UserCog, Settings, MoreHorizontal, ChevronRight, Wallet, Contact, Clock, Truck, FileSpreadsheet, ReceiptText } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Authcontext } from '@/context/auth_context'
import { canAccess, type OrgPermissions } from '@/lib/orgAccess'
import { preloadRoute } from '@/lib/routePreload'

const primaryItems = [
  { path: '/home/dashboard', label: 'Sales', icon: LayoutGrid },
  { path: '/home/market', label: 'Market', icon: ShoppingCart },
  { path: '/home/inventory', label: 'Stock', icon: Package },
  { path: '/home/pos', label: 'POS', icon: CreditCard },
  { path: '/home/credit', label: 'Credit', icon: Wallet },
]

type MoreItem = { path: string; label: string; icon: ElementType; permission?: OrgPermissions; orgMemberOnly?: boolean }

const moreItems: MoreItem[] = [
  { path: '/home/customers', label: 'Customers', icon: Users },
  { path: '/home/market/orders', label: 'Orders', icon: ReceiptText },
  { path: '/home/finance', label: 'Finance', icon: Wallet, permission: 'finance' },
  { path: '/home/hrm', label: 'HRM', icon: Contact, permission: 'hrm' },
  { path: '/home/supply', label: 'Supply Chain', icon: Truck, permission: 'supply' },
  { path: '/home/attendance', label: 'Attendance', icon: Clock, orgMemberOnly: true },
  { path: '/home/spreadsheet', label: 'SpreadSheet', icon: FileSpreadsheet },
  { path: '/home/users', label: 'Users', icon: UserCog, permission: 'users' },
  { path: '/home/calculator', label: 'Calc', icon: Calculator },
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
      {/* Backdrop */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 45,
              transition: 'opacity 0.25s ease',
            }}
          />
          {/* More menu sheet */}
          <div
            style={{
              position: 'fixed',
              left: '12px',
              right: '12px',
              bottom: '90px',
              background: 'var(--bg-surface)',
              borderRadius: '20px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.15), 0 0 0 1px var(--border-default)',
              zIndex: 50,
              padding: '6px',
              maxHeight: '50vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-default)', margin: '8px auto 6px' }} />
            {visibleMoreItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  onTouchStart={() => preloadRoute(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '13px 16px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: isActive ? 'var(--text-on-dark)' : 'var(--text-primary)',
                    background: isActive ? 'var(--bg-nav-active)' : 'transparent',
                    transition: 'background 0.15s',
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

      {/* Floating pill navbar */}
      <nav
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '6px 8px',
          background: 'var(--bg-surface)',
          borderRadius: '28px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px var(--border-default)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 40,
        }}
      >
        {primaryItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              onTouchStart={() => preloadRoute(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '8px 12px',
                borderRadius: '20px',
                fontSize: '10px',
                fontWeight: 600,
                textDecoration: 'none',
                minWidth: '52px',
                color: isActive ? 'var(--text-on-dark)' : 'var(--text-muted)',
                background: isActive ? 'var(--bg-nav-active)' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon style={{ width: '20px', height: '20px' }} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* More button with active indicator */}
        <button
          onClick={() => setOpen(p => !p)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: 600,
            background: isMoreActive ? 'var(--bg-nav-active)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            minWidth: '52px',
            color: isMoreActive ? 'var(--text-on-dark)' : 'var(--text-muted)',
            transition: 'all 0.2s ease',
          }}
        >
          <MoreHorizontal style={{ width: '20px', height: '20px' }} />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
