import { useContext, useRef, useEffect } from 'react'
import { AlertTriangle, Bell, CreditCard, DollarSign, X } from 'lucide-react'
import { NotificationContext, type Notification } from '@/context/notification_context'

const typeConfig: Record<string, { icon: typeof DollarSign; color: string }> = {
  new_sale: { icon: DollarSign, color: '#059669' },
  low_stock: { icon: AlertTriangle, color: '#f59e0b' },
  credit_payment: { icon: CreditCard, color: '#2563eb' },
  system: { icon: Bell, color: 'var(--text-muted)' },
}

interface Props {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: Props) {
  const { notifications, loading, markAsRead, markAllAsRead } = useContext(NotificationContext)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '4px',
        width: '360px',
        maxHeight: '480px',
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-default)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-default)' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={markAllAsRead}
            style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Mark all read
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-placeholder)' }}>
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading && (
          <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-placeholder)' }}>Loading...</div>
        )}
        {!loading && notifications.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-placeholder)' }}>
            <Bell style={{ width: '24px', height: '24px', margin: '0 auto 8px', color: 'var(--border-input)' }} />
            <p style={{ margin: 0 }}>No notifications yet</p>
          </div>
        )}
        {!loading && notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} onMarkRead={markAsRead} />
        ))}
      </div>
    </div>
  )
}

function NotificationItem({ notification: n, onMarkRead }: { notification: Notification; onMarkRead: (id: string) => Promise<void> }) {
  const cfg = typeConfig[n.type] || typeConfig.system
  const Icon = cfg.icon

  return (
    <div
      onClick={() => !n.is_read && onMarkRead(n.id)}
      style={{
        display: 'flex',
        gap: '10px',
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--bg-tertiary)',
        background: n.is_read ? 'var(--bg-surface)' : '#f0f9ff',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ marginTop: '2px', flexShrink: 0 }}>
        <Icon style={{ width: '16px', height: '16px', color: cfg.color }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{n.title}</p>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3, margin: '2px 0 0 0' }}>{n.message}</p>
        <p style={{ fontSize: '10px', color: 'var(--text-placeholder)', marginTop: '4px', margin: '4px 0 0 0' }}>
          {new Date(n.created_at).toLocaleString()}
        </p>
      </div>
      {!n.is_read && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
        </div>
      )}
    </div>
  )
}
