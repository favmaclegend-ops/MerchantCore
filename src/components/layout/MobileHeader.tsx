import { useContext, useState, useRef, useEffect } from 'react'
import { Bell, User, Settings, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Authcontext } from '@/context/auth_context'
import { NotificationContext } from '@/context/notification_context'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'

const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  '/home/dashboard': { title: 'Dashboard', subtitle: "Here's what's happening today" },
  '/home/inventory': { title: 'Inventory', subtitle: 'Stock tracking & management' },
  '/home/pos': { title: 'POS Terminal', subtitle: 'Point of sale' },
  '/home/credit': { title: 'Credit Ledger', subtitle: 'Manage accounts & payments' },
  '/home/customers': { title: 'Customers', subtitle: 'Directory & profiles' },
  '/home/calculator': { title: 'Calculator', subtitle: 'Business tools & currency' },
  '/home/settings': { title: 'Settings', subtitle: 'Account & preferences' },
}

export function MobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const { user, logout } = useContext(Authcontext)
  const { unreadCount } = useContext(NotificationContext)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const config = pageConfig[location.pathname] ?? { title: '' }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (bp.lg) return null

  return (
    <header style={{ display: 'flex', position: 'sticky', top: 0, background: 'var(--bg-header)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border-default)', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{config.title}</h2>
        {config.subtitle && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{config.subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifications(p => !p)} style={{ position: 'relative', padding: '8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>\n            <Bell style={{ width: '20px', height: '20px' }} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
            )}
          </button>
          {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
        </div>
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowUserMenu(p => !p)} style={{ width: '32px', height: '32px', background: 'var(--border-input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
            <User style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
          </button>
          {showUserMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', width: '180px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-default)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 9999 }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bg-tertiary)' }}>\n                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{user?.full_name || 'User'}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{user?.email || ''}</p>
              </div>
              <button onClick={() => { navigate('/home/settings'); setShowUserMenu(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--bg-tertiary)' }}>\n                <Settings style={{ width: '14px', height: '14px' }} />
                Settings
              </button>
              <button onClick={() => { logout() }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', fontSize: '13px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                <LogOut style={{ width: '14px', height: '14px' }} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
