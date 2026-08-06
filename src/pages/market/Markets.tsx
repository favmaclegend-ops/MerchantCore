import { useStore } from "elk-components";
import { marketStore } from "./demoMarketStore";
import type { MarketStoreProduct } from "./demoMarketStore";
import { Bilboards } from "./components/Bilboards";
import { MarketLoading } from "./components/MarketLoading";
import { ProductInfoPanel } from "./components/ProductInfoPanel";
import { useMarketData } from "./useMarketData";
import { useState, type ChangeEvent, useRef, useEffect } from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";

type formatValue = string;

const valueFormater = (value: formatValue, fixed: number = 2) => {
  const parseValue = parseFloat(value);
  if (!parseValue) return "NAN";
  if (parseValue >= 1000000000000)
    return `${(parseValue / 1000000000).toFixed(fixed)}T`;
  if (parseValue >= 1000000000)
    return `${(parseValue / 1000000000).toFixed(fixed)}B`;
  if (parseValue >= 1000000) return `${(parseValue / 1000000).toFixed(fixed)}M`;
  if (parseValue >= 1000) return `${(parseValue / 1000).toFixed(fixed)}K`;
  else return `${parseValue.toFixed(fixed)}`;
};

export function Markets() {
  const { loading } = useMarketData();
  const state = useStore(marketStore);
  const products = state.products;
  const categories = state.catergories ?? [];
  const [activeCat, setActiveCat] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MarketStoreProduct | null>(null);
  const bp = useBreakpoint();

  const scrollRef = useRef<HTMLDivElement>(null);
  const SCROLL_KEY = "markets-scroll";

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

  const handleScroll = () => {
    if (scrollRef.current) {
      sessionStorage.setItem(SCROLL_KEY, String(scrollRef.current.scrollTop));
    }
  };

  const baseProducts =
    categories[activeCat] === "All"
      ? products
      : products.filter((p) => p.category === categories[activeCat]);

  const filterProduct =
    query.trim() === ""
      ? baseProducts
      : baseProducts.filter(
          (p) =>
            p.product_name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase()) ||
            (p.keywords?.includes(query.toLowerCase()) ?? false),
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
          overflowY: 'auto'
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
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            width: "100%",
            overflowX: "auto",
            flex: '0 0 auto'
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
              onClick={() => handleActiveCat(idx)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:  bp.xxsm ? '1fr' : bp.sm ? '1fr 1fr':`repeat(auto-fit, minmax(190px, ${filterProduct.length <= 3 ? "300px" : ".5fr"})`,
            width: "100%",
            gap: "1rem",

          }}
        >
          {filterProduct.map((product) => (
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
              </div>

              <div>
                <div>
                  <h2>{product.product_name}</h2>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <strong>NLE{valueFormater(product.product_price)}</strong>
                  <strong style={{ color: "gold", marginInlineStart: "auto" }}>
                    {valueFormater(product.product_rating)}
                  </strong>
                </div>
              </div>
              <div>
                <button
                  style={{
                    width: "100%",
                    padding: ".4rem",
                    borderRadius: ".5rem",
                    background: "var(--bg-nav-active)",
                    cursor: "pointer",
                  }}
                  className="click"
                >
                  <span style={{ color: "var(--bg-surface)" }}>
                    Add to Cart
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedProduct && (
        <ProductInfoPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
