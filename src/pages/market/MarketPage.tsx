import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { Markets } from "./Markets";
import { valueFormater } from "./market";
import {
  CheckCircle,
  CreditCard,
  History,
  Minus,
  Plus,
  ShoppingCart,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { ShopPage } from "./ShopPage";
import { useStore } from "elk-components";
import {
  clearMarketCart,
  getMarketCartItemKey,
  getMarketCartTotals,
  marketCartStore,
  removeFromMarketCart,
  updateMarketCartQuantity,
  type MarketCartItem,
  type MarketCartTotals,
} from "./cart";
import { marketOrdersStore, submitMarketOrder } from "./marketApi";
import type { MarketCheckoutResult, MarketOrderAlert } from "./marketApi";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { MarketOrdersPage } from "./MarketOrdersPage";
import { MarketScanPage } from "./MarketScanPage";
import { ServicesPage } from "./ServicesPage";
import { ServiceDetailPage } from "./ServiceDetailPage";
import { ChatRoute } from "./chat/ChatRoute";
import { BottomSheet } from "@/components/BottomSheet";
import { safeBottomInset } from "@/lib/browser";

interface CartPanelProps {
  cart: MarketCartItem[];
  totals: MarketCartTotals;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  checkingOut: boolean;
  onClose?: () => void;
  onCheckout: () => void;
  onOpenLog: () => void;
  delivery: DeliveryInfo;
  setDelivery: (d: DeliveryInfo) => void;
}

export interface DeliveryInfo {
  name: string;
  phone: string;
  address: string;
}

const paymentButtons = [
  { label: "Cash", icon: Wallet },
  { label: "Card", icon: CreditCard },
  { label: "Mobile", icon: Smartphone },
];

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  fontSize: "16px",
  color: "var(--text-primary)",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-default)",
  borderRadius: "4px",
  outline: "none",
};

function CartPanel({
  cart,
  totals,
  paymentMethod,
  setPaymentMethod,
  checkingOut,
  onClose,
  onCheckout,
  onOpenLog,
  delivery,
  setDelivery,
}: CartPanelProps) {
  const bp = useBreakpoint();
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: "8px",
        border: "1px solid var(--border-default)",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: "0",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid var(--bg-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Cart ({cart.length})
        </span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              borderRadius: "4px",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px",
          maxHeight: bp.lg ? "240px" : "200px",
        }}
      >
        {cart.length === 0 ? (
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-placeholder)",
              textAlign: "center",
              padding: "24px 0",
              margin: 0,
            }}
          >
            Empty
          </p>
        ) : (
          cart.map((item) => (
            <div
              key={getMarketCartItemKey(item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                  }}
                >
                  {item.product_name[0]}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    margin: 0,
                  }}
                >
                  {item.product_name}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  {valueFormater(item.product_price)} × {item.quantity}
                </p>
                {item.variant &&
                  (item.variant.size || item.variant.color || item.variant.shape) && (
                    <p
                      style={{
                        fontSize: "9px",
                        color: "var(--text-info)",
                        margin: "2px 0 0",
                      }}
                    >
                      {[item.variant.size, item.variant.color, item.variant.shape]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <button
                  onClick={() => updateMarketCartQuantity(getMarketCartItemKey(item), -1)}
                  style={{
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    background: "var(--bg-tertiary)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Minus style={{ width: "12px", height: "12px" }} />
                </button>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    width: "16px",
                    textAlign: "center",
                  }}
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateMarketCartQuantity(getMarketCartItemKey(item), 1)}
                  style={{
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    background: "var(--bg-tertiary)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus style={{ width: "12px", height: "12px" }} />
                </button>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  minWidth: "48px",
                  textAlign: "right",
                }}
              >
                NLE{valueFormater((parseFloat(item.product_price) * item.quantity).toString())}
              </p>
              <button
                onClick={() => removeFromMarketCart(getMarketCartItemKey(item))}
                style={{
                  padding: ".4rem",
                  borderRadius: "1rem",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                <img
                  src={
                    "https://img.icons8.com/?size=100&id=11705&format=png&color=ff0000"
                  }
                  width={"20"}
                  height={"20"}
                />
              </button>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          padding: "12px",
          borderTop: "1px solid var(--bg-tertiary)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
          <span style={{ color: "var(--text-primary)" }}>
            NLE{valueFormater(totals.subtotal.toString())}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            marginBottom: "4px",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>Tax (5%)</span>
          <span style={{ color: "var(--text-primary)" }}>
            NLE{valueFormater(totals.tax.toString())}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            fontWeight: 700,
            paddingTop: "6px",
            borderTop: "1px solid var(--bg-tertiary)",
          }}
        >
          <span>Total</span>
          <span>NLE{valueFormater(totals.total.toString())}</span>
        </div>
      </div>

      <div
        style={{
          padding: "12px",
          borderTop: "1px solid var(--bg-tertiary)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Delivery details
        </span>
        <input
          value={delivery.name}
          onChange={(e) => setDelivery({ ...delivery, name: e.target.value })}
          placeholder="Recipient name"
          style={fieldStyle}
        />
        <input
          value={delivery.phone}
          onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })}
          placeholder="Phone number"
          style={fieldStyle}
        />
        <input
          value={delivery.address}
          onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
          placeholder="Delivery address"
          style={fieldStyle}
        />
      </div>

      <div
        style={{
          padding: "12px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "6px",
        }}
      >
        {paymentButtons.map((pb) => {
          const Icon = pb.icon;
          const isActive = paymentMethod === pb.label;
          return (
            <button
              key={pb.label}
              onClick={() => setPaymentMethod(pb.label)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                padding: "6px 0",
                fontSize: "10px",
                fontWeight: 500,
                background: isActive
                  ? "var(--bg-nav-active)"
                  : "var(--bg-secondary)",
                color: isActive
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
                border: isActive
                  ? "none"
                  : "1px solid var(--border-default)",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              <Icon style={{ width: "12px", height: "12px" }} /> {pb.label}
            </button>
          );
        })}
        <button
          onClick={onOpenLog}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            padding: "6px 0",
            fontSize: "10px",
            fontWeight: 500,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "4px",
            cursor: "pointer",
            color: "var(--text-secondary)",
          }}
        >
          <History style={{ width: "12px", height: "12px" }} /> Log
        </button>
        <OrdersLink />
      </div>

      <div style={{ padding: "0 12px 12px" }}>
        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || checkingOut}
          style={{
            width: "100%",
            padding: "8px 0",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            background:
              cart.length === 0
                ? "var(--text-placeholder)"
                : "var(--bg-nav-active)",
            borderRadius: "4px",
            border: "none",
            cursor: cart.length === 0 ? "not-allowed" : "pointer",
            opacity: checkingOut ? 0.6 : 1,
          }}
        >
          {checkingOut ? "Processing..." : `Checkout NLE${valueFormater(totals.total.toString())}`}
        </button>
      </div>
    </div>
  );
}

