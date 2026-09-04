import { useContext, useState, useRef, useEffect, type ChangeEvent } from 'react'
import { Bell, User, Search, Settings, LogOut } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Authcontext } from '@/context/auth_context'
import { NotificationContext } from '@/context/notification_context'
import { OrgNotificationContext } from '@/context/org_notification_context'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import {  useComponentData, useStore,} from 'elk-components'
import type { OrgProduct } from '@/lib/orgTypes'
import { store } from '@/context/store'

const pageConfig: Record<string, { title: string; search?: string }> = {
  '/home/dashboard': { title: 'Dashboard' },
  '/home/inventory': { title: 'Inventory Manager', search: 'Search inventory...' },
  '/home/pos': { title: 'POS Terminal', search: 'Search products...' },
  '/home/credit': { title: 'Credit Ledger', search: 'Search accounts...' },
  '/home/customers': { title: 'Customer Directory', search: 'Search customers...' },
  '/home/calculator': { title: 'Calculator' },
  '/home/notifications': { title: 'Notifications & Alerts' },
  '/home/market': {title: 'Merchant Core Market'},
  '/home/supply': { title: 'Supply Chain & Logistics' },
  '/home/users': {title: 'Users' },
  '/home/settings': { title: 'Settings' },
  '/home/attendance': { title: 'Attendance' },
  '/home/hrm': { title: 'HRM' },
  '/home/finance': { title: 'Finance' },
  '/home/spreadsheet': { title: 'SpreadSheet' },
  '/home/services': {title: 'Services'},
  '/home/service-requests': {title: 'Service Requests'}
}

export function DesktopHeader() {
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
  const config = pageConfig[location.pathname] ?? { title: '' }

  // =====================================================================================================
  // POS
  // =====================================================================================================
  
  useStore(store)
  
  const setPosProduct = useComponentData<React.Dispatch<React.SetStateAction<OrgProduct[]>>>('POS', 'setProducts')

  const staticData = store.getState().staticData

 
  /**
   * =================================================
   * HANDLE POS SEARCH
   * This function handle pos search using external store name static data
   * 
   */
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {

    // console.log(staticData)

    const target = e.currentTarget
    const value = target.value.trim().toLowerCase()

    if (!setPosProduct) {console.log(setPosProduct); return}

    if (!value) {
      setPosProduct(staticData)
      return
    }

    const filtered = staticData.filter(product => product?.name?.toLowerCase().includes(value))
    setPosProduct(filtered)
  }

  const displayName = orgUser?.name || user?.full_name || 'User'
  const displayRole = orgUser
    ? orgUser.role === 'super-admin' ? 'Super Admin' : orgUser.role === 'admin' ? 'Admin' : orgUser.jobTitle || 'Staff'
    : 'Admin'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!bp.lg) return null

  return (
    <header style={{ display: 'flex', flexShrink: 0, background: 'var(--bg-header)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--border-default)', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 }}>
      <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{config.title}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {config.search && (
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--text-placeholder)' }} />
            <input
              type="text"
              placeholder={config.search}
              style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '6px', paddingBottom: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: '4px', fontSize: '12px', width: '192px', outline: 'none', color: 'var(--text-primary)' }}
              onChange={(e) => handleSearch(e)}
            />
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifications(p => !p)} style={{ position: 'relative', padding: '8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Bell style={{ width: '16px', height: '16px' }} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }}></span>
            )}
          </button>

          {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
        </div>
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowUserMenu(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid var(--border-default)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: '28px', height: '28px', background: 'var(--border-input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User style={{ width: '14px', height: '14px', color: 'var(--text-secondary)' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>{displayName}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.3, margin: 0 }}>{displayRole}</p>
            </div>
          </button>
          {showUserMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', width: '180px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-default)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 9999 }}>
              <button onClick={() => { navigate('/home/settings'); setShowUserMenu(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', fontSize: '13px', color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--bg-tertiary)' }}>
                <Settings style={{ width: '14px', height: '14px' }} />
                Settings
              </button>
              <button onClick={() => { logout() }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', fontSize: '13px', color: 'var(--text-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
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
