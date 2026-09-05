import { useCallback, useEffect, useState } from "react";
import { Phone, MessageSquare, CheckCircle, XCircle, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useConfirm } from "@/components/confirm/confirm";

interface ServiceRequest {
  id: string;
  service_id: string;
  shop_id: string;
  org_id: string;
  service_name: string | null;
  shop_name: string | null;
  requester_name: string;
  requester_phone: string;
  requester_email: string | null;
  requester_address: string | null;
  note: string | null;
  status: string;
  response: string | null;
  responded_at: string | null;
  created_at: string | null;
}

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "new", label: "New" },
  { key: "responded", label: "Responded" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

const statusColors: Record<string, { bg: string; fg: string }> = {
  new: { bg: "var(--color-info-bg, #e8f4fd)", fg: "var(--color-info-fg, #0369a1)" },
  responded: { bg: "var(--color-warning-bg, #fef3c7)", fg: "var(--color-warning-fg, #92400e)" },
  completed: { bg: "var(--color-success-bg, #dcfce7)", fg: "var(--color-success-fg, #166534)" },
  cancelled: { bg: "var(--color-muted-bg, #f3f4f6)", fg: "var(--color-muted-fg, #6b7280)" },
};

export function ServiceRequestsPage() {
  const { confirm } = useConfirm();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    api.market
      .getOrgServiceRequests(activeTab || undefined)
      .then((res) => {
        if (active) setRequests((res.requests ?? []) as unknown as ServiceRequest[]);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, refreshKey]);

  const respond = async (requestId: string) => {
    if (!responseText.trim()) return;
    setBusy(true);
    try {
      await api.market.respondToServiceRequest(requestId, {
        response: responseText.trim(),
        status: "responded",
      });
      setResponding(null);
      setResponseText("");
      refresh();
    } catch {
      // keep state
    } finally {
      setBusy(false);
    }
  };

  const markComplete = async (requestId: string) => {
    setBusy(true);
    try {
      await api.market.respondToServiceRequest(requestId, {
        response: "Marked as completed",
        status: "completed",
      });
      refresh();
    } catch {
      // keep state
    } finally {
      setBusy(false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    setBusy(true);
    try {
      await api.market.respondToServiceRequest(requestId, {
        response: "Request cancelled",
        status: "cancelled",
      });
      refresh();
    } catch {
      // keep state
    } finally {
      setBusy(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (busy) return;
    const ok = await confirm({ title: "Delete this completed service request?" });
    if (!ok) return;
    setBusy(true);
    try {
      await api.market.deleteServiceRequest(requestId);
      refresh();
    } catch {
      // keep state
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: 900, margin: "0 auto" }}>
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: ".5rem",
          marginBottom: "1rem",
          overflowX: "auto",
          paddingBottom: ".25rem",
        }}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); refresh(); }}
            style={{
              padding: ".4rem .85rem",
              borderRadius: "2rem",
              border: "1px solid",
              borderColor: activeTab === tab.key ? "var(--bg-nav-active)" : "var(--border-default)",
              background: activeTab === tab.key ? "var(--bg-nav-active)" : "var(--bg-surface)",
              color: activeTab === tab.key ? "#fff" : "var(--text-primary)",
              fontSize: ".8rem",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-placeholder)" }}>
          Loading service requests...
        </div>
      ) : requests.length === 0 ? (
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
          <MessageSquare size={32} />
          <span>No service requests{activeTab ? ` with status "${activeTab}"` : ""}</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
          {requests.map((req) => {
            const sc = statusColors[req.status] ?? statusColors.new;
            const isResponding = responding === req.id;
            return (
              <div
                key={req.id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: ".75rem",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: ".75rem 1rem",
                    borderBottom: "1px solid var(--border-default)",
                    gap: ".75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--text-primary)" }}>
                      {req.service_name ?? "Service"}
                    </span>
                    <span
                      style={{
                        padding: ".15rem .55rem",
                        borderRadius: "2rem",
                        fontSize: ".72rem",
                        fontWeight: 600,
                        background: sc.bg,
                        color: sc.fg,
                      }}
                    >
                      {req.status}
                    </span>
                  </div>
                  <span style={{ fontSize: ".75rem", color: "var(--text-placeholder)" }}>
                    {req.created_at ? new Date(req.created_at).toLocaleString() : ""}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: ".85rem 1rem", display: "flex", flexDirection: "column", gap: ".5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".85rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {req.requester_name}
                    </span>
                    <a
                      href={`tel:${req.requester_phone}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: ".25rem",
                        fontSize: ".8rem",
                        color: "var(--text-info, #0369a1)",
                        textDecoration: "none",
                      }}
                    >
                      <Phone size={13} />
                      {req.requester_phone}
                    </a>
                  </div>
                  {(req.requester_email || req.requester_address) && (
                    <div style={{ fontSize: ".8rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: ".15rem" }}>
                      {req.requester_email && <span>Email: {req.requester_email}</span>}
                      {req.requester_address && <span>Address: {req.requester_address}</span>}
                    </div>
                  )}
                  {req.note && (
                    <p style={{ margin: 0, fontSize: ".82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {req.note}
                    </p>
                  )}

                  {/* Org response (if any) */}
                  {req.response && (
                    <div
                      style={{
                        marginTop: ".25rem",
                        padding: ".5rem .75rem",
                        borderRadius: ".5rem",
                        background: "var(--bg-tertiary, #f0fdf4)",
                        fontSize: ".82rem",
                        color: "var(--text-primary)",
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>Response: </span>
                      {req.response}
                      {req.responded_at && (
                        <span style={{ fontSize: ".72rem", color: "var(--text-placeholder)", marginLeft: ".5rem" }}>
                          {new Date(req.responded_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {req.status !== "completed" && req.status !== "cancelled" && (
                  <div
                    style={{
                      display: "flex",
                      gap: ".5rem",
                      padding: ".6rem 1rem",
                      borderTop: "1px solid var(--border-default)",
                      flexWrap: "wrap",
                    }}
                  >
                    {!isResponding ? (
                      <>
                        <button
                          onClick={() => {
                            setResponding(req.id);
                            setResponseText("");
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: ".3rem",
                            padding: ".35rem .75rem",
                            borderRadius: ".5rem",
                            border: "1px solid var(--border-default)",
                            background: "var(--bg-nav-active)",
                            color: "#fff",
                            fontSize: ".78rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <MessageSquare size={13} />
                          Respond
                        </button>
                        <button
                          onClick={() => markComplete(req.id)}
                          disabled={busy}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: ".3rem",
                            padding: ".35rem .75rem",
                            borderRadius: ".5rem",
                            border: "1px solid var(--border-default)",
                            background: "var(--bg-surface)",
                            fontSize: ".78rem",
                            fontWeight: 600,
                            cursor: busy ? "not-allowed" : "pointer",
                            opacity: busy ? 0.5 : 1,
                          }}
                        >
                          <CheckCircle size={13} />
                          Complete
                        </button>
                        <button
                          onClick={() => cancelRequest(req.id)}
                          disabled={busy}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: ".3rem",
                            padding: ".35rem .75rem",
                            borderRadius: ".5rem",
                            border: "1px solid var(--border-default)",
                            background: "var(--bg-surface)",
                            fontSize: ".78rem",
                            fontWeight: 600,
                            cursor: busy ? "not-allowed" : "pointer",
                            opacity: busy ? 0.5 : 1,
                            color: "var(--text-danger, #dc2626)",
                          }}
                        >
                          <XCircle size={13} />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <div style={{ display: "flex", gap: ".5rem", width: "100%" }}>
                        <input
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Type your response..."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && responseText.trim()) respond(req.id);
                          }}
                          style={{
                            flex: 1,
                            padding: ".4rem .65rem",
                            borderRadius: ".5rem",
                            border: "1px solid var(--border-input, var(--border-default))",
                            fontSize: ".82rem",
                            outline: "none",
                            background: "var(--bg-surface)",
                            color: "var(--text-primary)",
                          }}
                        />
                        <button
                          onClick={() => respond(req.id)}
                          disabled={busy || !responseText.trim()}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: ".25rem",
                            padding: ".4rem .75rem",
                            borderRadius: ".5rem",
                            background: "var(--bg-nav-active)",
                            color: "#fff",
                            fontSize: ".78rem",
                            fontWeight: 600,
                            cursor: busy || !responseText.trim() ? "not-allowed" : "pointer",
                            opacity: busy || !responseText.trim() ? 0.5 : 1,
                          }}
                        >
                          <Send size={13} />
                          Send
                        </button>
                        <button
                          onClick={() => {
                            setResponding(null);
                            setResponseText("");
                          }}
                          style={{
                            padding: ".4rem .65rem",
                            borderRadius: ".5rem",
                            border: "1px solid var(--border-default)",
                            background: "var(--bg-surface)",
                            fontSize: ".78rem",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Completed requests: delete */}
                {req.status === "completed" && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: ".5rem",
                      padding: ".6rem 1rem",
                      borderTop: "1px solid var(--border-default)",
                    }}
                  >
                    <button
                      onClick={() => deleteRequest(req.id)}
                      disabled={busy}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: ".3rem",
                        padding: ".35rem .75rem",
                        borderRadius: ".5rem",
                        border: "1px solid var(--border-default)",
                        background: "var(--bg-surface)",
                        fontSize: ".78rem",
                        fontWeight: 600,
                        cursor: busy ? "not-allowed" : "pointer",
                        opacity: busy ? 0.5 : 1,
                        color: "var(--text-danger, #dc2626)",
                      }}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
