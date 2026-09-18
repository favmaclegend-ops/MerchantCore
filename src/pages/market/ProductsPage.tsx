import { useState } from "react";
import { useStore } from "elk-components";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Ban, Search, ShoppingCart, Star } from "lucide-react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { marketStore } from "./demoMarketStore";
import type { MarketStoreProduct } from "./demoMarketStore";
import { valueFormater } from "./market";
import { getProductRatingFigure } from "./productRatings";
import { addToMarketCart } from "./cart";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ProductInfoPanel } from "./components/ProductInfoPanel";
import { GracefulImage } from "@/components/GracefulImage";

export function ProductsPage() {
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const { requireAuth } = useRequireAuth();
  const { products, catergories } = useStore(marketStore);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState(0);
  const [selectedProduct, setSelectedProduct] =
    useState<MarketStoreProduct | null>(null);

  const categories = catergories ?? ["All"];

  const handleAddToCart = (product: MarketStoreProduct) => {
    if (!requireAuth()) return;
    addToMarketCart(product);
  };

  const baseProducts =
    categories[activeCat] === "All"
      ? products
      : products.filter((p) => p.category === categories[activeCat]);

  const filtered =
    query.trim() === ""
      ? baseProducts
      : baseProducts.filter(
          (p) =>
            p.product_name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          paddingTop: "var(--safe-top)",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          gap: ".7rem",
          paddingBottom: ".85rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          borderBottom: "1px solid var(--border-default)",
          background: "var(--bg-nav)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".75rem",
            width: "100%",
          }}
        >
          <button
            className="click"
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: ".4rem",
              borderRadius: "50%",
              cursor: "pointer",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            <Package size={18} color="var(--text-info)" />
            <h1
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
              }}
            >
              Products
            </h1>
            <span
              style={{
                fontSize: ".75rem",
                fontWeight: 600,
                padding: ".15rem .5rem",
                borderRadius: "3rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                color: "var(--text-muted)",
              }}
            >
              {products.length}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
            width: "100%",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: ".75rem",
            padding: ".55rem .75rem",
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--text-primary)",
              fontSize: ".85rem",
            }}
          />
        </div>

        {categories.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: ".5rem",
              alignItems: "center",
              width: "100%",
              overflowX: "auto",
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
                  background:
                    activeCat == idx ? "var(--bg-nav-active)" : "transparent",
                  color:
                    activeCat == idx ? "var(--bg-surface)" : "var(--text-primary)",
                  transition: "background .3s ease, color .3s ease",
                }}
                onClick={() => setActiveCat(idx)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: bp.lg ? "1.5rem 1rem" : "1rem",
        }}
      >
        {products.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: ".5rem",
              padding: "4rem 0",
              color: "var(--text-muted)",
            }}
          >
            <Ban size={28} color="var(--text-placeholder)" />
            <span style={{ fontSize: ".9rem" }}>No products listed yet.</span>
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: ".5rem",
              padding: "4rem 0",
              color: "var(--text-muted)",
            }}
          >
            <Ban size={28} color="var(--text-placeholder)" />
            <span style={{ fontSize: ".9rem" }}>
              No products found for this search or category.
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: bp.lg
                ? "repeat(auto-fill, minmax(220px, 1fr))"
                : "repeat(auto-fill, minmax(min(100%, 160px), 1fr))",
              gap: bp.lg ? "1rem" : ".75rem",
            }}
          >
            {filtered.map((product) => {
              const rating = parseFloat(getProductRatingFigure(product) || "0") || 0;
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
                    contentVisibility: "auto",
                    containIntrinsicSize: "250px",
                    padding: "1rem",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "1rem",
                    boxShadow: "var(--shadow-card)",
                    gap: ".5rem",
                    minWidth: "0",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      borderRadius: ".75rem",
                      height: "8rem",
                      background:
                        "linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <GracefulImage
                      src={product.productImageUrl}
                      alt={product.product_name}
                    />
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

                  <div style={{ minWidth: "0" }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1rem",
                        fontWeight: "bolder",
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {product.product_name}
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        marginTop: ".25rem",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "1rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        NLE{valueFormater(product.product_price)}
                      </strong>
                      <strong
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: ".2rem",
                          color: "var(--text-warning)",
                          fontSize: ".85rem",
                          marginInlineStart: "auto",
                        }}
                      >
                        <Star size={14} fill="currentColor" />
                        {rating.toFixed(1)}
                      </strong>
                    </div>
                  </div>

                  <button
                    className="click"
                    disabled={!product.inStock}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    style={{
                      width: "100%",
                      padding: ".6rem",
                      borderRadius: ".75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: ".5rem",
                      cursor: product.inStock ? "pointer" : "not-allowed",
                      background: product.inStock
                        ? "var(--bg-nav-active)"
                        : "var(--text-placeholder)",
                      border: "none",
                      opacity: product.inStock ? 1 : 0.5,
                    }}
                  >
                    <ShoppingCart size={16} color="var(--bg-surface)" />
                    <span style={{ color: "var(--bg-surface)", fontWeight: 600 }}>
                      Add to Cart
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductInfoPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}