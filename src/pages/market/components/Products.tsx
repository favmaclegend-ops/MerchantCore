import { useState } from "react";
import { useParams } from "react-router-dom";
import { Package, Plus, Search, ShoppingCart, Star } from "lucide-react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useStore } from "elk-components";
import { marketStore } from "../demoMarketStore";
import type { MarketStoreProduct } from "../demoMarketStore";
import { valueFormater } from "../market";
import { getProductRatingFigure } from "../productRatings";
import { addToMarketCart } from "../cart";
import { ProductInfoPanel } from "./ProductInfoPanel";
import { UploadToShopModal } from "./UploadToShopModal";
import { useShopOwner } from "../useShopOwner";
import Alert from "@/components/alert/alert";
import { GracefulImage } from "@/components/GracefulImage";

export function Products() {
  const params = useParams();
  const bp = useBreakpoint();
  const { shops, products } = useStore(marketStore);
  const shop = shops[params.id ?? ""];
  const { isOwner, isMyInventoryProduct } = useShopOwner();
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MarketStoreProduct | null>(null);
  const [alert, setAlert] = useState<{ message: string; type: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  if (!shop) return null;

  const handleAddToCart = (product: MarketStoreProduct) => {
    if (addToMarketCart(product)) {
      setAlert({ message: `${product.product_name} added to cart`, type: "success" });
    } else {
      setAlert({ message: `${product.product_name} is out of stock`, type: "error" });
    }
  };

  const shopProducts = products.filter(
    (p) => p.group_id === shop.shop_id || p.group_id === shop.product_id,
  );

  const filtered =
    query.trim() === ""
      ? shopProducts
      : shopProducts.filter(
          (p) =>
            p.product_name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <Package size={20} color="var(--text-info)" />
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: "bolder",
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
            }}
          >
            Products
          </h2>
          <span
            style={{
              fontSize: ".8rem",
              fontWeight: 600,
              padding: ".2rem .6rem",
              borderRadius: "3rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              color: "var(--text-muted)",
            }}
          >
            {shopProducts.length}
          </span>
        </div>

        {isOwner(shop) && (
          <button
            className="click"
            onClick={() => setShowUpload(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".35rem",
              padding: ".5rem .9rem",
              borderRadius: "3rem",
              cursor: "pointer",
              background: "var(--bg-nav-active)",
              border: "none",
              color: "var(--bg-surface)",
              fontSize: ".8rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <Plus size={16} color="var(--bg-surface)" />
            Add new items
          </button>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
            marginInlineStart: "auto",
            flex: "1",
            maxWidth: "280px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "1rem",
            padding: ".5rem .75rem",
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
              fontSize: ".9rem",
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: ".5rem",
            padding: "3rem 1rem",
            color: "var(--text-muted)",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "1rem",
          }}
        >
          <Package size={32} color="var(--text-placeholder)" />
          <strong style={{ color: "var(--text-primary)" }}>
            No products found
          </strong>
          <span style={{ fontSize: ".85rem" }}>
            {shop.shop_name} has no products matching your search.
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
                : "repeat(auto-fill, minmax(190px, 1fr))",
            width: "100%",
            gap: "1rem",
          }}
        >
          {filtered.map((product) => (
            <div
              key={product.product_id}
              className="click"
              onClick={() => setSelectedProduct(product)}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                width: "100%",
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

              <div style={{ minWidth: "0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                  <h2
                    style={{
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
                </div>
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
                      color: "gold",
                      fontSize: ".85rem",
                      marginInlineStart: "auto",
                    }}
                  >
                    <Star size={14} />
                    {valueFormater(getProductRatingFigure(product))}
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
                  opacity: product.inStock ? 1 : .5,
                }}
              >
                <ShoppingCart size={16} color="var(--bg-surface)" />
                <span style={{ color: "var(--bg-surface)", fontWeight: 600 }}>
                  Add to Cart
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
      {selectedProduct && (
        <ProductInfoPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      {alert && <Alert message={alert.message} type={alert.type} />}
      {showUpload && (
        <UploadToShopModal onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}
