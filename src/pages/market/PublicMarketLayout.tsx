import { Suspense, lazy, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogIn, LogOut, ShoppingCart } from "lucide-react";
import { Authcontext } from "@/context";

const MarketPage = lazy(() =>
  import("@/pages/market/MarketPage").then((m) => ({ default: m.MarketPage }))
);

export default function PublicMarketLayout() {
  const { user, orgUser, orgName, logout } = useContext(Authcontext);
  const { pathname } = useLocation();
  const authenticated = Boolean(user || orgUser);
  const displayName =
    orgUser?.name || user?.full_name || user?.username || "Account";
  // Service detail/section pages are full-screen views with their own back
  // header — keep them clean. The market header (with login) only shows for
  // guests there so they can still sign in while browsing.
  const isServiceRoute = /\/market\/services(\/|$)/.test(pathname);
  const showHeader = authenticated ? !isServiceRoute : true;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "var(--app-height)",
        overflow: "hidden",
        background: "var(--bg-surface)",
      }}
    >
      {showHeader && (
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
        {authenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            <span
              style={{
                fontSize: ".82rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {orgName ? `${displayName} · ${orgName}` : displayName}
            </span>
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: ".45rem",
                borderRadius: "0.6rem",
                cursor: "pointer",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
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
        )}
      </header>
      )}

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "var(--bg-page)", paddingBottom: "var(--safe-bottom)" }}>
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
