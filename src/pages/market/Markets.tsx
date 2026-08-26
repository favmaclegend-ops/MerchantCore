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
import Alert from "@/components/alert/alert";
import { valueFormater } from "./market";
import { getProductRatingFigure } from "./productRatings";
import { getProductsByChunck } from "./randomSlectedProduct";
import { ArrowLeft, ArrowRight, Ban } from "lucide-react";
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
  const [activeCat, setActiveCat] = useState(0);
  const [query, setQuery] = useState("");
  const [isSearch, setIsSearch] = useState(false);
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
        }
      });
    }
  }, []);

  // get first 10 products
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
          console.error("An error occure whiles fetching the products", e),
        )
        .finally(() => console.log("Data requested successfullt"));
    },
    1000,
    [marketStore.getState().products, chunckStore.getState().updates],
  );

  const handleScroll = () => {
    if (scrollRef.current) {
      sessionStorage.setItem(SCROLL_KEY, String(scrollRef.current.scrollTop));
    }
  };

  useEffect(() => {
    if (!alert) return;
    const id = setTimeout(() => setAlert(null), 2000);
    return () => clearTimeout(id);
  }, [alert]);

  const handleAddToCart = (product: MarketStoreProduct) => {
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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MarketLoading />
      </div>
    );
  }

  const handleActiveCat = (idx: number) => {
    setActiveCat(idx);
  };

  const handleSearch = (e: ChangeEvent) => {
    setQuery((e.currentTarget as HTMLInputElement).value ?? "");
  };

  if (filterProduct.length <= 0) {
    return (
      <div
        style={{
          width: "100%",
          flex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ban color="grey"/>
        <span style={{color: 'GrayText'}}>Nothing on the market Yet</span>
      </div>
    );
  }
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
          gap: "1rem",
          overflowY: "auto",
        }}
      >
        <Bilboards />

        {/* {Product Section}>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> */}
        <div style={{ display: "flex", width: "100%" }}>
          <input
            placeholder="Search Products..."
            style={{
              width: "100%",
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              padding: ".5rem",
              borderRadius: "1rem",
            }}
            onChange={handleSearch}
            onFocus={() => setIsSearch(true)}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            width: "100%",
            overflowX: "auto",
            flex: "0 0 auto",
          }}
        >
          {categories.map((cat, idx) => (
            <button
              key={idx}
              style={{
                padding: ".5rem 1rem",
                borderRadius: "3rem",
                border: "1px solid var(--border-default)",
                flex: "0 0 auto",
                cursor: "pointer",
                background: activeCat == idx ? "var(--bg-nav-active)" : "",
                color:
                  activeCat == idx
                    ? "var(--bg-surface)"
                    : "var(--text-primary)",
                transition: "background .4s ease",
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
        {chunckStore.getState().isProductLoading ? (
          <MarketLoading info="Loading Products ..." />
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

        {!isSearch && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-around",
              marginBlockStart: "auto",
            }}
          >
            <button
              className="click"
              style={{
                display: "flex",

                borderRadius: "1rem",
                background:
                  chunckStore.getState().isProductLoading ||
                  chunckStore.getState().updates <= 0
                    ? "grey"
                    : "var(--bg-nav-active)",
                padding: "1rem",
                justifyContent: "center",
                cursor:
                  chunckStore.getState().isProductLoading ||
                  chunckStore.getState().updates <= 0
                    ? "not-allowed"
                    : "pointer",
                alignItems: "center",
                gap: ".4rem",
              }}
              disabled={
                chunckStore.getState().isProductLoading ||
                chunckStore.getState().updates <= 0
              }
              onClick={() =>
                updateChunck({
                  start: chunckStore.getState().start - chunckSize,
                  end: chunckStore.getState().end - chunckSize,
                  updates: chunckStore.getState().updates - 1,
                  isProductLoading: true,
                })
              }
            >
              <ArrowLeft color="var(--bg-surface)" />
              <span style={{ color: "var(--bg-surface)" }}>
                Previous Products
              </span>
            </button>

            <button
              className="click"
              style={{
                display: "flex",

                borderRadius: "1rem",
                background:
                  chunckStore.getState().isProductLoading ||
                  chunckStore.getState().end > baseProducts.length
                    ? "grey"
                    : "var(--bg-nav-active)",
                padding: "1rem",
                justifyContent: "center",
                cursor:
                  chunckStore.getState().isProductLoading ||
                  chunckStore.getState().end > baseProducts.length
                    ? "not-allowed"
                    : "pointer",
                alignItems: "center",
                gap: ".4rem",
              }}
              disabled={
                chunckStore.getState().isProductLoading ||
                chunckStore.getState().end > baseProducts.length
              }
              onClick={() =>
                updateChunck({
                  start: chunckStore.getState().end,
                  end: chunckStore.getState().end + chunckSize,
                  updates: chunckStore.getState().updates + 1,
                  isProductLoading: true,
                })
              }
            >
              <span style={{ color: "var(--bg-surface)" }}>Next Products</span>
              <ArrowRight color="var(--bg-surface)" />
            </button>
          </div>
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
