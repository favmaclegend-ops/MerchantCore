import { useState, useContext, useRef, useLayoutEffect } from 'react'
import type { ElementType } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Package, CreditCard, ShoppingCart, Calculator, Users, UserCog, Settings, MoreHorizontal, ChevronRight, Wallet, Contact, Clock, Truck, FileSpreadsheet, ReceiptText, MessageCircle } from 'lucide-react'
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
  { path: '/home/market/chat', label: 'Chat', icon: MessageCircle },
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

  const isMoreActive = open || visibleMoreItems.some(i => location.pathname === i.path)

  const activeIndex = (() => {
    const p = primaryItems.findIndex(i => location.pathname === i.path)
    if (p !== -1) return p
    if (isMoreActive) return primaryItems.length
    return -1
  })()

  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const initRef = useRef(false)

  useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator || activeIndex < 0) return

    const nodes = Array.from(nav.querySelectorAll('[data-nav-index]'))
    const node = nodes[activeIndex] as HTMLElement | undefined
    if (!node) return

    indicator.style.left = '0'
    indicator.style.width = `${node.offsetWidth}px`
    indicator.style.height = `${node.offsetHeight}px`
    indicator.style.top = `${node.offsetTop}px`
    indicator.style.transform = `translateX(${node.offsetLeft}px)`

    if (!initRef.current) {
      indicator.classList.add('no-anim')
      requestAnimationFrame(() => indicator.classList.remove('no-anim'))
    }
    initRef.current = true
  }, [activeIndex, bp.lg])

  if (bp.lg) return null

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
              bottom: 'calc(90px + var(--safe-bottom))',
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
        ref={navRef}
        style={{
          position: 'fixed',
          bottom: 'calc(16px + var(--safe-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          width: 'auto',
          maxWidth: 'calc(100vw - 24px)',
          padding: '8px 12px',
          background: 'var(--bg-surface)',
          borderRadius: '30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px var(--border-default)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 40,
        }}
      >
        {activeIndex >= 0 && (
          <div
            ref={indicatorRef}
            className="nav-indicator"
            data-nav-indicator=""
          >
            <div
              key={location.pathname}
              className="nav-indicator-pop"
            />
          </div>
        )}
        {primaryItems.map((item, i) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              data-nav-index={i}
              onClick={() => setOpen(false)}
              onTouchStart={() => preloadRoute(item.path)}
              style={{
                position: 'relative',
                zIndex: 1,
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
                transition: 'color 0.25s ease',
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
          data-nav-index={primaryItems.length}
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '10px',
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            minWidth: '52px',
            color: isMoreActive ? 'var(--text-on-dark)' : 'var(--text-muted)',
            transition: 'color 0.25s ease',
          }}
        >
          <MoreHorizontal style={{ width: '20px', height: '20px' }} />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
