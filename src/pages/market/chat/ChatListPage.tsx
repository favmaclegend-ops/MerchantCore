import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MessagesSquare, Plus, Trash2 } from 'lucide-react'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  deleteThread,
  useChatStore,
  type ChatThread,
} from './chatStore'
import { EmptyState, SearchInput, ThreadListItem } from './ChatComponents'

const base = () => (window.location.pathname.startsWith('/market') ? '/market' : '/home/market')

export function ChatListPage() {
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { threads, unread } = useChatStore()
  const [query, setQuery] = useState('')

  const activeThreadId =
    searchParams.get('active') || (() => {
      const m = location.pathname.match(/\/chat\/([^/]+)/)
      return m ? decodeURIComponent(m[1]) : undefined
    })()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return threads
    return threads.filter((t) => (t.title || t.shopName).toLowerCase().includes(q))
  }, [threads, query])

  const openThread = (threadId: string) => {
    navigate(`${base()}/chat/${threadId}`)
  }

  const removeThread = (threadId: string) => {
    if (!window.confirm('Delete this conversation?')) return
    void deleteThread(threadId)
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
          paddingTop: 'calc(var(--safe-top) + 10px)',
          paddingLeft: 'calc(var(--safe-left) + 12px)',
          paddingRight: 'calc(var(--safe-right) + 12px)',
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
            fontSize: 25,
            fontWeight: 700,
            color: 'var(--text-primary)',
            flex: 1,
          }}
        >
          Negotiation
        </h2>
        {unread > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {unread} unread
          </span>
        )}

        <div style={{display: 'flex', alignItems: 'center'}}>
          <button style={{background: 'var(--bg-nav-active)', padding: '.2rem', borderRadius: '1rem'}}>
            <Plus color='var(--bg-surface)'/>
          </button>
        </div>
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
          padding: '0 0 calc(20px + var(--safe-bottom))',
          background: 'var(--bg-surface)',
        }}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare size={34} />}
            title={threads.length === 0 ? 'No Negotiation yet' : 'No chats match your search'}
            subtitle={
              threads.length === 0
                ? 'Open any shop in the market and press the Message button to start a negotiation.'
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
                key={thread.threadId}
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
                <ChatTile
                  thread={thread}
                  active={thread.threadId === activeThreadId}
                  onOpen={() => openThread(thread.threadId)}
                  onDelete={() => removeThread(thread.threadId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const SWIPE_REVEAL = 72
const DELETE_WIDTH = 76

function ChatTile({
  thread,
  active,
  onOpen,
  onDelete,
}: {
  thread: ChatThread
  active: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const startX = useRef<number | null>(null)
  const startTranslate = useRef(0)
  const swiped = useRef(false)
  const [dx, setDx] = useState(0)
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [dragging, setDragging] = useState(false)
  const bp = useBreakpoint()

  const handled = (() => {
    if (open) return -DELETE_WIDTH
    return dx
  })()

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startTranslate.current = open ? -DELETE_WIDTH : 0
    swiped.current = false
    setDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return
    const delta = e.touches[0].clientX - startX.current
    if (Math.abs(delta) > 6) swiped.current = true
    const next = Math.max(-DELETE_WIDTH - 8, Math.min(0, startTranslate.current + delta))
    setDx(next)
  }

  const handleTouchEnd = () => {
    startX.current = null
    setDragging(false)
    if (swiped.current) {
      if (-dx >= SWIPE_REVEAL) {
        setOpen(true)
        setDx(0)
      } else {
        setOpen(false)
        setDx(0)
      }
    } else {
      setOpen(false)
      setDx(0)
    }
  }

  const handleClick = () => {
    if (swiped.current) {
      swiped.current = false
      return
    }
    if (menu) {
      setMenu(false)
      return
    }
    if (open) {
      setOpen(false)
      return
    }
    onOpen()
  }

  const deleteIt = () => {
    setOpen(false)
    setMenu(false)
    onDelete()
  }

  return (
    <div
      style={{ position: 'relative', width: '100%', minWidth: 0, overflow: 'hidden' }}
      onContextMenu={(e) => {
        e.preventDefault()
        setMenu((m) => !m)
      }}
    >
      {/* Revealed delete action behind the tile (swipe-left reveal) */}
      <div
        role="button"
        aria-label="Delete conversation"
        onClick={(e) => {
          e.stopPropagation()
          deleteIt()
        }}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: DELETE_WIDTH,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e5484d',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <Trash2 size={18} />
      </div>

      {/* Sliding content */}
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          minWidth: 0,
          transform: `translateX(${handled}px)`,
          transition: dragging ? 'none' : 'transform .2s ease',
          background: 'var(--bg-surface)',
          touchAction: 'pan-y',
        }}
      >
        <ThreadListItem thread={thread} active={active} onClick={() => {}} />
      </div>

      {/* Right-click / long-press style context menu */}
      {menu && (
        <div
          role="button"
          aria-label="Close menu"
          onClick={(e) => {
            e.stopPropagation()
            setMenu(false)
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'transparent' }}
        />
      )}
      {menu && (
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: bp.sm ? '52%' : '100%',
            marginTop: 4,
            zIndex: 40,
            minWidth: 170,
            borderRadius: 10,
            overflow: 'hidden',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 8px 24px rgba(0,0,0,.18)',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteIt()
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              background: 'transparent',
              color: '#e5484d',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13.5,
              textAlign: 'left',
            }}
          >
            <Trash2 size={15} />
            Delete conversation
          </button>
        </div>
      )}
    </div>
  )
}
