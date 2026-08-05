import { useContext, useEffect, useState } from 'react'
import { AlertTriangle, Bell, CheckCheck, Clock, CreditCard, DollarSign, FileText, Package, ShieldAlert, Trash2, Wallet, type LucideIcon } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Authcontext } from '@/context/auth_context'
import { OrgNotificationContext } from '@/context/org_notification_context'
import { CurrencyContext } from '@/context/currency_context'
import type { OrgNotification, OrgNotificationSeverity } from '@/data/orgNotifications'

const kindConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  sale: { icon: DollarSign, color: 'var(--text-success)', bg: 'var(--bg-success)' },
  credit: { icon: CreditCard, color: 'var(--text-info)', bg: 'var(--bg-info)' },
  invoice: { icon: FileText, color: 'var(--text-info)', bg: 'var(--bg-info)' },
  payroll: { icon: Wallet, color: 'var(--text-info)', bg: 'var(--bg-info)' },
  low_stock: { icon: AlertTriangle, color: 'var(--text-warning)', bg: 'var(--bg-warning)' },
  check_in: { icon: Clock, color: 'var(--text-info)', bg: 'var(--bg-info)' },
  inventory: { icon: Package, color: 'var(--text-info)', bg: 'var(--bg-info)' },
  system: { icon: Bell, color: 'var(--text-muted)', bg: 'var(--bg-tertiary)' },
}

const severityLabel: Record<OrgNotificationSeverity, string> = {
  success: 'Transaction',
  info: 'Notification',
  warning: 'Alert',
  danger: 'Alert',
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

type Filter = 'all' | 'alerts' | 'notifications'

export function NotificationsPage() {
  const bp = useBreakpoint()
  const { orgUser } = useContext(Authcontext)
  const { format } = useContext(CurrencyContext)
  const {
    notifications, unreadCount, loading, canDelete, settings,
    markAsRead, markAllAsRead, deleteNotification, clearAll, setSettings, fetch,
  } = useContext(OrgNotificationContext)

  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    void fetch()
  }, [fetch])

  const alertCount = notifications.filter(n => n.is_alert).length
  const filtered =
    filter === 'all'
      ? notifications
      : notifications.filter(n => (filter === 'alerts' ? n.is_alert : !n.is_alert))

  const filterButton = (value: Filter): React.CSSProperties => ({
    padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '999px', border: '1px solid var(--border-default)', cursor: 'pointer',
    background: filter === value ? 'var(--bg-nav-active)' : 'var(--bg-surface)',
    color: filter === value ? 'var(--text-on-dark)' : 'var(--text-secondary)',
  })

  const statCard = (bg?: string): React.CSSProperties => ({
    background: bg ?? 'var(--bg-surface)', borderRadius: '8px', border: bg ? 'none' : '1px solid var(--border-default)', padding: '14px 16px',
  })

  const readStateFor = (n: OrgNotification) => !!orgUser && n.read_by.includes(orgUser.id)

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Notifications & Alerts</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
          Every transaction carried out by any employee is shown here so all members stay informed.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: bp.sm ? 'repeat(3, 1fr)' : '1fr', gap: '12px' }}>
        <div style={statCard('var(--bg-nav-active)')}>
          <span style={{ fontSize: '10px', color: 'var(--text-on-dark)', textTransform: 'uppercase', opacity: 0.75 }}>Total Activity</span>
          <p style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', margin: '4px 0 0 0', color: 'var(--text-on-dark)' }}>{notifications.length}</p>
        </div>
        <div style={statCard()}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unread</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: unreadCount ? 'var(--text-info)' : 'var(--text-primary)', marginTop: '4px', margin: '4px 0 0 0' }}>{unreadCount}</p>
        </div>
        <div style={statCard()}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Alerts</span>
          <p style={{ fontSize: '20px', fontWeight: 700, color: alertCount ? 'var(--text-warning)' : 'var(--text-primary)', marginTop: '4px', margin: '4px 0 0 0' }}>{alertCount}</p>
        </div>
      </div>

      {orgUser?.role === 'super-admin' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--bg-warning)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert style={{ width: '16px', height: '16px', color: 'var(--text-warning)' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Administrator delete access</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {settings.allow_admin_delete
                  ? 'Normal admins can now delete alerts and notifications.'
                  : 'Only you (Super Admin) can delete alerts and notifications. Grant admins the same right with this switch.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettings({ allow_admin_delete: !settings.allow_admin_delete })}
            aria-label="Toggle administrator delete access"
            style={{
              width: '40px', height: '22px', borderRadius: '999px', border: 'none', cursor: 'pointer', flexShrink: 0, position: 'relative',
              background: settings.allow_admin_delete ? 'var(--bg-nav-active)' : 'var(--border-input)', transition: 'background 0.15s',
            }}
          >
            <span style={{
              position: 'absolute', top: '3px', left: settings.allow_admin_delete ? '21px' : '3px', width: '16px', height: '16px',
              borderRadius: '50%', background: '#fff', transition: 'left 0.15s',
            }} />
          </button>
        </div>
      )}
      {orgUser?.role === 'admin' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '12px 16px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            {settings.allow_admin_delete
              ? 'You have delete access granted by the Super Admin.'
              : 'Only the Super Admin can delete alerts and notifications. You can read them and mark them as read.'}
          </p>
        </div>
      )}

      <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '12px', borderBottom: '1px solid var(--bg-tertiary)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Activity Feed</h3>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '999px' }}>{filtered.length}</span>
            <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
              <button onClick={() => setFilter('all')} style={filterButton('all')}>All</button>
              <button onClick={() => setFilter('alerts')} style={filterButton('alerts')}>Alerts</button>
              <button onClick={() => setFilter('notifications')} style={filterButton('notifications')}>Notifications</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={markAllAsRead} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', color: 'var(--text-info)', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', cursor: 'pointer' }}>
              <CheckCheck style={{ width: '14px', height: '14px' }} /> Mark all read
            </button>
            {canDelete && (
              <button onClick={clearAll} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', color: 'var(--text-danger)', background: 'var(--bg-surface)', border: '1px solid var(--border-danger)', borderRadius: '8px', cursor: 'pointer' }}>
                <Trash2 style={{ width: '14px', height: '14px' }} /> Delete all
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-placeholder)', fontSize: '12px' }}>Loading...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '48px 16px', textAlign: 'center' }}>
            <Bell style={{ width: '28px', height: '28px', margin: '0 auto 8px', color: 'var(--border-input)' }} />
            <p style={{ fontSize: '12px', color: 'var(--text-placeholder)', margin: 0 }}>
              {filter === 'all' ? 'No activity yet. Transactions carried out by any employee will appear here.' : 'Nothing matches this filter.'}
            </p>
          </div>
        )}

        {!loading && filtered.map(n => (
          <NotificationRow
            key={n.id}
            notification={n}
            read={readStateFor(n)}
            format={format}
            canDelete={canDelete}
            onMarkRead={markAsRead}
            onDelete={deleteNotification}
          />
        ))}
      </div>
    </div>
  )
}

