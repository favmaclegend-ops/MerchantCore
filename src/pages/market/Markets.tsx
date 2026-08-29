import { useDebounceEffect, useSetState, useStore } from "elk-components";
import { marketStore } from "./demoMarketStore";
import type { MarketStoreProduct } from "./demoMarketStore";
import { addToMarketCart } from "./cart";
import { Bilboards } from "./components/Bilboards";
import { MarketLoading } from "./components/MarketLoading";
import { ProductInfoPanel } from "./components/ProductInfoPanel";
import { useMarketData } from "./useMarketData";
import { useShopOwner } from "./useShopOwner";
import {
  useState,
  type ChangeEvent,
  useRef,
  useEffect,
} from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Alert from "@/components/alert/alert";
import { valueFormater } from "./market";
import { getProductRatingFigure } from "./productRatings";
import { getProductsByChunck } from "./randomSlectedProduct";
import { ChevronLeft, ChevronRight, Ban, Search, X, RefreshCw } from "lucide-react";
import { chunckStore } from "./store/chunckStore";
import { MobileMarketSearch } from "./components/MobileMarketSearch";
import { syncUserMarketData } from "./marketApi";
import { marketUiStore } from "./marketUiStore";
// import { getRandomProduct } from "./randomSlectedProduct";

export function Markets() {
  useStore(chunckStore);
  const { loading } = useMarketData();
  const state = useStore(marketStore);
  const [products, setProducts] = useState<MarketStoreProduct[]>([]);
  const updateChunck = useSetState(chunckStore);
  const categories = state.catergories ?? [];
  const { isMyInventoryProduct } = useShopOwner();
  const { requireAuth } = useRequireAuth();
  const [activeCat, setActiveCat] = useState(0);
  const [query, setQuery] = useState("");
  const [isSearch, setIsSearch] = useState(false);
  const [billboardHidden, setBillboardHidden] = useState(false);
  const bp = useBreakpoint();
  const scrollRef = useRef<HTMLDivElement>(null);
  const SCROLL_KEY = "markets-scroll";
  const chunckSize = chunckStore.getSnapshot().size;

  // Pull-to-reveal state: when the user is at the very top and pulls down, the
  // hidden billboard tracks the finger and reveals past a threshold.
  const PULL_REVEAL_PX = 70;
  const [pullY, setPullY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const bhRef = useRef(billboardHidden);

  useEffect(() => {
    bhRef.current = billboardHidden;
  }, [billboardHidden]);

  // Hide the floating bottom navbar while in search mode so the market takes a
  // full screen, scrolling right under the mobile header. Reset on unmount.
  useEffect(() => {
    marketUiStore.setState({ navHidden: isSearch });
    return () => marketUiStore.setState({ navHidden: false });
  }, [isSearch]);

  const [selectedProduct, setSelectedProduct] =
    useState<MarketStoreProduct | null>(null);

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

  // Mark the chunk as reloading whenever the market feed changes so the grid
  // shows a spinner instead of a false "empty" while the chunk page recomputes.
  useEffect(() => {
    chunckStore.setState({ isProductLoading: true });
  }, [state.products]);

  // get first N products in chunks
  useDebounceEffect(
    () => {
      getProductsByChunck({
        start: chunckStore.getState().start,
        end: chunckStore.getState().end,
      })
        .then((products) => {
          setProducts(products);
          chunckStore.setState({ isProductLoading: false });
        })
        .catch((e) =>
          console.error("An error occurred while fetching the products", e),
        );
    },
    1000,
    [marketStore.getState().products, chunckStore.getState().updates],
  );

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

  const handleAddToCart = (product: MarketStoreProduct) => {
    if (!requireAuth()) return;
    if (addToMarketCart(product)) {
      setAlert({
        message: `${product.product_name} added to cart`,
        type: "success",
      });
    } else {
      setAlert({
        message: `${product.product_name} is out of stock`,
        type: "error",
      });
    }
  };

  const baseProducts =
    categories[activeCat] === "All"
      ? products
      : products.filter((p) => p.category === categories[activeCat]);

  const filterProduct =
    query.trim() === ""
      ? baseProducts
      : state.products.filter(
          (p) =>
            p.product_name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase()) ||
            (p.keywords?.includes(query.toLowerCase()) ?? false) ||
            p.shop_name.toLowerCase().includes(query.toLowerCase()),
        );

  const handleActiveCat = (idx: number) => {
    setActiveCat(idx);
  };

  const handleSearch = (e: ChangeEvent) => {
    setQuery((e.currentTarget as HTMLInputElement).value ?? "");
  };

  const closeSearch = () => {
    setQuery("");
    setIsSearch(false);
  };

  const fetchError = state.fetchError;

  // "Has products" is decided from the whole market feed (state.products), not the
  // chunked page below, so we never show a false "empty" while a chunk is loading.
  const hasProducts = (state.products ?? []).length > 0;

  const isProductLoading = chunckStore.getState().isProductLoading;

  const noProductsForCategory =
    hasProducts && !isProductLoading && filterProduct.length === 0 && !query.trim();

  const noResultsAtAll = !hasProducts && !loading && !fetchError;

  const noSearchResults = query.trim() !== "" && filterProduct.length === 0;

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
          padding: bp.lg ? "1rem" : "0",
          paddingBottom: "4rem",
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
            MOBILE: partitioned market header with CapCut-style collapse
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
              padding: isSearch ? "0.5rem 1rem" : "0.5rem 1rem 0",
              boxShadow: billboardHidden || isSearch ? "0 1px 0 var(--border-default)" : "none",
              transition: "box-shadow 0.25s ease",
            }}
          >
            {isSearch ? (
              <MobileMarketSearch
                value={query}
                onChange={(v) => setQuery(v)}
                onClose={closeSearch}
              />
            ) : (
              <>
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

                {/* Billboard sits BEFORE the partition tabs. It is hidden by
                    default and revealed by pulling down at the very top — the
                    pull tracks the finger and opens the billboard
                    proportionally, snapping fully open past a threshold. */}
                <Bilboards
                  hidden={isSearch || billboardHidden}
                  pull={billboardHidden && !isSearch ? pullY : 0}
                  pulling={pulling}
                />

                {/* Pinned search bar: appears once the user scrolls past the
                    hero, replacing the partition to free up room. X returns to
                    the normal partition layout. */}
                <div
                  style={{
                    display: billboardHidden ? "flex" : "none",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <div
                    onClick={() => {
                      setIsSearch(true);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setIsSearch(true);
                    }}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "1rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-placeholder)",
                      fontSize: "14px",
                      cursor: "text",
                    }}
                  >
                    <Search style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                    Search the market…
                  </div>
                  <button
                    onClick={() => {
                      setQuery("");
                      setIsSearch(false);
                      setBillboardHidden(false);
                      if (scrollRef.current) scrollRef.current.scrollTop = 0;
                    }}
                    aria-label="Close search"
                    title="Back to normal market"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "var(--bg-nav-active)",
                      color: "var(--bg-surface)",
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Two wide partition buttons (segmented market sections) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    width: "100%",
                    transition: "opacity 0.25s ease, max-height 0.3s ease, margin 0.3s ease",
                    maxHeight: billboardHidden ? "0" : "64px",
                    opacity: billboardHidden ? 0 : 1,
                    marginBottom: billboardHidden ? "0" : "0.5rem",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveCat(0);
                      setIsSearch(false);
                    }}
                    style={{
                      padding: "0.7rem 0.5rem",
                      borderRadius: "0.9rem",
                      border: "1px solid var(--border-default)",
                      background: activeCat === 0 ? "var(--bg-nav-active)" : "var(--bg-surface)",
                      color: activeCat === 0 ? "var(--bg-surface)" : "var(--text-primary)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "background 0.2s ease, color 0.2s ease",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {categories[activeCat] ?? "All"}
                  </button>
                  <button
                    onClick={() => setIsSearch(true)}
                    style={{
                      padding: "0.7rem 0.5rem",
                      borderRadius: "0.9rem",
                      border: "1px solid var(--border-default)",
                      background: "var(--bg-surface)",
                      color: "var(--text-secondary)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Search style={{ width: "15px", height: "15px" }} />
                    Search
                  </button>
                </div>

                {/* Category chips (collapse with the partition on scroll) */}
                <div
                  style={{
                    display: "flex",
                    gap: ".6rem",
                    alignItems: "center",
                    width: "100%",
                    overflowX: "auto",
                    flex: "0 0 auto",
                    scrollbarWidth: "none",
                    paddingBottom: "0.5rem",
                    transition: "opacity 0.25s ease, max-height 0.3s ease",
                    maxHeight: billboardHidden ? "0" : "44px",
                    opacity: billboardHidden ? 0 : 1,
                  }}
                >
                  {categories.map((cat, idx) => (
                    <button
                      key={idx}
                      style={{
                        padding: ".4rem .85rem",
                        borderRadius: "2rem",
                        border: "1px solid var(--border-default)",
                        flex: "0 0 auto",
                        cursor: "pointer",
                        fontSize: ".8rem",
                        fontWeight: 500,
                        background: activeCat == idx ? "var(--bg-nav-active)" : "transparent",
                        color:
                          activeCat == idx
                            ? "var(--bg-surface)"
                            : "var(--text-primary)",
                        transition: "background .3s ease, color .3s ease",
                      }}
                      onClick={() => {
                        handleActiveCat(idx);
                        setIsSearch(false);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* =====================================================================
            DESKTOP: original sticky search + category bar
            ===================================================================== */}
        {bp.lg && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "var(--bg-page)",
              display: "flex",
              flexDirection: "column",
              gap: ".75rem",
              width: "100%",
              padding: "1rem 0 0",
              boxShadow: "0 1px 0 var(--border-default)",
              transition: "box-shadow 0.25s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".5rem",
                width: "100%",
              }}
            >
              <input
                placeholder="Search Products..."
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-surface)",
                  padding: ".5rem .75rem",
                  borderRadius: "1rem",
                  fontSize: "16px",
                }}
                onChange={handleSearch}
                onFocus={() => setIsSearch(true)}
              />
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

            <div
              style={{
                display: "flex",
                gap: ".75rem",
                alignItems: "center",
                width: "100%",
                overflowX: "auto",
                flex: "0 0 auto",
                scrollbarWidth: "none",
              }}
            >
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  style={{
                    padding: ".4rem .85rem",
                    borderRadius: "2rem",
                    border: "1px solid var(--border-default)",
                    flex: "0 0 auto",
                    cursor: "pointer",
                    fontSize: ".8rem",
                    fontWeight: 500,
                    background: activeCat == idx ? "var(--bg-nav-active)" : "transparent",
                    color:
                      activeCat == idx
                        ? "var(--bg-surface)"
                        : "var(--text-primary)",
                    transition: "background .3s ease, color .3s ease",
                  }}
                  onClick={() => {
                    handleActiveCat(idx);
                    setIsSearch(false);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {bp.lg && <Bilboards hidden={false} />}

        {loading ? (
          <MarketLoading info="Loading market data..." />
        ) : noResultsAtAll ? (
          <div
            style={{
              width: "100%",
              flex: "1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
              padding: bp.lg ? "0" : "0 1rem",
            }}
          >
            <Ban color="grey" />
            <span style={{ color: "GrayText" }}>Nothing on the market yet</span>
          </div>
        ) : isProductLoading ? (
          <MarketLoading info="Loading Products ..." />
        ) : noProductsForCategory ? (
          <div
            style={{
              width: "100%",
              flex: "1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
              padding: bp.lg ? "0" : "0 1rem",
            }}
          >
            <Ban color="grey" />
            <span style={{ color: "GrayText" }}>
              Nothing for this category
            </span>
          </div>
        ) : noSearchResults ? (
          <div
            style={{
              width: "100%",
              flex: "1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
              padding: bp.lg ? "0" : "0 1rem",
            }}
          >
            <Ban color="grey" />
            <span style={{ color: "GrayText" }}>
              No results for "{query}"
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: bp.lg
                ? `repeat(auto-fit, minmax(190px, ${filterProduct.length <= 3 ? "300px" : ".5fr"})`
                : "repeat(auto-fill, minmax(min(100%, 160px), 1fr))",
              width: "100%",
              gap: "1rem",
              padding: bp.lg ? "0" : "0 1rem",
            }}
          >
            {filterProduct.map((product) => {
              return (
                <div
                  key={product.product_id}
                  className="click"
                  onClick={() => setSelectedProduct(product)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    width: "100%",
                    height: "auto",
                    contentVisibility: "auto",
                    containIntrinsicSize: "230px",
                    padding: "1rem",
                    background: "var(--bg-nav)",
                    border: "var(--border-default)",
                    borderRadius: "1rem",
                    gap: ".5rem",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      borderRadius: ".5rem",
                      background: "#7878786b",
                      height: "8rem",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {product.productImageUrl ? (
                      <img
                        src={product.productImageUrl}
                        alt={product.product_name}
                        draggable={false}
                        style={{
                          objectFit: "cover",
                          borderRadius: ".5rem",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%" }} />
                    )}
                    <span
                      style={{
                        position: "absolute",
                        top: ".5rem",
                        left: ".5rem",
                        fontSize: ".7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: ".04em",
                        padding: ".2rem .6rem",
                        borderRadius: "3rem",
                        background: product.inStock
                          ? "var(--bg-success)"
                          : "var(--bg-danger)",
                        color: product.inStock
                          ? "var(--text-success)"
                          : "var(--text-danger)",
                      }}
                    >
                      {product.inStock ? "In stock" : "Sold out"}
                    </span>
                    {isMyInventoryProduct(product) && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: ".5rem",
                          left: ".5rem",
                          fontSize: ".65rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                          padding: ".2rem .6rem",
                          borderRadius: "3rem",
                          background: "rgba(2,6,23,.55)",
                          color: "var(--text-info)",
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        Your inventory
                      </span>
                    )}
                  </div>

                  <div>
                    <div>
                      <h2
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}
                      >
                        {product.product_name}
                      </h2>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <strong>NLE{valueFormater(product.product_price)}</strong>
                      <strong
                        style={{ color: "gold", marginInlineStart: "auto" }}
                      >
                        {valueFormater(getProductRatingFigure(product))}
                      </strong>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      style={{
                        width: "100%",
                        padding: ".4rem",
                        borderRadius: ".5rem",
                        background: "var(--bg-nav-active)",
                        cursor: product.inStock ? "pointer" : "not-allowed",
                        opacity: product.inStock ? 1 : 0.5,
                        border: "none",
                      }}
                      className="click"
                    >
                      <span style={{ color: "var(--bg-surface)" }}>
                        {product.inStock ? "Add to Cart" : "Sold out"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isSearch &&
          chunckStore.getState().start > 0 &&
          filterProduct.length > 0 && (
            <button
              className="click"
              disabled={chunckStore.getState().isProductLoading}
              onClick={() =>
                updateChunck({
                  start: chunckStore.getState().start - chunckSize,
                  end: chunckStore.getState().end - chunckSize,
                  updates: chunckStore.getState().updates - 1,
                  isProductLoading: true,
                })
              }
              style={{
                margin: "0 auto",
                padding: ".5rem 1.5rem",
                borderRadius: "2rem",
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                cursor: chunckStore.getState().isProductLoading ? "not-allowed" : "pointer",
                opacity: chunckStore.getState().isProductLoading ? 0.4 : 1,
                display: "flex",
                alignItems: "center",
                gap: ".35rem",
                fontSize: ".8rem",
                fontWeight: 500,
                color: "var(--text-primary)",
                transition: "opacity .2s",
              }}
            >
              <ChevronLeft size={15} />
              Load previous
            </button>
          )}

        {!isSearch &&
          chunckStore.getState().end <= baseProducts.length &&
          filterProduct.length > 0 && (
            <button
              className="click"
              disabled={chunckStore.getState().isProductLoading}
              onClick={() =>
                updateChunck({
                  start: chunckStore.getState().end,
                  end: chunckStore.getState().end + chunckSize,
                  updates: chunckStore.getState().updates + 1,
                  isProductLoading: true,
                })
              }
              style={{
                margin: "0 auto",
                padding: ".5rem 1.5rem",
                borderRadius: "2rem",
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                cursor: chunckStore.getState().isProductLoading ? "not-allowed" : "pointer",
                opacity: chunckStore.getState().isProductLoading ? 0.4 : 1,
                display: "flex",
                alignItems: "center",
                gap: ".35rem",
                fontSize: ".8rem",
                fontWeight: 500,
                color: "var(--text-primary)",
                transition: "opacity .2s",
              }}
            >
              Load more
              <ChevronRight size={15} />
            </button>
          )}
      </div>
      {selectedProduct && (
        <ProductInfoPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      {alert && <Alert message={alert.message} type={alert.type} />}
    </>
  );
}
