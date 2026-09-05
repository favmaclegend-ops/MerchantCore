import { useState } from "react";
import { useStore } from "elk-components";
import { useNavigate } from "react-router-dom";
import { Package, ChevronRight, Star } from "lucide-react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { marketStore } from "../demoMarketStore";
import type { MarketStoreProduct } from "../demoMarketStore";
import { marketBasePath, valueFormater } from "../market";
import { getProductRatingFigure } from "../productRatings";
import { ProductInfoPanel } from "./ProductInfoPanel";

export const PRODUCTS_PANEL_MAX = 6;

export function ProductsSection() {
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const { products } = useStore(marketStore);
  const [selected, setSelected] = useState<MarketStoreProduct | null>(null);

  if (products.length === 0) return null;

  const featured = [...products]
    .sort(
      (a, b) =>
        parseFloat(b.product_rating || "0") - parseFloat(a.product_rating || "0"),
    )
    .slice(0, PRODUCTS_PANEL_MAX);

  return (
    <section
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: ".8rem",
        padding: "1rem 0 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: ".5rem",
          padding: "0 1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <Package size={18} color="var(--text-info)" />
          <h2
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            Top Featured Products
          </h2>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: bp.lg
            ? "repeat(3, 1fr)"
            : "repeat(auto-fill, minmax(min(100%, 155px), 1fr))",
          gap: ".75rem",
          padding: "0 1rem",
        }}
      >
        {featured.map((product) => {
          const rating = parseFloat(getProductRatingFigure(product) || "0") || 0;
          return (
            <div
              key={product.product_id}
              className="click"
              onClick={() => setSelected(product)}
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                minWidth: "0",
                borderRadius: "1rem",
                overflow: "hidden",
                cursor: "pointer",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-sm)",
                contentVisibility: "auto",
                containIntrinsicSize: "245px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: bp.sm ? "7rem" : "8.5rem",
                  overflow: "hidden",
                  background: "var(--bg-tertiary)",
                }}
              >
                {product.productImageUrl ? (
                  <img
                    src={product.productImageUrl}
                    alt={product.product_name}
                    draggable={false}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                      display: "block",
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
                    fontSize: ".62rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                    padding: ".22rem .55rem",
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

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: ".3rem",
                  padding: ".6rem .7rem .7rem",
                  flex: 1,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: ".82rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {product.product_name}
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: ".4rem",
                    marginTop: "auto",
                  }}
                >
                  <span
                    style={{
                      fontSize: ".85rem",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                    }}
                  >
                    NLE{valueFormater(product.product_price)}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".2rem",
                      fontSize: ".72rem",
                      color: "var(--text-warning)",
                      fontWeight: 700,
                    }}
                  >
                    <Star size={12} fill="currentColor" />
                    {rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "0 1rem" }}>
        <button
          className="click"
          onClick={() => navigate(`${marketBasePath()}/products`)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: ".4rem",
            width: "100%",
            maxWidth: "380px",
            padding: ".65rem 1rem",
            borderRadius: "3rem",
            cursor: "pointer",
            border: "none",
            background: "var(--bg-nav-active)",
            color: "var(--bg-surface)",
            fontSize: ".85rem",
            fontWeight: 700,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          Browse Products
          <ChevronRight size={16} />
        </button>
      </div>

      {selected && (
        <ProductInfoPanel product={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}