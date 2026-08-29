import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { LogIn, ShoppingCart } from "lucide-react";

const MarketPage = lazy(() =>
  import("@/pages/market/MarketPage").then((m) => ({ default: m.MarketPage }))
);

export default function PublicMarketLayout() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "var(--app-height)",
        overflow: "hidden",
        background: "var(--bg-page)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "calc(1.25rem + var(--safe-left))",
          paddingRight: "calc(1.25rem + var(--safe-right))",
          paddingTop: "var(--safe-top)",
          paddingBottom: 0,
          height: "calc(3.5rem + var(--safe-top))",
          flexShrink: 0,
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Link
          to="/market"
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
            textDecoration: "none",
            color: "var(--text-primary)",
            fontWeight: 700,
            fontSize: "1rem",
          }}
        >
          <ShoppingCart size={20} color="var(--text-info)" />
          Merchant Core Market
        </Link>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".4rem",
            padding: ".45rem 1rem",
            borderRadius: "0.6rem",
            background: "var(--bg-nav-active)",
            color: "var(--bg-surface)",
            fontSize: ".82rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <LogIn size={15} />
          Login
        </Link>
      </header>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: "var(--safe-bottom)" }}>
        <Suspense
          fallback={
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-placeholder)",
                fontSize: "14px",
              }}
            >
              Loading...
            </div>
          }
        >
          <MarketPage />
        </Suspense>
      </div>
    </div>
  );
}
