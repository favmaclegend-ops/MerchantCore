import { useContext, useState, useRef, useEffect } from 'react'
import { Bell, User, Settings, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Authcontext } from '@/context/auth_context'
import { NotificationContext } from '@/context/notification_context'
import { OrgNotificationContext } from '@/context/org_notification_context'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { useStore } from 'elk-components'
import { marketStore } from '@/pages/market/demoMarketStore'

const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  '/home/dashboard': { title: 'Dashboard' },
  '/home/inventory': { title: 'Inventory' },
  '/home/pos': { title: 'POS Terminal' },
  '/home/credit': { title: 'Credit Ledger' },
  '/home/customers': { title: 'Customers' },
  '/home/calculator': { title: 'Calculator' },
  '/home/notifications': { title: 'Notifications' },
  '/home/supply': { title: 'Supply Chain' },
  '/home/settings': { title: 'Settings' },
  '/home/users': { title: 'Users' },
  '/home/attendance': { title: 'Attendance' },
  '/home/hrm': { title: 'HRM' },
  '/home/finance': { title: 'Finance' },
  '/home/market': { title: 'Market' },
  '/home/services': {title: 'Services'},
  '/home/service-requests': {title: 'Service Requests'},
  '/home/inbox': {title: 'Inbox'}
}

export function MobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const { user, orgUser, logout } = useContext(Authcontext)
  const { unreadCount: personalUnread } = useContext(NotificationContext)
  const { unreadCount: orgUnread } = useContext(OrgNotificationContext)
  const unreadCount = orgUser ? orgUnread : personalUnread
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const state = useStore(marketStore)
  const isShopPage = /^\/home\/market\/[^/]+/.test(location.pathname) ||
    /^\/market\/[^/]+/.test(location.pathname)

  let title = pageConfig[location.pathname]?.title ?? ''

  if (isShopPage) {
    const segments = location.pathname.split('/')
    const shopId = segments[segments.indexOf('market') + 1]
    const shop = state.shops?.[shopId]
    title = shop?.shop_name ?? 'Shop'
  }

  const displayName = orgUser?.name || user?.full_name || 'User'
  const displayEmail = orgUser?.email || user?.email || ''

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (bp.lg) return null

  // Hide the app header on a shop/store page — the shop renders its own
  // immersive header/back button over the cover image.
  if (isShopPage) return null

  return (
    <header
      style={{
        display: 'flex',
        position: 'sticky',
        top: 0,
        height: 'calc(56px + var(--safe-top))',
        paddingTop: 'var(--safe-top)',
        background: 'var(--bg-header)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        boxShadow: '0 1px 0 0 var(--border-default), 0 4px 16px -4px rgba(0,0,0,0.08)',
        paddingLeft: 'calc(12px + var(--safe-left))',
        paddingRight: 'calc(12px + var(--safe-right))',
        paddingBottom: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 30,
      }}
    >
      {/* Left: Profile avatar */}
      <div ref={userMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false) }}
          style={{
            width: '34px',
            height: '34px',
            background: 'var(--bg-nav-active)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          <User style={{ width: '16px', height: '16px', color: 'var(--bg-surface)' }} />
        </button>
        {showUserMenu && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: '200px',
              background: 'var(--bg-surface)',
              borderRadius: '14px',
              border: '1px solid var(--border-default)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              zIndex: 9999,
            }}
          >
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--bg-tertiary)' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{displayName}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{displayEmail}</p>
            </div>
            <button
              onClick={() => { navigate('/home/settings'); setShowUserMenu(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid var(--bg-tertiary)',
              }}
            >
              <Settings style={{ width: '14px', height: '14px' }} />
              Settings
            </button>
            <button
              onClick={() => { logout() }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', fontSize: '13px', color: 'var(--text-danger)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <LogOut style={{ width: '14px', height: '14px' }} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Center: Title */}
      <h2
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: 0,
          textAlign: 'center',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: '-0.01em',
          padding: '0 8px',
        }}
      >
        {title}
      </h2>

      {/* Right: Notification bell */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false) }}
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <Bell style={{ width: '20px', height: '20px' }} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '7px',
                right: '7px',
                minWidth: '8px',
                height: '8px',
                padding: '0 3px',
                background: '#ef4444',
                borderRadius: '999px',
                border: '2px solid var(--bg-header)',
              }}
            />
          )}
        </button>
        {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
      </div>
    </header>
  )
}
