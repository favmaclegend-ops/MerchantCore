import { useStore } from "elk-components";
import { marketStore } from "./demoMarketStore";
import { Bilboards } from "./components/Bilboards";
import { ServicesSection } from "./components/ServicesSection";
import { ProductsSection } from "./components/ProductsSection";
import { MarketLoading } from "./components/MarketLoading";
import { useMarketData } from "./useMarketData";
import { useState, useRef, useEffect } from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useNavigate } from "react-router-dom";
import Alert from "@/components/alert/alert";
import { marketBasePath } from "./market";
import { Search, Ban, RefreshCw } from "lucide-react";
import { syncUserMarketData } from "./marketApi";
import { marketUiStore } from "./marketUiStore";

export function Markets() {
  const { loading } = useMarketData();
  const state = useStore(marketStore);
  const marketHeaderHidden = useStore(marketUiStore).headerHidden;
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const SCROLL_KEY = "markets-scroll";

  // Pull-to-reveal state: when the user is at the very top and pulls down, the
  // hidden billboard tracks the finger and reveals past a threshold.
  const PULL_REVEAL_PX = 70;
  const [pullY, setPullY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [billboardHidden, setBillboardHidden] = useState(false);
  const bhRef = useRef(billboardHidden);

  useEffect(() => {
    bhRef.current = billboardHidden;
  }, [billboardHidden]);

  const [alert, setAlert] = useState<{ message: string; type: string } | null>(
    null,
  );

  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-reveal: intercept the touch gesture at the very top so the browser's
  // native overscroll bounce never creates that extra stretch space above, and
  // the hidden billboard tracks the finger instead. Uses passive:false so we can
  // preventDefault on the touchmove.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let startY = 0;
    let active = false;

    const onTouchStart = (e: TouchEvent) => {
      active = true;
      startY = e.touches[0].clientY;
      setPulling(true);
      setPullY(0);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!active) return;
      if (el.scrollTop > 0) return;
      const delta = e.touches[0].clientY - startY;
      if (delta <= 0) return;
      // Stop the native overscroll bounce at the top so the reveal can drive it.
      e.preventDefault();
      setPullY(Math.min(delta, 160));
      if (bhRef.current && delta >= PULL_REVEAL_PX) setBillboardHidden(false);
    };
    const end = () => {
      active = false;
      setPulling(false);
      setPullY(0);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, []);

  const refreshMarket = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await syncUserMarketData();
      setAlert({ message: "Market refreshed", type: "success" });
    } catch {
      setAlert({ message: "Failed to refresh market", type: "error" });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved && scrollRef.current && bp.sm) {
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = parseInt(saved, 10) || 0;
        // The billboard is hidden by default (it is only revealed via pull).
        if (el.scrollTop > 8) setBillboardHidden(true);
      });
    }
  }, [bp.sm]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const st = el.scrollTop;
    sessionStorage.setItem(SCROLL_KEY, String(st));

    // Only behave on mobile; desktop keeps the billboard always visible.
    if (!bp.sm) return;

    // Breathing space: only slide the billboard up (hide) when there is real
    // content to scroll. With only a few items the user views them freely.
    const scrollable = el.scrollHeight > el.clientHeight + 1;
    if (!scrollable) return;

    // "Slide up to hide": once the user actually scrolls the content up the
    // revealed billboard hides again. It is revealed only via the pull gesture.
    if (st > 8 && !billboardHidden) setBillboardHidden(true);
  };

  useEffect(() => {
    if (!alert) return;
    const id = setTimeout(() => setAlert(null), 2000);
    return () => clearTimeout(id);
  }, [alert]);

  const fetchError = state.fetchError;

  const goToProducts = () => navigate(`${marketBasePath()}/products`);

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "100%",
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 0,
          padding: bp.lg ? "1rem 1rem 30%" : "0 0 30%",
          gap: "1rem",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
        }}
      >
        {fetchError && (
          <div
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: ".75rem",
              background: "var(--bg-danger, #3b1111)",
              border: "1px solid var(--border-danger, #5c1a1a)",
              display: "flex",
              alignItems: "center",
              gap: ".75rem",
              color: "var(--text-danger, #f87171)",
              fontSize: ".9rem",
            }}
          >
            <Ban size={18} />
            <span>{fetchError}</span>
          </div>
        )}

        {/* =====================================================================
            MOBILE: market header with billboard + search entry
            ===================================================================== */}
        {!bp.lg && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              background: "var(--bg-page)",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              padding: "0.5rem 1rem 0",
              boxShadow: billboardHidden
                ? "0 1px 0 var(--border-default)"
                : "none",
              transition: "box-shadow 0.25s ease",
              display: marketHeaderHidden ? "none" : "flex",
              flexDirection: "column",
            }}
          >
            {/* Header row: title + refresh */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "0.25rem 0 0.6rem",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "var(--text-primary)",
                }}
              >
                Market
              </span>
              <button
                onClick={refreshMarket}
                aria-label="Refresh market"
                title="Refresh market"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <RefreshCw
                  style={{
                    width: "16px",
                    height: "16px",
                    animation: refreshing ? "spin 1s linear infinite" : "none",
                  }}
                />
              </button>
            </div>

            {/* Billboard sits below the title. It is hidden by default and
                revealed by pulling down at the very top — the pull tracks the
                finger and opens it proportionally, snapping fully open past the
                threshold. */}
            <Bilboards
              hidden={billboardHidden}
              pull={billboardHidden ? pullY : 0}
              pulling={pulling}
            />

            {/* Search entry: opens the full products browse page */}
            <button
              onClick={goToProducts}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "1rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-placeholder)",
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "0.5rem",
              }}
            >
              <Search style={{ width: "16px", height: "16px", flexShrink: 0 }} />
              Search the market…
            </button>
          </div>
        )}

        {/* =====================================================================
            DESKTOP: sticky search + refresh
            ===================================================================== */}
        {bp.lg && !marketHeaderHidden && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "var(--bg-page)",
              display: "flex",
              alignItems: "center",
              gap: ".75rem",
              width: "100%",
              padding: "1rem 0 0",
              boxShadow: "0 1px 0 var(--border-default)",
            }}
          >
            <button
              onClick={goToProducts}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: ".5rem",
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                padding: ".5rem .75rem",
                borderRadius: "1rem",
                fontSize: "16px",
                color: "var(--text-placeholder)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <Search style={{ width: "16px", height: "16px", flexShrink: 0 }} />
              Search Products…
            </button>
            <button
              onClick={refreshMarket}
              aria-label="Refresh market"
              title="Refresh market"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "38px",
                height: "38px",
                flexShrink: 0,
                borderRadius: "1rem",
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              <RefreshCw
                style={{
                  width: "17px",
                  height: "17px",
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>
          </div>
        )}

        {bp.lg && <Bilboards hidden={false} />}

        <ServicesSection />

        <ProductsSection />

        {loading && <MarketLoading info="Loading market data..." />}
      </div>

      {alert && <Alert message={alert.message} type={alert.type} />}
    </>
  );
}