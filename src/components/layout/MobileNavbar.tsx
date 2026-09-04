import { useState, useContext, useRef, useLayoutEffect, useEffect } from 'react'
import type { ElementType } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, Package, CreditCard, ShoppingCart, Calculator, Users, UserCog, Settings, MoreHorizontal, ChevronRight, Wallet, Contact, Clock, Truck, FileSpreadsheet, ReceiptText, MessageCircle, Building } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Authcontext } from '@/context/auth_context'
import { canAccess, type OrgPermissions } from '@/lib/orgAccess'
import { preloadRoute } from '@/lib/routePreload'
import { safeBottomInset } from '@/lib/browser'

// Extra raise above the safe-area inset for the floating bottom nav on browsers
// that are NOT iOS Safari. iOS Safari reports the real safe-area inset, while
// other browsers typically resolve it to 0 — so we lift the nav by a fixed
// amount so the home-indicator / system UI never overlaps it. See `lib/browser`.
const SAFE_BOTTOM_EXTRA = 16
const NAV_SAFE_BOTTOM = safeBottomInset(SAFE_BOTTOM_EXTRA)

const primaryItems = [
  { path: '/home/dashboard', label: 'Sales', icon: LayoutGrid },
  { path: '/home/market', label: 'Market', icon: ShoppingCart },
  { path: '/home/inventory', label: 'Stock', icon: Package },
  { path: '/home/pos', label: 'POS', icon: CreditCard },
  { path: '/home/services', label: 'Services', icon: Building },

]

type MoreItem = { path: string; label: string; icon: ElementType; permission?: OrgPermissions; orgMemberOnly?: boolean }

