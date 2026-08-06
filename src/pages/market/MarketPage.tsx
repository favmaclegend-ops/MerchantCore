import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Markets } from "./Markets";
import { valueFormater } from "./market";
import { CreditCard, History, Minus, Plus, Smartphone, Wallet } from "lucide-react";
import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { ShopPage } from "./ShopPage";

export function MarketPage() {
  const bp = useBreakpoint();
  const cart = [];
  const paymentButtons = [
    { label: "Cash", icon: Wallet },
    { label: "Card", icon: CreditCard },
    { label: "Mobile", icon: Smartphone },
  ];
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: bp.mlg ? "1fr 400px" : "1fr",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          justifyItems: 'center'
        }}
      >
        <Routes >
          <Route path="/" element={<Markets />}/>
          <Route path="/:id/*" element={<ShopPage />} />
        </Routes>
        
        {bp.mlg && (
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "8px",
              border: "1px solid var(--border-default)",
              display: "flex",
              flexDirection: "column",
              width: '100%'
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
                Cart
              </span>
              {!bp.xl && (
                <button
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
                    key={item.id}
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
                        {item.name[0]}
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
                        {item.name}
                      </p>
                      <p
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          margin: 0,
                        }}
                      >
                        {valueFormater(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      <button
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
                      {valueFormater((item.price * item.quantity).toString())}
                    </p>
                    <button
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
                <span style={{ color: "var(--text-primary)" }}></span>
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
                <span style={{ color: "var(--text-primary)" }}></span>
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
                <span></span>
              </div>
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
                    <Icon style={{ width: "12px", height: "12px" }} />{" "}
                    {pb.label}
                  </button>
                );
              })}
              <button
               
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
            </div>

            <div style={{ padding: "0 12px 12px" }}>
              <button
              
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
                  
                }}
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
