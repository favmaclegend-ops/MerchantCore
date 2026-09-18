import { useEffect, useState } from "react";
import { Inbox, Loader2, Mail, MailOpen, Store, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  getOrCreateKeypair,
  unwrapThreadKey,
  decryptPayload,
} from "@/pages/market/chat/chatCrypto";
import { registerChatKey } from "@/pages/market/chat/chatApi";

interface InboxMessage {
  id: string;
  org_id: string;
  org_name: string | null;
  service_request_id: string | null;
  service_name: string | null;
  subject: string | null;
  wrapped_key: string;
  ciphertext: string;
  iv: string;
  status: string;
  sent_at: string | null;
}

export function InboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState<string | null>(null);
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let active = true;
    api.market
      .getInbox()
      .then((res) => {
        if (active) setMessages((res.messages ?? []) as unknown as InboxMessage[]);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const removeMessage = async (msg: InboxMessage) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.market.deleteInboxMessage(msg.id);
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      setBodies((prev) => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });
    } catch {
      // ignore — keep the message
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api.market.clearInbox();
      setMessages([]);
      setBodies({});
      setConfirmClear(false);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  const openMessage = async (msg: InboxMessage) => {
    if (bodies[msg.id]) {
      if (msg.status === "unread") {
        try {
          await api.market.markInboxRead(msg.id);
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m)),
          );
        } catch {
          // ignore
        }
      }
      return;
    }
    setDecrypting(msg.id);
    try {
      const { privateKeyPem, publicKeyPem } = await getOrCreateKeypair();
      try {
        await registerChatKey(publicKeyPem);
      } catch {
        // best-effort — keep the stored keypair but continue
      }
      const threadKey = await unwrapThreadKey(privateKeyPem, msg.wrapped_key);
      const body = await decryptPayload(threadKey, msg.ciphertext, msg.iv);
      setBodies((prev) => ({ ...prev, [msg.id]: body }));
      if (msg.status === "unread") {
        try {
          await api.market.markInboxRead(msg.id);
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m)),
          );
        } catch {
          // ignore
        }
      }
    } catch {
      setBodies((prev) => ({ ...prev, [msg.id]: "(Unable to decrypt this message)" }));
    } finally {
      setDecrypting(null);
    }
  };

  const unread = messages.filter((m) => m.status === "unread").length;

  return (
    <div style={{ padding: "1rem", maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: ".5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-primary)" }}>Inbox</h2>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
          {unread > 0 && (
            <span
              style={{
                padding: ".15rem .6rem",
                borderRadius: "2rem",
                fontSize: ".75rem",
                fontWeight: 700,
                background: "var(--bg-nav-active)",
                color: "#fff",
              }}
            >
              {unread} unread
            </span>
          )}
          {messages.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={busy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".35rem",
                padding: ".35rem .7rem",
                borderRadius: "2rem",
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                color: "var(--text-danger, #dc2626)",
                fontSize: ".78rem",
                fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Trash2 size={13} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-placeholder)" }}>
          Loading inbox...
        </div>
      ) : messages.length === 0 ? (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "var(--text-placeholder)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: ".5rem",
          }}
        >
          <Inbox size={32} />
          <span>No messages yet</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {messages.map((msg) => {
            const open = Boolean(bodies[msg.id]);
            const body = bodies[msg.id];
            return (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: ".75rem",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: ".75rem",
                    padding: ".75rem 1rem",
                    borderBottom: open ? "1px solid var(--border-default)" : "none",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", minWidth: 0 }}>
                    {msg.status === "unread" ? (
                      <Mail size={16} style={{ flexShrink: 0 }} color="var(--bg-nav-active)" />
                    ) : (
                      <MailOpen size={16} style={{ flexShrink: 0 }} color="var(--text-placeholder)" />
                    )}
                    <span style={{ fontWeight: msg.status === "unread" ? 700 : 600, fontSize: ".9rem", color: "var(--text-primary)" }}>
                      {msg.service_name ?? "Service"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                    <span style={{ fontSize: ".75rem", color: "var(--text-placeholder)", whiteSpace: "nowrap" }}>
                      {msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ""}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMessage(msg);
                      }}
                      disabled={busy}
                      aria-label="Delete message"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: ".3rem",
                        borderRadius: "50%",
                        border: "none",
                        background: "transparent",
                        color: "var(--text-placeholder)",
                        cursor: busy ? "not-allowed" : "pointer",
                        opacity: busy ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {open && (
                  <div style={{ padding: ".85rem 1rem", display: "flex", flexDirection: "column", gap: ".5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".35rem", fontSize: ".82rem", color: "var(--text-secondary)" }}>
                      <Store size={13} />
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {msg.org_name ?? "Shop"}
                      </span>
                      {msg.subject && <span>— {msg.subject}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: ".85rem", color: "var(--text-primary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {decrypting === msg.id ? "Decrypting..." : body ?? "\u00a0"}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {decrypting && (
        <div
          style={{
            position: "fixed",
            bottom: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: ".4rem",
            padding: ".5rem .9rem",
            borderRadius: "2rem",
            background: "var(--bg-nav-active)",
            color: "#fff",
            fontSize: ".8rem",
            boxShadow: "0 4px 12px rgba(0,0,0,.15)",
          }}
        >
          <Loader2 size={14} className="spin" />
          Decrypting message...
        </div>
      )}

      {confirmClear && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={() => setConfirmClear(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              borderRadius: "1rem",
              padding: "1.25rem",
              width: "100%",
              maxWidth: 360,
              display: "flex",
              flexDirection: "column",
              gap: ".75rem",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--text-primary)" }}>
              Clear all messages?
            </span>
            <span style={{ fontSize: ".82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              This permanently removes {messages.length} message
              {messages.length === 1 ? "" : "s"} from your inbox. This cannot be undone.
            </span>
            <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  padding: ".4rem .9rem",
                  borderRadius: ".5rem",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface)",
                  fontSize: ".8rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={clearAll}
                disabled={busy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".3rem",
                  padding: ".4rem .9rem",
                  borderRadius: ".5rem",
                  border: "none",
                  background: "var(--text-danger, #dc2626)",
                  color: "#fff",
                  fontSize: ".8rem",
                  fontWeight: 600,
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                {busy ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