const moreItems: MoreItem[] = [
  { path: '/home/customers', label: 'Customers', icon: Users },
  { path: '/home/credit', label: 'Credit', icon: Wallet },
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

  const getActiveIndex = () => {
    const p = primaryItems.findIndex(i => location.pathname === i.path)
    if (p !== -1) return p
    if (isMoreActive) return primaryItems.length
    return -1
  }
  const activeIndex = getActiveIndex()

  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const initRef = useRef(false)
  const navigate = useNavigate()
  const dragRef = useRef({ dragging: false, lastX: 0 })
  const draggedRef = useRef(false)
  const [pressing, setPressing] = useState(false)

  const sheetRef = useRef<HTMLDivElement>(null)
  const sheetDragRef = useRef({ dragging: false, startY: 0, dy: 0 })
  const [closing, setClosing] = useState(false)
  const SHEET_CLOSE_THRESHOLD = 120

  useEffect(() => {
    if (open) {
      const sheet = sheetRef.current
      if (sheet) {
        sheet.style.transition = 'none'
        sheet.style.transform = 'translateY(100%)'
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            sheet.style.transition = 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)'
            sheet.style.transform = 'translateY(0)'
          })
        })
      }
    }
  }, [open])

  const closeSheet = () => {
    setClosing(true)
    const sheet = sheetRef.current
    if (sheet) {
      sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
      sheet.style.transform = 'translateY(100%)'
    }
    window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 300)
  }

  const handleSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    sheetDragRef.current = { dragging: true, startY: e.clientY, dy: 0 }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore capture errors */
    }
  }

  const handleSheetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = sheetDragRef.current
    const sheet = sheetRef.current
    if (!s.dragging || !sheet) return
    const dy = e.clientY - s.startY
    if (dy > 0 && sheet.scrollTop <= 0) {
      s.dy = dy
      sheet.style.transition = 'none'
      sheet.style.transform = `translateY(${dy}px)`
      e.preventDefault?.()
    }
  }

  const handleSheetPointerUp = () => {
    const s = sheetDragRef.current
    const sheet = sheetRef.current
    if (!s.dragging || !sheet) return
    s.dragging = false
    if (s.dy >= SHEET_CLOSE_THRESHOLD) {
      closeSheet()
    } else {
      sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
      sheet.style.transform = 'translateY(0)'
    }
  }

  const positionIndicator = () => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) return
    const p = primaryItems.findIndex(i => location.pathname === i.path)
    const idx = p !== -1 ? p : isMoreActive ? primaryItems.length : -1
    if (idx < 0) return
    const nodes = Array.from(nav.querySelectorAll('[data-nav-index]'))
    const node = nodes[idx] as HTMLElement | undefined
    if (!node) return
    indicator.style.width = `${node.offsetWidth}px`
    indicator.style.height = `${node.offsetHeight}px`
    indicator.style.top = `${node.offsetTop}px`
    indicator.style.transform = `translateX(${node.offsetLeft}px)`
  }

  useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator || activeIndex < 0) return
    positionIndicator()
    if (!initRef.current) {
      indicator.classList.add('no-anim')
      requestAnimationFrame(() => indicator.classList.remove('no-anim'))
    }
    initRef.current = true
  }, [activeIndex, bp.lg])

  const NAV_DRAG_THRESHOLD = 8

  const handleNavPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    draggedRef.current = false
    dragRef.current = { dragging: false, lastX: e.clientX }
    setPressing(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore capture errors */
    }
  }

  const handleNavPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const state = dragRef.current
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!state || !nav || !indicator) return
    const dx = Math.abs(e.clientX - state.lastX)
    if (!state.dragging && dx > NAV_DRAG_THRESHOLD) {
      state.dragging = true
      draggedRef.current = true
      e.preventDefault?.()
    }
    if (state.dragging) {
      const rect = nav.getBoundingClientRect()
      const w = indicator.offsetWidth
      let x = e.clientX - rect.left - w / 2
      x = Math.min(Math.max(x, 0), rect.width - w)
      indicator.style.transform = `translateX(${x}px)`
      state.lastX = e.clientX
    }
  }

  const handleNavPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const state = dragRef.current
    const nav = navRef.current
    const indicator = indicatorRef.current
    setPressing(false)

    if (state && state.dragging && nav && indicator) {
      const rect = nav.getBoundingClientRect()
      const x = e.clientX - rect.left
      const nodes = Array.from(nav.querySelectorAll('[data-nav-index]'))
      let target: HTMLElement | null = null
      for (const n of nodes as HTMLElement[]) {
        const r = n.getBoundingClientRect()
        if (x >= r.left - rect.left && x <= r.right - rect.left) {
          target = n
          break
        }
      }
      if (target) {
        const idx = Number(target.dataset.navIndex)
        if (idx < primaryItems.length) {
          draggedRef.current = false
          navigate(primaryItems[idx].path)
          setOpen(false)
          return
        }
        setOpen(p => !p)
      }
    }
    positionIndicator()
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    if (draggedRef.current) {
      e.preventDefault()
      draggedRef.current = false
      return
    }
    setOpen(false)
  }

  if (bp.lg) return null

  return (
    <>
      {/* Backdrop */}
      {(open || closing) && (
        <div
          onClick={closeSheet}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 45,
            opacity: open ? 1 : 0,
            visibility: open ? 'visible' : 'hidden',
            transition: 'opacity 0.25s ease, visibility 0.25s ease',
          }}
        />
      )}

      {/* More menu bottom sheet */}
      {(open || closing) && (
        <div
          ref={sheetRef}
          onPointerDown={handleSheetPointerDown}
          onPointerMove={handleSheetPointerMove}
          onPointerUp={handleSheetPointerUp}
          onPointerCancel={handleSheetPointerUp}
          style={{
            position: 'fixed',
            left: '12px',
            right: '12px',
            bottom: NAV_SAFE_BOTTOM,
            background: 'var(--bg-surface)',
            borderRadius: '20px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.15), 0 0 0 1px var(--border-default)',
            zIndex: 900,
            padding: '6px',
            maxHeight: '60vh',
            overflowY: 'auto',
            overscrollBehaviorY: 'contain',
            willChange: 'transform',
           
          }}
        >
          <div style={{ width: '36px',  height: '4px', borderRadius: '2px', background: 'var(--border-default)', margin: '8px auto 6px', cursor: 'grab' }} />
          {visibleMoreItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSheet}
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
      )}

      {/* Floating pill navbar */}
      <nav
        ref={navRef}
        onPointerDown={handleNavPointerDown}
        onPointerMove={handleNavPointerMove}
        onPointerUp={handleNavPointerUp}
        onPointerCancel={handleNavPointerUp}
        onContextMenu={e => e.preventDefault()}
        className="mobile-navbar"
        style={{
          position: 'fixed',
          bottom: NAV_SAFE_BOTTOM,
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
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
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
              className={`nav-indicator-pop${pressing ? ' drag-scale' : ''}`}
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
              onClick={handleLinkClick}
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
          onClick={(e) => {
            if (draggedRef.current) {
              e.preventDefault()
              draggedRef.current = false
              return
            }
            setOpen(p => !p)
          }}
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