function NotificationRow({
  notification: n, read, format, canDelete, onMarkRead, onDelete,
}: {
  notification: OrgNotification
  read: boolean
  format: (value: number) => string
  canDelete: boolean
  onMarkRead: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const cfg = kindConfig[n.kind] || kindConfig.system
  const Icon = cfg.icon
  const {orgUser} = useContext(Authcontext)
  return (
    <div
      onClick={() => !read && onMarkRead(n.id)}
      style={{
        display: 'flex', gap: '12px', padding: '12px 16px', cursor: 'pointer',
        borderBottom: '1px solid var(--bg-secondary)',
        background: read ? 'var(--bg-surface)' : 'var(--bg-info)',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ width: '36px', height: '36px', background: cfg.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: '16px', height: '16px', color: cfg.color }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{n.title}</p>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.03em', color: cfg.color, background: cfg.bg, padding: '2px 6px', borderRadius: '999px' }}>
            {n.is_alert ? 'Alert' : severityLabel[n.severity]}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '4px 0 0 0' }}>{n.message}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-placeholder)', margin: 0 }}>
            by <strong style={{ color: 'var(--text-secondary)' }}>{n.actor_name}</strong> · {n.actor_role}
          </p>
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--border-default)' }} />
          <p style={{ fontSize: '10px', color: 'var(--text-placeholder)', margin: 0 }}>{timeAgo(n.created_at)}</p>
          {n.ref && (
            <>
              <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--border-default)' }} />
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Ref {n.ref}</p>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, gap: '6px' }}>
        {n.amount > 0 && (
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-success)', whiteSpace: 'nowrap' }}>
            {orgUser!.role != 'super-admin' && orgUser!.role != 'admin' && orgUser!.role != 'hrm-manager' ? '': format(n.amount)}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-info)' }} />}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(n.id) }}
              title="Delete"
              style={{ color: 'var(--text-placeholder)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <Trash2 style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
