import { useContext, useRef, useEffect } from 'react'
import { AlertTriangle, Bell, CreditCard, DollarSign, X, Trash2, FileText, Wallet, Clock, Package, ChevronRight, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Authcontext } from '@/context/auth_context'
import { NotificationContext, type Notification } from '@/context/notification_context'
import { OrgNotificationContext, type OrgNotificationContextType } from '@/context/org_notification_context'
import { CurrencyContext } from '@/context/currency_context'
import type { OrgNotification } from '@/lib/orgTypes'

const typeConfig: Record<string, { icon: LucideIcon; color: string }> = {
  new_sale: { icon: DollarSign, color: 'var(--text-success)' },
  low_stock: { icon: AlertTriangle, color: 'var(--text-warning)' },
  credit_payment: { icon: CreditCard, color: 'var(--text-info)' },
  system: { icon: Bell, color: 'var(--text-muted)' },
}

const orgKindConfig: Record<string, { icon: LucideIcon; color: string }> = {
  sale: { icon: DollarSign, color: 'var(--text-success)' },
  credit: { icon: CreditCard, color: 'var(--text-info)' },
  invoice: { icon: FileText, color: 'var(--text-info)' },
  payroll: { icon: Wallet, color: 'var(--text-info)' },
  low_stock: { icon: AlertTriangle, color: 'var(--text-warning)' },
  check_in: { icon: Clock, color: 'var(--text-info)' },
  inventory: { icon: Package, color: 'var(--text-info)' },
  system: { icon: Bell, color: 'var(--text-muted)' },
}

interface Props {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: Props) {
  const { orgUser } = useContext(Authcontext)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const personal = useContext(NotificationContext)
  const org = useContext(OrgNotificationContext)

  const notifications = orgUser ? org.notifications : personal.notifications
  const loading = orgUser ? org.loading : personal.loading
  const markAllAsRead = orgUser ? org.markAllAsRead : personal.markAllAsRead
  const markAsRead = orgUser ? org.markAsRead : personal.markAsRead

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
            style={{ fontSize: '11px', color: 'var(--text-info)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
            {orgUser && <p style={{ margin: '4px 0 0 0' }}>Transactions carried out by any employee will appear here.</p>}
          </div>
        )}
        {!loading && orgUser && notifications.map((n) => (
          <OrgNotificationItem
            key={n.id}
            notification={n as OrgNotification}
            context={org}
            onMarkRead={markAsRead}
            isUnread={!((n as OrgNotification).read_by).includes(orgUser.id)}
          />
        ))}
        {!loading && !orgUser && notifications.map((n) => (
          <NotificationItem key={n.id} notification={n as Notification} onMarkRead={markAsRead} onDelete={personal.deleteNotification} />
        ))}
      </div>

      {orgUser && (
        <div style={{ borderTop: '1px solid var(--bg-tertiary)' }}>
          <Link
            to="/home/notifications"
            onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', fontSize: '12px', color: 'var(--text-info)', textDecoration: 'none' }}
          >
            View all notifications <ChevronRight style={{ width: '14px', height: '14px' }} />
          </Link>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification: n, onMarkRead, onDelete }: { notification: Notification; onMarkRead: (id: string) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
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
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(n.id) }}
        title="Delete notification"
        style={{ flexShrink: 0, alignSelf: 'center', color: 'var(--text-placeholder)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
      >
        <Trash2 style={{ width: '14px', height: '14px' }} />
      </button>
      {!n.is_read && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-info)' }} />
        </div>
      )}
    </div>
  )
}

function OrgNotificationItem({
  notification: n,
  context,
  onMarkRead,
  isUnread,
}: {
  notification: OrgNotification
  context: OrgNotificationContextType
  onMarkRead: (id: string) => Promise<void>
  isUnread: boolean
}) {
  const { format } = useContext(CurrencyContext)
  const cfg = orgKindConfig[n.kind] || orgKindConfig.system
  const Icon = cfg.icon

  return (
    <div
      onClick={() => isUnread && onMarkRead(n.id)}
      style={{
        display: 'flex',
        gap: '10px',
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--bg-tertiary)',
        background: isUnread ? 'var(--bg-highlighted)' : 'var(--bg-surface)',
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
          {n.actor_name} · {timeAgo(n.created_at)}
        </p>
      </div>
      {n.amount > 0 && (
        <div style={{ flexShrink: 0, alignSelf: 'center', fontSize: '11px', fontWeight: 600, color: 'var(--text-success)', whiteSpace: 'nowrap' }}>
          {format(n.amount)}
        </div>
      )}
      {context.canDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); context.deleteNotification(n.id) }}
          title="Delete notification"
          style={{ flexShrink: 0, alignSelf: 'center', color: 'var(--text-placeholder)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
        >
          <Trash2 style={{ width: '14px', height: '14px' }} />
        </button>
      )}
      {isUnread && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-info)' }} />
        </div>
      )}
    </div>
  )
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
