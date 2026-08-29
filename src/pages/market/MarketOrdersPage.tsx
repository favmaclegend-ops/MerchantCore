import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useStore } from "elk-components";
import { ArrowLeft, CheckCircle2, XCircle, Clock, RefreshCw, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { fetchMyOrders, marketOrdersStore, type MarketOrder } from "./marketApi";
import { valueFormater } from "./market";
import { useBreakpoint } from "@/hooks/useBreakpoint";

const base = () =>
  window.location.pathname.startsWith("/market") ? "/market" : "/home/market";

export function MarketOrdersPage() {
  const { orders } = useStore(marketOrdersStore);
  const [localOrders, setLocalOrders] = useState<MarketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrTokens, setQrTokens] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const bp = useBreakpoint();
  const allOrders = useMemo(
    () =>
      orders.length > 0 ? orders : localOrders,
    [orders, localOrders],
  );

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOrders;
    return allOrders.filter((o) => {
      const haystack = [
        o.id,
        o.buyer_name,
        o.buyer_email,
        o.delivery_name,
        o.delivery_address,
        ...(o.items ?? []).map((it) => String(it.name ?? "")),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [allOrders, query]);

  const load = async () => {
    try {
      const data = await fetchMyOrders();
      setLocalOrders(data);
      marketOrdersStore.setState({ orders: data });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchMyOrders()
      .then((data) => {
        if (!mounted) return;
        setLocalOrders(data);
        marketOrdersStore.setState({ orders: data });
        setError("");
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load orders");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    // Realtime orders: poll status changes (completed/cancelled) so the client
    // sees the org's completion without a manual refresh.
    const poll = window.setInterval(() => {
      if (!mounted) return;
      fetchMyOrders()
        .then((data) => {
          if (!mounted) return;
          setLocalOrders(data);
          marketOrdersStore.setState({ orders: data });
        })
        .catch(() => {});
    }, 5000);

    return () => {
      mounted = false;
      window.clearInterval(poll);
    };
  }, []);

  const removeOrder = async (orderId: string) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await api.market.deleteMyOrder(orderId);
      const next = allOrders.filter((o) => o.id !== orderId);
      setLocalOrders(next);
      marketOrdersStore.setState({ orders: next });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete order");
    }
  };

  const revealQr = async (orderId: string) => {
    setExpanded((prev) => (prev === orderId ? null : orderId));
    if (qrTokens[orderId]) return;
    try {
      const res = await api.market.getMyOrderQrToken(orderId);
      setQrTokens((prev) => ({ ...prev, [orderId]: res.token }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load QR code");
    }
  };

  const statusMeta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: {
      label: "Pending",
      color: "var(--text-warning)",
      bg: "var(--bg-warning)",
      icon: <Clock style={{ width: 13, height: 13 }} />,
    },
    completed: {
      label: "Completed",
      color: "var(--text-success)",
      bg: "var(--bg-success)",
      icon: <CheckCircle2 style={{ width: 13, height: 13 }} />,
    },
    cancelled: {
      label: "Cancelled",
      color: "var(--text-danger)",
      bg: "var(--bg-danger)",
      icon: <XCircle style={{ width: 13, height: 13 }} />,
    },
  };
  return (
    <div style={{ padding: "1.5rem", maxWidth: "860px", margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {
            !bp.sm &&
            <a
            href={base()}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", textDecoration: "none" }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} /> Back to market
          </a>}
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            My Orders
          </h2>
        </div>
        <button
          onClick={load}
          style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px",
            fontSize: "12px", fontWeight: 600, color: "var(--bg-surface)",
            background: "var(--bg-nav-active)", borderRadius: "8px", border: "none", cursor: "pointer",
          }}
        >
          <RefreshCw style={{ width: 13, height: 13 }} /> Refresh
        </button>
      </div>

      {error && (
        <p style={{ fontSize: "12px", color: "var(--text-danger)", background: "var(--bg-danger)", border: "1px solid var(--border-danger)", padding: "10px 12px", borderRadius: "8px", margin: "0 0 16px 0" }}>
          {error}
        </p>
      )}

      {!loading && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order id, name, item or address…"
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: "16px",
            color: "var(--text-primary)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            outline: "none",
            marginBottom: "16px",
          }}
        />
      )}

      {loading ? (
        <p style={{ fontSize: "13px", color: "var(--text-placeholder)", padding: "40px 0", textAlign: "center", margin: 0 }}>
          Loading orders…
        </p>
      ) : filteredOrders.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", borderRadius: "12px", border: "1px dashed var(--border-default)" }}>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {allOrders.length === 0
              ? "No orders yet. Add items to your cart and check out to place an order."
              : "No orders match your search."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredOrders.map((order) => {
            const meta = statusMeta[order.status] ?? statusMeta.pending;
            return (
              <div
                key={order.id}
                style={{ border: "1px solid var(--border-default)", borderRadius: "12px", background: "var(--bg-surface)", padding: "14px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <div>
                    <strong style={{ fontSize: "12px", color: "var(--text-primary)", display: "block" }}>
                      Order {order.id.slice(0, 8)}
                    </strong>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>
                      {order.created_at ? new Date(order.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: meta.color, background: meta.bg, padding: "4px 10px", borderRadius: "999px" }}>
                    {meta.icon} {meta.label}
                  </span>
                  <button
                    onClick={() => removeOrder(order.id)}
                    title="Delete order"
                    aria-label="Delete order"
                    style={{ padding: "6px", borderRadius: "8px", border: "1px solid var(--border-danger)", background: "var(--bg-danger)", color: "var(--text-danger)", cursor: "pointer", display: "inline-flex" }}
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>

                <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0 }}>
                    {order.items.length} item(s) · {order.payment_method ?? "Cash"}
                  </p>
                  <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                    NLE{valueFormater(order.total.toString())}
                  </strong>
                </div>

                {order.items.length > 0 && (
                  <div style={{ marginTop: "8px", borderTop: "1px solid var(--border-default)", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {order.items.map((it, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                        <span style={{ color: "var(--text-primary)" }}>
                          {String(it.name ?? "")} ×{String(it.quantity ?? 1)}
                        </span>
                        <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          NLE{valueFormater((Number(it.price ?? 0) * Number(it.quantity ?? 1)).toString())}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {(order.delivery_address || order.delivery_phone) && (
                  <div
                    style={{
                      marginTop: "8px",
                      borderTop: "1px solid var(--border-default)",
                      paddingTop: "8px",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    {order.delivery_name && (
                      <span>Deliver to: {order.delivery_name}</span>
                    )}
                    {order.delivery_address && <span>Address: {order.delivery_address}</span>}
                    {order.delivery_phone && <span>Phone: {order.delivery_phone}</span>}
                  </div>
                )}

                {order.status === "pending" && (
                  <>
                    <button
                      onClick={() => revealQr(order.id)}
                      style={{ marginTop: "12px", width: "100%", padding: "8px 0", fontSize: "12px", fontWeight: 600, color: "var(--bg-surface)", background: "var(--bg-nav-active)", borderRadius: "8px", border: "none", cursor: "pointer" }}
                    >
                      {expanded === order.id ? "Hide code" : "Show QR code"}
                    </button>
                    {expanded === order.id && (
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", textAlign: "center" }}>
                        <div style={{ padding: "12px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "12px" }}>
                          {qrTokens[order.id] ? (
                            <QRCodeSVG value={order_qr_payload(qrTokens[order.id])} size={164} />
                          ) : (
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", width: 164, margin: 0 }}>
                              Generating…
                            </p>
                          )}
                        </div>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, maxWidth: "320px" }}>
                          Ask the shop to scan this code to complete the order.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function order_qr_payload(token: string): string {
  return `${window.location.origin}${base()}/orders/scan?code=${encodeURIComponent(token)}`;
}
