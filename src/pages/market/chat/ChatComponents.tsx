import type { ReactNode } from 'react'
import { Search, MessagesSquare, X } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { ChatMessage } from './chatStore'
import { formatRelativeTime, initials } from './chatFormat'

// ---------------------------------------------------------------------------
// Reusable UI pieces
// ---------------------------------------------------------------------------

export function ShopAvatar({ name, image, size = 44 }: { name: string; image?: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--bg-nav-active), var(--bg-nav-active, #2563eb))',
        color: 'var(--bg-surface)',
        fontWeight: 700,
        fontSize: Math.max(12, size * 0.32),
      }}
    >
      {image ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(name)}
    </div>
  )
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.from === 'me'
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div
        style={{
          maxWidth: 'min(78%, 420px)',
          padding: '9px 13px',
          borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: mine ? 'var(--bg-nav-active)' : 'var(--bg-secondary)',
          color: mine ? 'var(--bg-surface)' : 'var(--text-primary)',
          fontSize: '13.5px',
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: '0 1px 2px rgba(0,0,0,.06)',
        }}
      >
        {message.text}
        <span
          style={{
            display: 'block',
            marginTop: 4,
            fontSize: 10,
            opacity: 0.72,
            textAlign: 'right',
          }}
        >
          {formatRelativeTime(message.sentAt)}
        </span>
      </div>
    </div>
  )
}

export function ThreadListItem({
  thread,
  active,
  onClick,
}: {
  thread: { shopName: string; shopImage?: string; messages: ChatMessage[]; unread: number; updatedAt: string }
  active?: boolean
  onClick: () => void
}) {
  const bp = useBreakpoint()
  const last = thread.messages[thread.messages.length - 1]
  const preview = last ? `${last.from === 'me' ? 'You: ' : ''}${last.text}` : 'No messages yet'

  const compact = bp.sm
  const avatarSize = compact ? 40 : 49
  const nameSize = compact ? 15 : 16
  const previewSize = compact ? 12.5 : 13.5
  const timeSize = compact ? 10.5 : 11.5
  const hGap = compact ? 10 : 12
  const hPad = compact ? '10px 12px' : '12px 14px'

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: hGap,
        padding: hPad,
        border: 'none',
        background: active ? 'var(--bg-nav-active)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'background .12s ease',
      }}
    >
      <ShopAvatar name={thread.shopName} image={thread.shopImage} size={avatarSize} />

      <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
        {/* Row 1: name (left) + timestamp (right) */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
          <span
            style={{
              fontSize: nameSize,
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {thread.shopName}
          </span>
          {thread.updatedAt && (
            <span
              style={{
                fontSize: timeSize,
                color: thread.unread ? 'var(--bg-nav-active)' : 'var(--text-muted)',
                fontWeight: thread.unread ? 600 : 400,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {formatRelativeTime(thread.updatedAt)}
            </span>
          )}
        </div>

        {/* Row 2: preview (left, ellipsis) + unread badge (right) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2, minWidth: 0 }}>
          <span
            style={{
              fontSize: previewSize,
              color: thread.unread ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: thread.unread ? 500 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {preview}
          </span>
          {thread.unread > 0 && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                padding: '0 6px',
                boxSizing: 'border-box',
                borderRadius: 999,
                background: '#25d366',
                color: '#fff',
                fontSize: 10.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {thread.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search chats…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const showClear = value.length > 0
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Search
        size={16}
        color="var(--text-muted)"
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 38,
          padding: '0 34px 0 36px',
          fontSize: 14,
          color: 'var(--text-primary)',
          background: showClear
            ? 'var(--bg-secondary)'
            : 'rgba(118,118,128,0.12)',
          border: 'none',
          borderRadius: 12,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'background .15s ease',
        }}
      />
      {showClear && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            padding: 0,
            border: 'none',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={12} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  icon = <MessagesSquare size={34} />,
  title,
  subtitle,
  children,
}: {
  icon?: ReactNode
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 20px',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ marginBottom: 14, opacity: 0.85 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
      {subtitle && (
        <p style={{ margin: '6px 0 0 0', fontSize: 13, maxWidth: 340, lineHeight: 1.5 }}>{subtitle}</p>
      )}
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  )
}
