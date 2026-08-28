/**
 * Market Chat — E2E-encrypted, backend-driven store.
 *
 * Replaces the old localStorage demo store. Threads + messages now live in the
 * dedicated (encrypted) chat database via the chat API. Message bodies are
 * AES-256-GCM encrypted and can only be read by participants who hold the shared
 * thread key (recovered from their own RSA private key). The 4-day TTL purge runs
 * server-side on startup and during reads.
 *
 * Reusable methods:
 *   useChatStore()            -> { threads, unread, loading }
 *   startThread(shop)         -> open/create a buyer<->shop thread
 *   sendMessage(shopId, text) -> encrypt + send a message
 *   markThreadRead(shopId)    -> clear unread for a thread
 *   deleteThread(shopId)      -> delete a thread
 *   getThread(shopId)         -> a single thread (from cache)
 *   getThreads()              -> all threads (newest first)
 *   getUnreadCount()          -> total unread
 *   notifyChatChanged()       -> re-render subscribers (e.g. after a send)
 */

import { useContext, useEffect, useState } from 'react'
import { Authcontext } from '@/context/auth_context'
import { getOrgSession } from '@/data/organisations'
import {
  apiDeleteThread,
  apiListMessages,
  apiListThreads,
  apiMarkRead,
  apiOpenThread,
  apiSendMessage,
  registerChatKey,
  type ChatApiMessage,
} from './chatApi'
import {
  decryptPayload,
  getOrCreateKeypair,
  unwrapThreadKey,
} from './chatCrypto'
import type { ChatApiThread } from './chatTypes'

export type ChatSender = 'me' | 'shop'

export type ChatMessageStatus = 'sending' | 'sent' | 'delivered'

export interface ChatMessage {
  id: string
  text: string
  from: ChatSender
  senderName: string
  status: ChatMessageStatus
  sentAt: string // ISO timestamp
  type?: 'normal' | 'discount'
  discountImage?: string
  discountLink?: string
  product_id?: string
  oldPrice?: string
  newPrice?: string
}

export interface DiscountMessage {
  id: string,
  itemName: string,
  from: ChatSender,
  senderName: string,
  status: ChatMessageStatus,
  sentAt: string
  oldPrice: string,
  newPrice: string
}

export interface ChatThread {
  // Public UI shape (used by ChatComponents / pages)
  shopId: string
  shopName: string
  shopImage?: string
  title: string // display name shown in the chat list (the conversation partner)
  messages: ChatMessage[]
  unread: number
  updatedAt: string
  // Internal E2E metadata (not rendered directly)
  threadId: string
  threadKey: string // base64 AES-256 thread key
  participantKey: string
  isOwner: boolean,

}

export interface ThreadInput {
  shopId: string
  shopName: string
  shopImage?: string
  ownerKey: string
}

// ---------------------------------------------------------------------------
// Session + cache
// ---------------------------------------------------------------------------

interface Participant {
  key: string
  name: string
}

let current: Participant | null = null
let cache: Record<string, ChatThread> = {}
let loaded = false

