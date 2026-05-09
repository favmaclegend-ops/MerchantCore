import { useContext, useState } from 'react'
import { Bell, User } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { NotificationContext } from '@/context/notification_context'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'

const pageConfig: Record<string, { title: string; subtitle?: string }> = {
  '/home/dashboard': { title: 'Dashboard', subtitle: "Here's what's happening today" },
  '/home/inventory': { title: 'Inventory', subtitle: 'Stock tracking & management' },
  '/home/pos': { title: 'POS Terminal', subtitle: 'Point of sale' },
  '/home/credit': { title: 'Credit Ledger', subtitle: 'Manage accounts & payments' },
  '/home/customers': { title: 'Customers', subtitle: 'Directory & profiles' },
}

export function MobileHeader() {
  const location = useLocation()
  const bp = useBreakpoint()
  const { unreadCount } = useContext(NotificationContext)
  const [showNotifications, setShowNotifications] = useState(false)
  const config = pageConfig[location.pathname] ?? pageConfig['/']

  if (bp.lg) return null

  return (
    <header style={{ display: 'flex', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{config.title}</h2>
        {config.subtitle && <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>{config.subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifications(p => !p)} style={{ position: 'relative', padding: '8px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Bell style={{ width: '20px', height: '20px' }} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
            )}
          </button>
          {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
        </div>
        <div style={{ width: '32px', height: '32px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User style={{ width: '16px', height: '16px', color: '#475569' }} />
        </div>
      </div>
    </header>
  )
}
