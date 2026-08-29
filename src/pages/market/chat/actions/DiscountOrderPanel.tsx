import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ShoppingBag,
  BadgePercent,
  Timer,
  CheckCircle2,
  ShieldCheck,
  CircleAlert,
} from "lucide-react";
import { generalStore, type DiscountOrderTarget } from "../../store/generalStore";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { api } from "@/lib/api";
import { adaptProduct } from "../../marketApi";
import type { MarketStoreProduct } from "../../demoMarketStore";
import { addDiscountedProductToCart } from "../../cart";
import { valueFormater } from "../../market";
import {
  isDiscountExpired,
  formatDiscountCountdown,
} from "../chatFormat";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type PanelState =
  | { status: "loading" }
  | { status: "invalid"; reason: string }
  | { status: "ready"; product: MarketStoreProduct }
  | { status: "added" }
  | { status: "error"; reason: string };

/**
 * Buyer-side order panel for a discount offer. When opened it:
 *  1. Authenticates the offer — verifies a valid discount link is present and
 *     the 24h validity window has not elapsed.
 *  2. Fetches the shop product (by shop id) that the offer refers to.
 *  3. Shows the real product + discounted price with a "Proceed to Add to Cart"
 *     action that adds the item at the discount price.
 */
export default function DiscountOrderPanel() {
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const { requireAuth } = useRequireAuth();
  const target: DiscountOrderTarget | null = generalStore.getState().discountOrder;

  const [state, setState] = useState<PanelState>({ status: "loading" });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;

    let active = true;
    (async () => {
      // Yield to the microtask queue so state updates happen asynchronously
      // (not synchronously within the effect body).
      await Promise.resolve();
      if (!active) return;

      const expired = isDiscountExpired(target.sentAt, Date.now());
      if (!target.discountLink || !target.newPrice) {
        setState({ status: "invalid", reason: "This offer is missing required details and can no longer be used." });
        return;
      }
      if (expired) {
        setState({ status: "invalid", reason: "This offer has expired. The 24-hour validity window has passed." });
        return;
      }

      try {
        const shop = await api.market.getShop(target.shopId);
        const products = (shop?.products ?? []) as Array<Record<string, unknown>>;
        const match = products.find(
          (p) =>
            String(p.source_id ?? "") === String(target.product_id) ||
            String(p.id ?? "") === String(target.product_id),
        );
        if (!active) return;
        if (!match) {
          setState({ status: "invalid", reason: "We couldn't find this product in the shop. It may have been removed." });
          return;
        }
        setState({ status: "ready", product: adaptProduct(match, target.shopName) });
      } catch {
        if (!active) return;
        setState({ status: "error", reason: "Could not load the product. Please check your connection and try again." });
      }
    })();

    return () => {
      active = false;
    };
  }, [target]);

  useEffect(() => {
    if (state.status !== "ready" && state.status !== "added") return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [state.status]);

  const close = () => generalStore.setState({ discountOrder: null });

  if (!target) return null;

  const oldNum = parseFloat(target.oldPrice || "");
  const newNum = parseFloat(target.newPrice || "");
  const savings = Number.isFinite(oldNum) && Number.isFinite(newNum) ? oldNum - newNum : 0;
  const percent =
    Number.isFinite(oldNum) && oldNum > 0 ? Math.max(0, Math.round((1 - newNum / oldNum) * 100)) : null;
  const expired = isDiscountExpired(target.sentAt, now);

  const handleProceed = () => {
    if (!requireAuth()) return;
    if (state.status !== "ready" || !target.newPrice) return;
    const ok = addDiscountedProductToCart(state.product, target.newPrice);
    if (ok) {
      setState({ status: "added" });
    } else {
      setState({ status: "error", reason: "This item could not be added to the cart." });
    }
  };

  const product = state.status === "ready" ? state.product : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(2,6,23,.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent:  "center",
        padding: 0,
      }}
      onClick={close}
    >
      <style>
        {"@keyframes chatspin { to { transform: rotate(360deg); } }"}
      </style>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "92vh",
          overflowY: "auto",
          paddingBottom: "var(--safe-bottom)",
          background: "var(--bg-surface)",
          borderRadius: bp.sm ? "18px 18px 0 0" : "18px",
          border: "1px solid var(--border-default)",
          boxShadow: "0 18px 50px rgba(0,0,0,.28)",
         
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--border-default)",
            position: "sticky",
            top: 0,
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BadgePercent size={18} color="var(--bg-nav-active)" />
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              Discount Offer
            </span>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            style={{
              padding: 6,
              border: "none",
              background: "var(--bg-secondary)",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <X size={16} color="var(--text-secondary)" />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {/* Validation / status strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 11px",
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 14,
              background: expired || state.status === "invalid"
                ? "rgba(220,38,38,.08)"
                : "rgba(22,163,74,.08)",
              color: expired || state.status === "invalid"
                ? "#dc2626"
                : "var(--success, #16a34a)",
            }}
          >
            {expired || state.status === "invalid" ? (
              <>
                <CircleAlert size={15} /> Offer not available
              </>
            ) : (
              <>
                <ShieldCheck size={15} /> Offer verified · valid for this item
              </>
            )}
          </div>

          {state.status === "loading" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                padding: "40px 0",
                color: "var(--text-muted)",
              }}
            >
              <span
                aria-label="Loading"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  border: "2.5px solid var(--border-default)",
                  borderTopColor: "var(--bg-nav-active)",
                  animation: "chatspin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: 13.5 }}>Verifying offer…</span>
            </div>
          )}

          {(state.status === "invalid" || state.status === "error") && (
            <div style={{ padding: "30px 8px", textAlign: "center" }}>
              <CircleAlert size={40} color="#dc2626" style={{ margin: "0 auto 12px" }} />
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-primary)" }}>
                {state.status === "error" ? state.reason : state.reason}
              </p>
              <button
                onClick={close}
                style={{
                  marginTop: 18,
                  padding: "10px 22px",
                  borderRadius: 12,
                  border: "none",
                  background: "var(--bg-nav-active)",
                  color: "var(--bg-surface)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}

          {state.status === "added" && (
            <div style={{ padding: "20px 8px", textAlign: "center" }}>
              <CheckCircle2 size={44} color="#16a34a" style={{ margin: "0 auto 12px" }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Added to your cart
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                {target.itemName} was added at your discount price of{" "}
                <b style={{ color: "var(--success, #16a34a)" }}>
                  {valueFormater(newNum.toFixed(2))}
                </b>
                .
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "center" }}>
                <button
                  onClick={close}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 12,
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Back to chat
                </button>
                <button
                  onClick={() => {
                    close();
                    const base = window.location.pathname.startsWith("/market")
                      ? "/market"
                      : "/home/market";
                    navigate(`${base}/orders`);
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 12,
                    border: "none",
                    background: "var(--bg-nav-active)",
                    color: "var(--bg-surface)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  View Cart &amp; Checkout
                </button>
              </div>
            </div>
          )}

          {state.status === "ready" && product && (
            <>
              {/* Product image */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "16/9",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "var(--bg-secondary)",
                  marginBottom: 14,
                }}
              >
                {product.productImageUrl ? (
                  <img
                    src={product.productImageUrl}
                    alt={product.product_name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <ShoppingBag size={40} />
                  </div>
                )}
                {!expired && percent !== null && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(220,38,38,.92)",
                      color: "#fff",
                      padding: "4px 9px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <BadgePercent size={13} />
                    {percent}% OFF
                  </div>
                )}
              </div>

              {/* Product info */}
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 750,
                  color: "var(--text-primary)",
                }}
              >
                {product.product_name}
              </p>
              <p style={{ margin: "2px 0 12px", fontSize: 12.5, color: "var(--text-muted)" }}>
                {target.shopName}
              </p>

              {/* Price card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--bg-secondary)",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  {oldNum !== newNum && (
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        textDecoration: "line-through",
                      }}
                    >
                      {valueFormater(oldNum.toFixed(2))}
                    </span>
                  )}
                  <span style={{ fontSize: 22, fontWeight: 800, color: "var(--success, #16a34a)" }}>
                    {valueFormater(newNum.toFixed(2))}
                  </span>
                </div>
                {savings > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#dc2626",
                      background: "rgba(220,38,38,.1)",
                      padding: "4px 8px",
                      borderRadius: 999,
                    }}
                  >
                    Save {valueFormater(savings.toFixed(2))}
                  </span>
                )}
              </div>

              {/* Countdown */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 16,
                }}
              >
                <Timer size={14} />
                {expired
                  ? "This offer has expired."
                  : `Offer ends in ${formatDiscountCountdown(target.sentAt, now)}`}
              </div>

              <button
                onClick={handleProceed}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "13px 14px",
                  border: "none",
                  borderRadius: 12,
                  background: "var(--bg-nav-active)",
                  color: "var(--bg-surface)",
                  fontSize: 14,
                  fontWeight: 750,
                  cursor: "pointer",
                  transition: "opacity .15s ease",
                }}
              >
                <ShoppingBag size={17} />
                Proceed to Add to Cart with Discount Price
              </button>
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  textAlign: "center",
                }}
              >
                You'll pay the discount price at checkout. Valid only while the offer is live.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