function getThreads(): ChatThread[] {
  return Object.values(cache).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function getThread(shopId: string): ChatThread | null {
  return cache[shopId] ?? null
}

export function getUnreadCount(): number {
  return Object.values(cache).reduce((sum, t) => sum + (t.unread ?? 0), 0)
}

function notifyChatChanged(): void {
  window.dispatchEvent(new Event('market-chat'))
}

// ---------------------------------------------------------------------------
// Participant + refresh
// ---------------------------------------------------------------------------

export function setParticipant(key: string | null, name: string): void {
  const next = key ? { key, name } : null
  if (current?.key === next?.key) return
  current = next
  void refreshStore()
}

async function storeThread(api: ChatApiThread, privateKeyPem: string): Promise<ChatThread | null> {
  if (!current) return null
  const isOwner = api.owner_key === current.key
  // Prefer the wrap minted for this participant. Fall back to the other wrap so
  // a single browser that switches between a personal (buyer) and org (owner)
  // account (sharing one keypair) can still recover the thread key.
  const wraps = isOwner
    ? [api.thread_key_wrapped_owner, api.thread_key_wrapped_buyer]
    : [api.thread_key_wrapped_buyer, api.thread_key_wrapped_owner]
  let threadKey: string | null = null
  for (const wrapped of wraps) {
    if (!wrapped) continue
    try {
      threadKey = await unwrapThreadKey(privateKeyPem, wrapped)
      if (threadKey) break
    } catch {
      // try the next wrap
    }
  }
  if (!threadKey) return null
  const thread: ChatThread = {
    shopId: api.shop_id,
    shopName: api.shop_name,
    shopImage: api.shop_image || undefined,
    title: isOwner ? api.buyer_name || 'Customer' : api.shop_name,
    messages: [],
    unread: isOwner ? api.unread_owner : api.unread_buyer,
    updatedAt: api.last_message_at || api.created_at || '',
    threadId: api.id,
    threadKey,
    participantKey: current.key,
    isOwner,
  }
  cache[thread.shopId] = thread
  return thread
}

async function refreshStore(): Promise<void> {
  const session = current
  if (!session) {
    loaded = false
    return
  }
  try {
    const { privateKeyPem, publicKeyPem } = await getOrCreateKeypair()
    await registerChatKey(publicKeyPem)
    const rows = await apiListThreads()
    const next: Record<string, ChatThread> = {}
    for (const api of rows) {
      const thread = await storeThread(api, privateKeyPem)
      if (!thread) continue
      try {
        const otherUnread = thread.isOwner ? api.unread_buyer : api.unread_owner
        const { messages } = await apiListMessages(api.id)
        for (const [i, m] of messages.entries()) {
          let text = ''
          try {
            text = await decryptPayload(thread.threadKey, m.ciphertext, m.iv)
          } catch {
            text = ''
          }
          const mine = m.sender_key === session.key
          const isLastOwn = mine && (i === messages.length - 1 || messages[i + 1]?.sender_key !== session.key)
          thread.messages.push({
            id: m.id,
            text,
            from: mine ? 'me' : 'shop',
            senderName: mine
              ? session.name
              : m.sender_key === api.buyer_key
                ? api.buyer_name || 'Customer'
                : api.shop_name || 'Shop',
            status: mine && isLastOwn && otherUnread === 0 ? 'delivered' : 'sent',
            sentAt: m.sent_at || '',
            type: m.message_type === 'discount' ? 'discount' : undefined,
            discountImage: m.message_image_url || undefined,
            discountLink: m.discount_link || undefined,
            product_id: m.product_id || undefined,
            oldPrice: m.old_price || undefined,
            newPrice: m.new_price || undefined,
          })
        }
      } catch {
        // messages for this thread unavailable — keep an empty thread
      }
      next[thread.shopId] = thread
    }
    cache = next
    loaded = true
  } catch {
    // keep the previous cache on transient failure
  }
  notifyChatChanged()
}

// Shared, ref-counted poller. Multiple `useChatStore()` mounts (the list + thread
// panes mounted together on desktop, or sessions anyone registered on shop pages)
// share ONE interval instead of each running their own 4s poll. Polling is also
// paused while the tab is hidden and skips a tick if a previous refresh is still
// in flight — stopping redundant background traffic from hitting the chat API
// every few seconds. Cadence can be tuned below.
const CHAT_POLL_MS = 4000

let sharedInterval: ReturnType<typeof setInterval> | null = null
let pollRefCount = 0
let visibilityBound = false
let refreshInFlight = false

function isDocumentVisible(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden'
}

async function pollRefresh(): Promise<void> {
  if (refreshInFlight || !current || !isDocumentVisible()) return
  refreshInFlight = true
  try {
    await refreshStore()
  } finally {
    refreshInFlight = false
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState !== 'visible') return
  void pollRefresh()
  if (pollRefCount > 0 && !sharedInterval) startSharedInterval()
}

function startSharedInterval(): void {
  if (sharedInterval) return
  sharedInterval = setInterval(() => void pollRefresh(), CHAT_POLL_MS)
}

function acquirePoll(): void {
  pollRefCount += 1
  if (pollRefCount > 1) return
  if (!visibilityBound) {
    visibilityBound = true
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
  if (isDocumentVisible()) startSharedInterval()
}

function releasePoll(): void {
  pollRefCount = Math.max(0, pollRefCount - 1)
  if (pollRefCount > 0) return
  if (sharedInterval) {
    clearInterval(sharedInterval)
    sharedInterval = null
  }
  if (visibilityBound) {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    visibilityBound = false
  }
}

export function useChatStore({ poll = true }: { poll?: boolean } = {}): {
  threads: ChatThread[]
  unread: number
  loading: boolean
} {
  const { user } = useContext(Authcontext)
  const [, force] = useState(0)

  useEffect(() => {
    const org = getOrgSession()
    if (user?.id) {
      setParticipant(`user:${user.id}`, user.full_name || user.username || 'Buyer')
    } else if (org) {
      setParticipant(`org:${org.orgId}`, org.member.name || org.member.username || 'Shop')
    } else {
      setParticipant(null, '')
    }
  }, [user?.id, user?.full_name, user?.username])

  useEffect(() => {
    void refreshStore()
    const sync = () => force((n) => n + 1)
    window.addEventListener('market-chat', sync)
    if (poll) acquirePoll()
    return () => {
      window.removeEventListener('market-chat', sync)
      if (poll) releasePoll()
    }
  }, [poll])

  return { threads: getThreads(), unread: getUnreadCount(), loading: !loaded }
}

// ---------------------------------------------------------------------------
// Imperative actions
// ---------------------------------------------------------------------------

/** Open (or create) the buyer<->shop thread and cache it locally. */
export async function startThread(shop: ThreadInput): Promise<ChatThread> {
  if (!current) {
    throw new Error('Please sign in with a customer account to message this shop.')
  }
  const { privateKeyPem, publicKeyPem } = await getOrCreateKeypair()
  await registerChatKey(publicKeyPem)
  const api = await apiOpenThread({
    shop_id: shop.shopId,
    shop_name: shop.shopName,
    shop_image: shop.shopImage,
    owner_key: shop.ownerKey,
  })
  const thread = await storeThread(api, privateKeyPem)
  if (!thread) throw new Error('Could not open chat thread')
  notifyChatChanged()
  return thread
}


interface SendMessage {
  shopId: string,
  text: string,
  discountLink: string,
  discountImage: string,
  type: 'normal' | 'discount',
  oldPrice?: string,
  newPrice?: string,
  product_id?: string

}
/** Encrypt and send a message in the cached thread for a shop. */
export async function sendMessage({shopId, text, type, discountImage, product_id, discountLink, oldPrice, newPrice}: SendMessage): Promise<ChatThread> {
  const thread = getThread(shopId)
  if (!thread) throw new Error('No conversation to send to')
  const trimmed = text.trim()
  const now = new Date().toISOString()
  const optimisticId = `local-${Date.now()}`
  thread.messages.push({
    id: optimisticId,
    text: trimmed,
    from: 'me',
    senderName: current?.name || '',
    status: 'sending',
    sentAt: now,
    discountLink: discountLink ?? "",
    discountImage: discountImage ?? "",
    type: type ?? 'normal',
    oldPrice: oldPrice ?? "",
    newPrice: newPrice ?? "",
    
  })
  thread.updatedAt = now
  notifyChatChanged()
  let sent: ChatApiMessage
  try {
    sent = await apiSendMessage(thread.threadId, trimmed, thread.threadKey, type, discountImage ?? "", product_id ?? "", oldPrice ?? "", newPrice ?? "", discountLink ?? "")
    thread.messages = thread.messages.map((m) =>
      m.id === optimisticId
        ? { ...m, id: sent.id, status: 'sent', sentAt: sent.sent_at || now }
        : m,
    )
  } catch (err) {
    thread.messages = thread.messages.filter((m) => m.id !== optimisticId)
    notifyChatChanged()
    throw err
  }
  const lastIdx = thread.messages.length - 1
  if (lastIdx >= 0) thread.messages[lastIdx].status = 'sent'
  notifyChatChanged()
  return thread
}

/** Mark a thread read for the current participant. */
export async function markThreadRead(shopId: string): Promise<void> {
  const thread = getThread(shopId)
  if (!thread) return
  try {
    await apiMarkRead(thread.threadId)
  } catch {
    // non-fatal
  }
  thread.unread = 0
  notifyChatChanged()
}

/** Delete a thread (server + local cache). */
export async function deleteThread(shopId: string): Promise<void> {
  const thread = getThread(shopId)
  if (thread?.threadId) {
    try {
      await apiDeleteThread(thread.threadId)
    } catch {
      // non-fatal — still remove locally
    }
  }
  delete cache[shopId]
  notifyChatChanged()
}

export { notifyChatChanged }
