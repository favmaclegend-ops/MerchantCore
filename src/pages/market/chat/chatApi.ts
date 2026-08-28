/**
 * Market Chat — HTTP API client (backend ``app/routers/chat.py``).
 *
 * Identity is resolved server-side from the auth token. The active session is
 * either a personal user (buyer, ``user:<id>``) or an org member (shop owner,
 * ``org:<org_id>``), exactly like the app's other API clients.
 */

import { getOrgSession } from "@/data/organisations";
import type { ChatApiThread } from "./chatTypes";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";

/** The current auth token: personal JWT, else the org member JWT. */
function getChatToken(): string | null {
  return localStorage.getItem("token") || getOrgSession()?.token || null;
}

function headers(): Record<string, string> {
  const token = getChatToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function chatRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Register the RSA public key for the current participant (idempotent). */
export async function registerChatKey(publicKeyPem: string): Promise<void> {
  await chatRequest("/chat/keys", {
    method: "POST",
    body: JSON.stringify({ public_key_pem: publicKeyPem }),
  });
}

/** Create (or return) the thread between the current buyer and a shop. */
export async function apiOpenThread(input: {
  shop_id: string;
  shop_name: string;
  shop_image?: string;
  owner_key: string;
}): Promise<ChatApiThread> {
  return chatRequest("/chat/threads", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** List all threads for the current participant, newest first. */
export async function apiListThreads(): Promise<ChatApiThread[]> {
  const res = await chatRequest<{ threads: ChatApiThread[] }>("/chat/threads");
  return res.threads ?? [];
}

export interface ChatApiMessage {
  id: string;
  thread_id: string;
  sender_key: string;
  ciphertext: string;
  message_type?: string;
  message_image_url?: string;
  product_id?: string;
  old_price?: string;
  new_price?: string;
  discount_link?: string;
  iv: string;
  sent_at: string | null;
}

export type DeleteMessageScope = "me" | "everyone";

export async function apiDeleteMessage(
  threadId: string,
  messageId: string,
  scope: DeleteMessageScope = "me",
): Promise<{ message: string; thread_id: string; message_id: string }> {
  const requestOptions: RequestInit = {
    method: "PATCH",
    headers: headers(),
  };

  try {
    const res = await fetch(
      `${API_BASE}/chat/threads/${threadId}/messages/${messageId}`,
      {
        ...requestOptions,
        body: JSON.stringify({ scope }),
      },
    );

    if (!res.ok) {
      const fallback = await fetch(
        `${API_BASE}/chat/threads/${threadId}/messages/${messageId}`,
        requestOptions,
      );

      if (!fallback.ok) {
        const err = await fallback.json().catch(() => ({ detail: fallback.statusText }));
        throw new Error(err.detail || "Request failed");
      }

      return fallback.json();
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    const fallbackError = new Error("Request failed");
    Object.assign(fallbackError, { cause: error });
    throw fallbackError;
  }
}

/** Delete a thread. */
export async function apiDeleteThread(threadId: string): Promise<void> {
  await chatRequest(`/chat/threads/${threadId}`, { method: "DELETE" });
}

/** List messages for a thread (each still encrypted at this point). */
export async function apiListMessages(
  threadId: string,
): Promise<{ thread: ChatApiThread; messages: ChatApiMessage[] }> {
  return chatRequest(`/chat/threads/${threadId}/messages`);
}

/** Send an encrypted message. `threadKey` is the base64 AES key. */
export async function apiSendMessage(
  threadId: string,
  plaintext: string,
  threadKey: string,
  message_type: "normal" | "discount",
  message_img_url: string,
  product_id: string,
  old_price: string,
  new_price: string,
  discount_link: string,
): Promise<ChatApiMessage> {
  const res = await chatRequest<{ message: ChatApiMessage }>(
    `/chat/threads/${threadId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        text: plaintext,
        thread_key: threadKey,
        "message-type": message_type ?? "normal",
        "message-img-url": message_img_url ?? "",
        "product-id": product_id ?? "",
        "old-price": old_price ?? "",
        "new-price": new_price ?? "",
        "discount-link": discount_link ?? "",
      }),
    },
  );
  return res.message;
}

/** Mark a thread read for the current participant. */
export async function apiMarkRead(threadId: string): Promise<void> {
  await chatRequest(`/chat/threads/${threadId}/read`, { method: "POST" });
}