export function MarketPage() {
  const bp = useBreakpoint();
  const keyboardOpen = useKeyboardOpen();
  const location = useLocation();
  const isChatRoute = /\/market\/chat(\/|$)/.test(location.pathname);
  const { items: cart } = useStore(marketCartStore);
  const { orders } = useStore(marketOrdersStore);
  const { requireAuth } = useRequireAuth();
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [delivery, setDelivery] = useState<DeliveryInfo>({ name: "", phone: "", address: "" });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [lastOrder, setLastOrder] = useState<MarketCheckoutResult | null>(null);

  const totals = getMarketCartTotals(cart);

  const handleCheckout = async () => {
    if (!requireAuth()) return;
    if (cart.length === 0 || checkingOut) return;
    setCheckingOut(true);
    try {
      const result = await submitMarketOrder({
        items: cart,
        payment_method: paymentMethod,
        delivery_name: delivery.name.trim() || undefined,
        delivery_phone: delivery.phone.trim() || undefined,
        delivery_address: delivery.address.trim() || undefined,
      });
      clearMarketCart();
      setLastOrder(result);
      setSuccessMsg(
        `Order ${result.order_id} placed · ${result.alerts.length} shop${
          result.alerts.length === 1 ? "" : "s"
        } alerted`,
      );
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (e) {
      console.error("Checkout failed", e);
      setSuccessMsg("Checkout failed, please try again.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } finally {
      setCheckingOut(false);
    }
  };

  const cartPanelProps = {
    cart,
    totals,
    paymentMethod,
    setPaymentMethod,
    checkingOut,
    onCheckout: handleCheckout,
    onOpenLog: () => setShowLog(true),
    delivery,
    setDelivery,
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: bp.mlg && !isChatRoute ? "1fr 400px" : "1fr",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          justifyItems: "center",
        }}
      >
        <Routes>
          <Route path="/" element={<Markets />} />
          <Route path="/chat" element={<ChatRoute />} />
          <Route path="/chat/:threadId" element={<ChatRoute />} />
          <Route path="/orders" element={<MarketOrdersPage />} />
          <Route path="/orders/scan" element={<MarketScanPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/:id/*" element={<ShopPage />} />
        </Routes>

        {!isChatRoute && bp.mlg ? (
          <CartPanel {...cartPanelProps} />
        ) : (
          !isChatRoute && !keyboardOpen && (
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              position: "fixed",
              bottom: "calc(5.5rem + var(--safe-bottom))",
              right: "calc(1rem + var(--safe-right))",
              zIndex: 900,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              borderRadius: "2rem",
              border: "none",
              background: "var(--bg-nav-active)",
              color: "var(--bg-surface)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,.25)",
            }}
          >
            <ShoppingCart style={{ width: "16px", height: "16px" }} />
            Cart ({cart.length})
          </button>
          )
        )}

        {!isChatRoute && !bp.mlg && (
          <BottomSheet
            open={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            zIndex={950}
            maxHeight="85vh"
            bottom={safeBottomInset(16)}
          >
            <div
              style={{
                padding: "6px 8px 8px",
                overflowX: "hidden",
                width: "100%",
              }}
            >
              <CartPanel
                {...cartPanelProps}
                onClose={() => setIsCartOpen(false)}
              />
            </div>
          </BottomSheet>
        )}

        {successMsg && (
          <div
            style={{
              position: "fixed",
              top: "1rem",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 960,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-success)",
              background: "var(--bg-success)",
              border: "1px solid var(--border-success)",
              padding: "10px 16px",
              borderRadius: "10px",
              boxShadow: "var(--shadow-card)",
              maxWidth: "92vw",
            }}
          >
            <CheckCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {showLog && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
            onClick={() => setShowLog(false)}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "12px",
                padding: "24px",
                width: "100%",
                maxWidth: "560px",
                maxHeight: "80vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Recent Orders
                </h3>
                <button
                  onClick={() => setShowLog(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: ".35rem",
                    borderRadius: "50%",
                    cursor: "pointer",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {orders.length === 0 && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-placeholder)",
                    textAlign: "center",
                    padding: "24px 0",
                    margin: 0,
                  }}
                >
                  No orders yet — checkout to place an order.
                </p>
              )}

              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-default)",
                    background: "var(--bg-secondary)",
                    contentVisibility: "auto",
                    containIntrinsicSize: "110px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: "12px",
                        color: "var(--text-primary)",
                        margin: 0,
                      }}
                    >
                      {order.id.slice(0, 8)}
                    </strong>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: ".04em",
                      }}
                    >
                      {order.payment_method ?? "Cash"} ·{" "}
                      {order.created_at ? new Date(order.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--text-secondary)",
                      margin: "4px 0 0 0",
                    }}
                  >
                    {order.items.length} item(s) · Status: {order.status} · NLE
                    {valueFormater(order.total.toString())}
                  </p>
                  <Link
                    to={`${marketBasePath()}/orders`}
                    style={{
                      display: "inline-block",
                      marginTop: "8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--bg-surface)",
                      background: "var(--bg-nav-active)",
                      padding: "5px 12px",
                      borderRadius: "6px",
                      textDecoration: "none",
                    }}
                  >
                    View orders
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {lastOrder && lastOrder.alerts.length > 0 && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9998,
              padding: "16px",
            }}
            onClick={() => setLastOrder(null)}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "12px",
                padding: "24px",
                width: "100%",
                maxWidth: "480px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Order sent to shops
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                Checkout successful — the shops below were alerted about your
                order.
              </p>
              {lastOrder.alerts.map((alert) => (
                <ShopAlert key={alert.shop_id} alert={alert} />
              ))}
              <button
                onClick={() => setLastOrder(null)}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  background: "var(--bg-nav-active)",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  marginTop: "4px",
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ShopAlert({ alert }: { alert: MarketOrderAlert }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        padding: "8px 10px",
        borderRadius: "8px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-success)",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <strong
          style={{
            fontSize: "11px",
            color: "var(--text-primary)",
            display: "block",
          }}
        >
          {alert.shop_name}
          {alert.owner ? ` · ${alert.owner}` : ""}
        </strong>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            margin: "2px 0 0 0",
            wordBreak: "break-word",
          }}
        >
          {alert.message}
        </p>
      </div>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--text-success)",
          whiteSpace: "nowrap",
        }}
      >
        NLE{valueFormater(alert.amount.toString())}
      </span>
    </div>
  );
}

function marketBasePath(): string {
  return window.location.pathname.startsWith("/market") ? "/market" : "/home/market";
}

function OrdersLink() {
  return (
    <Link
      to={`${marketBasePath()}/orders`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        padding: "6px 0",
        fontSize: "10px",
        fontWeight: 500,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
        borderRadius: "4px",
        cursor: "pointer",
        color: "var(--text-secondary)",
        textDecoration: "none",
      }}
    >
      <History style={{ width: "12px", height: "12px" }} /> Orders
    </Link>
  );
}
