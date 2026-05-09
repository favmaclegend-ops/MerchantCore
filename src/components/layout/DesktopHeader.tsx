import { useContext } from 'react'
import { Bell, User, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Authcontext } from '@/context/auth_context'

const pageConfig: Record<string, { title: string; search?: string }> = {
  '/home/dashboard': { title: 'Dashboard' },
  '/home/inventory': { title: 'Inventory Manager', search: 'Search inventory...' },
  '/home/pos': { title: 'POS Terminal', search: 'Search products...' },
  '/home/credit': { title: 'Credit Ledger', search: 'Search accounts...' },
  '/home/customers': { title: 'Customer Directory', search: 'Search customers...' },
}

export function DesktopHeader() {
  const location = useLocation()
  const bp = useBreakpoint()
  const { user } = useContext(Authcontext)
  const config = pageConfig[location.pathname] ?? pageConfig['/']

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
        <button style={{ position: 'relative', padding: '8px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Bell style={{ width: '16px', height: '16px' }} />
          <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }}></span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
          <div style={{ width: '28px', height: '28px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User style={{ width: '14px', height: '14px', color: '#475569' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#0f172a', lineHeight: 1.3, margin: 0 }}>{user?.full_name || 'User'}</p>
            <p style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.3, margin: 0 }}>Admin</p>
          </div>
        </div>
      </div>
    </header>
  )
}
