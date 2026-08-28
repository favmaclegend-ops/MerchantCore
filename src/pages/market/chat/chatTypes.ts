/**
 * Market Chat — shared wire shapes returned by the chat API.
 */

/** A thread as returned by the backend (``app/services/chat._thread_api``). */
export interface ChatApiThread {
  id: string
  buyer_key: string
  buyer_name: string
  owner_key: string
  shop_id: string
  shop_name: string
  shop_image: string | null
  thread_key_wrapped_buyer: string | null
  thread_key_wrapped_owner: string | null
  last_message_at: string | null
  unread_buyer: number
  unread_owner: number
  created_at: string | null
}
