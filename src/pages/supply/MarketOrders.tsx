import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/api";
import { adaptOrder, type MarketOrder } from "@/pages/market/marketApi";
import { valueFormater } from "@/pages/market/market";

interface Props {
  notify: (msg: string) => void;
}

const statusLabel: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function MarketOrders({ notify }: Props) {
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qr, setQr] = useState<Record<string, { open: boolean; token: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api.market
      .getOrgMarketOrders()
      .then((res) => setOrders((res.orders ?? []).map(adaptOrder)))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load market orders"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleQr = async (orderId: string) => {
    const existing = qr[orderId];
    if (existing?.open) {
      setQr((prev) => ({ ...prev, [orderId]: { open: false, token: existing.token } }));
      return;
    }
    try {
      const res = await api.market.getOrderQrToken(orderId);
      setQr((prev) => ({ ...prev, [orderId]: { open: true, token: res.token } }));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not load QR code");
    }
  };

  const complete = async (orderId: string, token: string) => {
    setBusy(orderId);
    try {
      await api.market.scanCompleteOrder(token);
      notify("Order completed — revenue recorded");
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not complete order");
    } finally {
      setBusy(null);
    }
  };

  const cancel = async (orderId: string) => {
    setBusy(orderId);
    try {
      await api.market.cancelMarketOrder(orderId);
      notify("Order cancelled");
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not cancel order");
    } finally {
      setBusy(null);
    }
  };

  const pending = orders.filter((o) => o.status === "pending");

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          Market Orders
        </h3>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {pending.length} pending · {orders.length} total
        </span>
      </div>

      {error && (
        <p style={{ fontSize: "12px", color: "var(--text-danger)", background: "var(--bg-danger)", border: "1px solid var(--border-danger)", padding: "10px 12px", borderRadius: "8px", margin: 0 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ fontSize: "12px", color: "var(--text-placeholder)", padding: "24px 0", margin: 0 }}>
          Loading market orders...
        </p>
      ) : orders.length === 0 ? (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", padding: "24px 0", margin: 0, textAlign: "center" }}>
          No market orders yet. Orders appear here when a customer checks out from your shop.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {orders.map((order) => {
            const q = qr[order.id];
            return (
              <div key={order.id} style={{ border: "1px solid var(--border-default)", borderRadius: "12px", background: "var(--bg-surface)", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <div>
                    <strong style={{ fontSize: "13px", color: "var(--text-primary)", display: "block" }}>
                      Order {order.id.slice(0, 8)}
                    </strong>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>
                      {order.created_at ? new Date(order.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-secondary)", padding: "4px 10px", borderRadius: "999px" }}>
                    {statusLabel[order.status] ?? order.status}
                  </span>
                </div>

                <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    <div>{order.buyer_name || order.buyer_email}</div>
                    <div style={{ color: "var(--text-muted)" }}>{order.items.length} item(s) · {order.payment_method ?? "Cash"}</div>
                  </div>
                  <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>
                    NLE{valueFormater(order.total.toString())}
                  </strong>
                </div>

                {order.items.length > 0 && (
                  <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                    {order.items.map((it, i) => (
                      <span key={i} style={{ marginRight: "10px" }}>
                        {String(it.name ?? "")} ×{String(it.quantity ?? 1)}
                      </span>
                    ))}
                  </div>
                )}

                {order.delivery_address || order.delivery_phone ? (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      Delivery
                    </span>
                    {order.delivery_name && <span>To: {order.delivery_name}</span>}
                    {order.delivery_address && <span>Address: {order.delivery_address}</span>}
                    {order.delivery_phone && <span>Phone: {order.delivery_phone}</span>}
                  </div>
                ) : null}

                {order.status === "pending" && (
                  <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => toggleQr(order.id)}
                      style={{ padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "var(--bg-surface)", background: "var(--bg-nav-active)", borderRadius: "8px", border: "none", cursor: "pointer" }}
                    >
                      {q?.open ? "Hide QR" : "Scan QR to complete"}
                    </button>
                    <button
                      onClick={() => cancel(order.id)}
                      disabled={busy === order.id}
                      style={{ padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "var(--text-danger)", background: "var(--bg-danger)", borderRadius: "8px", border: "1px solid var(--border-danger)", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {q?.open && (
                  <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <div style={{ padding: "10px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "10px" }}>
                      <QRCodeSVG value={qr_payload(q.token)} size={132} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: "200px" }}>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                        Scan to mark this order complete and record revenue.
                      </p>
                      <button
                        onClick={() => complete(order.id, q.token)}
                        disabled={busy === order.id}
                        style={{ padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "var(--bg-surface)", background: "var(--text-success)", borderRadius: "8px", border: "none", cursor: "pointer" }}
                      >
                        {busy === order.id ? "Completing..." : "Complete order"}
                      </button>
                    </div>
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

function qr_payload(token: string): string {
  const base = window.location.pathname.startsWith("/market") ? "/market" : "/home/market";
  return `${window.location.origin}${base}/orders/scan?code=${encodeURIComponent(token)}`;
}
