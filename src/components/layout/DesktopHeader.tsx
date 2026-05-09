import { useContext, useState, useRef, useEffect } from 'react'
import { Bell, User, Search, Settings, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Authcontext } from '@/context/auth_context'
import { NotificationContext } from '@/context/notification_context'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'

const pageConfig: Record<string, { title: string; search?: string }> = {
  '/home/dashboard': { title: 'Dashboard' },
  '/home/inventory': { title: 'Inventory Manager', search: 'Search inventory...' },
  '/home/pos': { title: 'POS Terminal', search: 'Search products...' },
  '/home/credit': { title: 'Credit Ledger', search: 'Search accounts...' },
  '/home/customers': { title: 'Customer Directory', search: 'Search customers...' },
}

export function DesktopHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const { user, logout } = useContext(Authcontext)
  const { unreadCount } = useContext(NotificationContext)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const config = pageConfig[location.pathname] ?? pageConfig['/']

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!bp.lg) return null

  return (
    <header style={{ display: 'flex', flexShrink: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 }}>
      <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{config.title}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {config.search && (
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder={config.search}
              style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', width: '192px', outline: 'none', color: '#0f172a' }}
            />
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifications(p => !p)} style={{ position: 'relative', padding: '8px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Bell style={{ width: '16px', height: '16px' }} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }}></span>
            )}
          </button>
          {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
        </div>
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowUserMenu(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0', background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: '28px', height: '28px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User style={{ width: '14px', height: '14px', color: '#475569' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', lineHeight: 1.3, margin: 0 }}>{user?.full_name || 'User'}</p>
              <p style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.3, margin: 0 }}>Admin</p>
            </div>
          </button>
          {showUserMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', width: '180px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 9999 }}>
              <button onClick={() => { navigate('/home/settings'); setShowUserMenu(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', fontSize: '13px', color: '#0f172a', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                <Settings style={{ width: '14px', height: '14px' }} />
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
