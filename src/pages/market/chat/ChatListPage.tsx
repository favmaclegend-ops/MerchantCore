import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MessagesSquare, Trash2 } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  deleteThread,
  notifyChatChanged,
  useChatStore,
  type ChatThread,
} from './chatStore'
import { EmptyState, SearchInput, ThreadListItem } from './ChatComponents'
import { seedDemoChats } from './demoChat'

const base = () => (window.location.pathname.startsWith('/market') ? '/market' : '/home/market')

export function ChatListPage() {
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const [searchParams] = useSearchParams()
  const { threads, unread } = useChatStore()
  const [query, setQuery] = useState('')

  // Seed demo conversations once so the UI can be reviewed.
  useEffect(() => {
    seedDemoChats()
  }, [])

  const activeShopId = searchParams.get('active') || undefined

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return threads
    return threads.filter((t) => t.shopName.toLowerCase().includes(q))
  }, [threads, query])

  const openThread = (shopId: string) => {
    navigate(`${base()}/chat/${shopId}`)
  }

  const removeThread = (e: React.MouseEvent, shopId: string) => {
    e.stopPropagation()
    if (!window.confirm('Delete this conversation?')) return
    deleteThread(shopId)
    notifyChatChanged()
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-page)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <a
          href={base()}
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={22} />
        </a>
        <h2
          style={{
            margin: 0,
            fontSize: 19,
            fontWeight: 700,
            color: 'var(--text-primary)',
            flex: 1,
          }}
        >
          Chats
        </h2>
        {unread > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {unread} unread
          </span>
        )}
      </div>

      {/* Search */}
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Search chats…" />
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0 0 20px',
          background: 'var(--bg-surface)',
        }}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare size={34} />}
            title={threads.length === 0 ? 'No conversations yet' : 'No chats match your search'}
            subtitle={
              threads.length === 0
                ? 'Open any shop in the market and press the Message button to start a chat.'
                : 'Try a different name or clear the search.'
            }
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              minWidth: 0,
              maxWidth: bp.lg ? 720 : '100%',
              margin: '0 auto',
            }}
          >
            {filtered.map((thread: ChatThread, i) => (
              <div
                key={thread.shopId}
                style={{
                  position: 'relative',
                  width: '100%',
                  minWidth: 0,
                  overflow: 'hidden',
                  borderBottom:
                    i < filtered.length - 1
                      ? '1px solid var(--border-default)'
                      : 'none',
                }}
              >
                <ThreadListItem
                  thread={thread}
                  active={thread.shopId === activeShopId}
                  onClick={() => openThread(thread.shopId)}
                />
                <button
                  title="Delete conversation"
                  onClick={(e) => removeThread(e, thread.shopId)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 12,
                    transform: 'translateY(-50%)',
                    width: 34,
                    height: 34,
                    border: 'none',
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: bp.sm ? 0 : 1,
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
