import { useDebounceEffect, useSetState, useStore } from "elk-components";
import { marketStore } from "./demoMarketStore";
import type { MarketStoreProduct } from "./demoMarketStore";
import { addToMarketCart } from "./cart";
import { Bilboards } from "./components/Bilboards";
import { MarketLoading } from "./components/MarketLoading";
import { ProductInfoPanel } from "./components/ProductInfoPanel";
import { useMarketData } from "./useMarketData";
import { useShopOwner } from "./useShopOwner";
import { useState, type ChangeEvent, useRef, useEffect } from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import Alert from "@/components/alert/alert";
import { valueFormater } from "./market";
import { getProductRatingFigure } from "./productRatings";
import { getProductsByChunck } from "./randomSlectedProduct";
import { ChevronLeft, ChevronRight, Ban } from "lucide-react";
import { chunckStore } from "./store/chunckStore";
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

  const [selectedProduct, setSelectedProduct] =
    useState<MarketStoreProduct | null>(null);

  const [alert, setAlert] = useState<{ message: string; type: string } | null>(
    null,
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = parseInt(saved, 10) || 0;
          if (scrollRef.current.scrollTop > 180) setBillboardHidden(true);
        }
      });
    }
  }, []);

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
    if (scrollRef.current) {
      const st = scrollRef.current.scrollTop;
      sessionStorage.setItem(SCROLL_KEY, String(st));
      if (st > 180 && !billboardHidden) setBillboardHidden(true);
      else if (st <= 10 && billboardHidden) setBillboardHidden(false);
    }
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
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          padding: "1rem",
          paddingBottom: "4rem",
          gap: "1rem",
          overflowY: "auto",
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

        <Bilboards hidden={billboardHidden} />

        {/* Sticky search + categories bar */}
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
            paddingBlock: "8px",
            boxShadow: billboardHidden ? "0 1px 0 var(--border-default)" : "none",
            transition: "box-shadow 0.25s ease",
          }}
        >
          <input
            placeholder="Search Products..."
            style={{
              width: "100%",
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              padding: ".5rem .75rem",
              borderRadius: "1rem",
              fontSize: "16px",
            }}
            onChange={handleSearch}
            onFocus={() => setIsSearch(true)}
          />

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
              gridTemplateColumns: bp.xxsm
                ? "1fr"
                : bp.sm
                  ? "1fr 1fr"
                  : `repeat(auto-fit, minmax(190px, ${filterProduct.length <= 3 ? "300px" : ".5fr"})`,
              width: "100%",
              gap: "1rem",
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
                    height: "clamp(.5svh, auto)",

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
                      <h2>{product.product_name}</h2>
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
