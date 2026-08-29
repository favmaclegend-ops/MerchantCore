import { useNavigate, useParams } from 'react-router-dom'
import { MessageCircle, Store } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { ChatListPage } from './ChatListPage'
import { ChatThreadPage } from './ChatThreadPage'

const base = () => (window.location.pathname.startsWith('/market') ? '/market' : '/home/market')

/**
 * Chat entry point shared by `/chat` and `/chat/:threadId`.
 *
 * On wide screens it renders a classic two-column layout: the list of stores
 * with open conversations on the left, and the selected conversation panel on
 * the right. On narrow screens it keeps the single-page behaviour (list page,
 * then full-screen thread page once a conversation is opened).
 */
export function ChatRoute() {
  const { threadId } = useParams()
  const bp = useBreakpoint()
  const navigate = useNavigate()

  if (!bp.lg) {
    return threadId ? <ChatThreadPage /> : <ChatListPage />
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 360px) 1fr',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-page)',
      }}
    >
      <div style={{ minWidth: 0, overflow: 'hidden', borderRight: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
        <ChatListPage />
      </div>
      <div style={{ minWidth: 0, overflow: 'hidden' }}>{threadId ? <ChatThreadPage /> : <EmptyPane />}</div>
    </div>
  )

  function EmptyPane() {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: 'var(--text-muted)',
          background: 'var(--bg-page)',
        }}
      >
        <MessageCircle size={44} strokeWidth={1.5} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>Select a conversation</div>
        <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
          Choose a store from the list on the left to open (or start) your secure chat.
        </div>
        <button
          onClick={() => navigate(`${base()}`)}
          style={{
            marginTop: 6,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 999,
            background: 'var(--bg-nav-active)',
            color: 'var(--bg-surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13.5,
          }}
        >
          <Store size={17} />
          Browse the market
        </button>
      </div>
    )
  }
}
