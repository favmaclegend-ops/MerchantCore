/**
 * Market Chat — reusable, localStorage-backed chat store.
 *
 * The chat lives entirely in the browser for now (UI-first). Every message and
 * thread is persisted under a single key and pruned on load so that any message
 * older than `MESSAGE_TTL_DAYS` (4 days) is stripped.
 *
 * Reusable methods:
 *   getThreads()          -> all threads as an array (newest first, after pruning)
 *   getThread(shopId)     -> a single thread or null
 *   startThread(shop)     -> create/lookup the thread for a shop
 *   sendMessage(shopId, text, from) -> append a message to a thread
 *   markThreadRead(shopId)           -> clear unread for a shop
 *   deleteThread(shopId)             -> remove a thread + its messages
 *   getUnreadCount()                 -> number of threads with unread messages
 *   pruneExpired()                   -> strip messages older than the TTL
 */

import { useEffect, useState } from 'react'

export const MESSAGE_TTL_DAYS = 4
export const MESSAGE_TTL_MS = MESSAGE_TTL_DAYS * 24 * 60 * 60 * 1000

const STORAGE_KEY = 'market_chat_v1'

export type ChatSender = 'me' | 'shop'

export interface ChatMessage {
  id: string
  text: string
  from: ChatSender
  sentAt: string // ISO timestamp
}

export interface ChatThread {
  shopId: string
  shopName: string
  shopImage?: string
  messages: ChatMessage[]
  unread: number
  updatedAt: string
}

interface ChatStoreData {
  threads: Record<string, ChatThread>
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function readStore(): ChatStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { threads: {} }
    const parsed = JSON.parse(raw) as ChatStoreData
    return { threads: parsed.threads ?? {} }
  } catch {
    return { threads: {} }
  }
}

function writeStore(data: ChatStoreData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // storage may be unavailable (private mode / quota) — fail silently
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// ---------------------------------------------------------------------------
// TTL pruning
// ---------------------------------------------------------------------------

/** Strip any message older than the 4-day TTL. Threads left empty are removed. */
export function pruneExpired(): void {
  const data = readStore()
  const cutoff = Date.now() - MESSAGE_TTL_MS
  let changed = false
  for (const id of Object.keys(data.threads)) {
    const thread = data.threads[id]
    const fresh = (thread.messages ?? []).filter((m) => new Date(m.sentAt).getTime() > cutoff)
    if (fresh.length !== (thread.messages ?? []).length) changed = true
    if (fresh.length === 0) {
      delete data.threads[id]
      changed = true
    } else {
      thread.messages = fresh
      thread.updatedAt = fresh[fresh.length - 1].sentAt
    }
  }
  if (changed || Object.keys(data.threads).length > 0) writeStore(data)
}

// ---------------------------------------------------------------------------
// Public reusable API
// ---------------------------------------------------------------------------

export interface ThreadInput {
  shopId: string
  shopName: string
  shopImage?: string
}

/** All threads, newest activity first (after pruning stale messages). */
export function getThreads(): ChatThread[] {
  pruneExpired()
  const data = readStore()
  return Object.values(data.threads)
    .map(normalizeThread)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

/** A single thread or null. */
export function getThread(shopId: string): ChatThread | null {
  const thread = readStore().threads[shopId]
  return thread ? normalizeThread(thread) : null
}

/**
 * Create (or return) the thread for a shop. Persisting a thread is what makes
 * the shop appear on the default chat list page.
 */
export function startThread(shop: ThreadInput): ChatThread {
  const data = readStore()
  const existing = data.threads[shop.shopId]
  const now = nowIso()
  const created: ChatThread = existing ?? {
    shopId: shop.shopId,
    shopName: shop.shopName,
    shopImage: shop.shopImage,
    messages: [],
    unread: 0,
    updatedAt: now,
  }
  if (!existing) {
    created.shopName = shop.shopName
    created.shopImage = shop.shopImage
    data.threads[shop.shopId] = created
    writeStore(data)
  }
  return normalizeThread(existing ?? created)
}

/** Append a message to a shop's thread (creating it when needed). */
export function sendMessage(shopId: string, text: string): ChatThread {
  const trimmed = text.trim()
  const data = readStore()
  const existing = data.threads[shopId]
  const now = nowIso()
  const message: ChatMessage = { id: newId('msg'), text: trimmed, from: 'me', sentAt: now }
  if (!existing) {
    // Fallback: no thread yet — create one with a generic name.
    data.threads[shopId] = {
      shopId,
      shopName: shopId,
      messages: [message],
      unread: 1,
      updatedAt: now,
    }
  } else {
    existing.messages.push(message)
    existing.updatedAt = now
    existing.unread = (existing.unread ?? 0) + 1
  }
  writeStore(data)
  return normalizeThread(data.threads[shopId])
}

/** Mark a shop's thread as read. Returns the current unread count for the feed. */
export function markThreadRead(shopId: string): void {
  const data = readStore()
  const thread = data.threads[shopId]
  if (!thread) return
  thread.unread = 0
  writeStore(data)
}

export function deleteThread(shopId: string): void {
  const data = readStore()
  if (data.threads[shopId]) {
    delete data.threads[shopId]
    writeStore(data)
  }
}

export function getUnreadCount(): number {
  const data = readStore()
  return Object.values(data.threads).reduce((sum, t) => sum + (t.unread ?? 0), 0)
}

function normalizeThread(thread: ChatThread): ChatThread {
  return {
    ...thread,
    messages: (thread.messages ?? []).filter((m) => m && m.text != null),
    unread: thread.unread ?? 0,
  }
}

// ---------------------------------------------------------------------------
// React bindings (reusable hook)
// ---------------------------------------------------------------------------

/** Subscribe to the chat store in React components. Re-renders on any write. */
export function useChatStore(): { threads: ChatThread[]; unread: number } {
  const [, force] = useState(0)
  useEffect(() => {
    const sync = () => force((n) => n + 1)
    window.addEventListener('market-chat', sync)
    return () => window.removeEventListener('market-chat', sync)
  }, [])
  return { threads: getThreads(), unread: getUnreadCount() }
}

/** Notify React subscribers that the store changed. */
export function notifyChatChanged(): void {
  pruneExpired()
  window.dispatchEvent(new Event('market-chat'))
}

// ---------------------------------------------------------------------------
// Seeding (demo content for review)
// ---------------------------------------------------------------------------

/** Seed a thread with historic messages (used by the demo). Idempotent per shop. */
export function seedThread(shop: ThreadInput, messages: ChatMessage[], unread = 0): void {
  pruneExpired()
  const data = readStore()
  const existing = data.threads[shop.shopId]
  if (existing && existing.messages.length > 0) return
  const latest = messages.reduce((acc, m) => (m.sentAt > acc ? m.sentAt : acc), messages[0]?.sentAt ?? nowIso())
  data.threads[shop.shopId] = {
    shopId: shop.shopId,
    shopName: shop.shopName,
    shopImage: shop.shopImage,
    messages,
    unread,
    updatedAt: latest,
  }
  writeStore(data)
}
