import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Star,
  Store,
  X,
} from "lucide-react";
import type { MarketStoreProduct } from "../demoMarketStore";
import { marketStore } from "../demoMarketStore";
import {
  formatDate,
  getProductImages,
  resolveShopForProduct,
  valueFormater,
} from "../market";
import {
  getProductRatings,
  setProductRating,
  type StarRating,
} from "../productRatings";
import { useShopOwner } from "../useShopOwner";
import { addToMarketCart } from "../cart";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { GracefulImage } from "@/components/GracefulImage";

export function ProductInfoPanel({
  product,
  onClose,
}: {
  product: MarketStoreProduct;
  onClose: () => void;
}) {
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const { ownerKey } = useShopOwner();
  const images = useMemo(() => getProductImages(product), [product]);
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const [ratings, setRatings] = useState(() =>
    getProductRatings(product, ownerKey),
  );
  const [hovered, setHovered] = useState<StarRating | null>(null);

  const safeIndex = images.length ? index % images.length : 0;

  const shop = useMemo(
    () => resolveShopForProduct(marketStore.getState().shops, product),
    [product],
  );

  const maxCount = Math.max(...ratings.levels.map((l) => l.count), 1);

  const handleRate = (star: StarRating) => {
    setProductRating(product.product_id, ownerKey, star);
    setRatings(getProductRatings(product, ownerKey));
    setHovered(null);
  };

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!images.length) return;
      setIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleShopClick = () => {
    if (!shop) return;
    onClose();
    navigate(`/home/market/${shop.shop_id}`);
  };

  const handleAddToCart = () => {
    if (!addToMarketCart(product)) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(2,6,23,.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: bp.sm ? ".5rem" : "1.5rem",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "1.25rem",
          overflow: "hidden",
          boxShadow: "var(--shadow-menu)",
          position: "relative",
        }}
      >
        <button
          className="click"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: ".75rem",
            right: ".75rem",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: ".4rem",
            borderRadius: "50%",
            cursor: "pointer",
            background: "rgba(2,6,23,.5)",
            border: "none",
            backdropFilter: "blur(4px)",
          }}
        >
          <X size={18} color="var(--bg-surface)" />
        </button>

        <div
          style={{
            position: "relative",
            width: "100%",
            height: bp.sm ? "14rem" : "18rem",
            background: "var(--bg-tertiary)",
            overflow: "hidden",
            touchAction: "pan-y",
          }}
          onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX == null) return;
            const delta = e.changedTouches[0].clientX - touchX;
            if (delta > 40) go(-1);
            else if (delta < -40) go(1);
            setTouchX(null);
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              transform: `translateX(-${safeIndex * 100}%)`,
              transition: "transform .4s ease",
            }}
          >
            {images.length ? (
              images.map((src) => (
                <GracefulImage
                  key={src}
                  src={src}
                  alt={product.product_name}
                  wrapperStyle={{ flex: "0 0 100%" }}
                />
              ))
            ) : (
              <div
                style={{
                  flex: "0 0 100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-placeholder)",
                }}
              >
                No image available
              </div>
            )}
          </div>

          {images.length > 1 && (
            <>
              <button
                className="click"
                onClick={() => go(-1)}
                aria-label="Previous image"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: ".75rem",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: ".4rem",
                  borderRadius: "50%",
                  cursor: "pointer",
                  background: "rgba(2,6,23,.5)",
                  border: "none",
                  backdropFilter: "blur(4px)",
                }}
              >
                <ChevronLeft size={20} color="var(--bg-surface)" />
              </button>
              <button
                className="click"
                onClick={() => go(1)}
                aria-label="Next image"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: ".75rem",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: ".4rem",
                  borderRadius: "50%",
                  cursor: "pointer",
                  background: "rgba(2,6,23,.5)",
                  border: "none",
                  backdropFilter: "blur(4px)",
                }}
              >
                <ChevronRight size={20} color="var(--bg-surface)" />
              </button>

              <div
                style={{
                  position: "absolute",
                  bottom: ".75rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                }}
              >
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Go to image ${i + 1}`}
                    style={{
                      width: i === safeIndex ? "1.4rem" : ".5rem",
                      height: ".5rem",
                      borderRadius: "3rem",
                      border: "none",
                      cursor: "pointer",
                      background:
                        i === safeIndex
                          ? "var(--bg-surface)"
                          : "rgba(255,255,255,.5)",
                      transition: "width .3s ease",
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            padding: "1.25rem",
            overflowY: "auto",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
              <span
                style={{
                  fontSize: ".7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                  padding: ".2rem .6rem",
                  borderRadius: "3rem",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-muted)",
                }}
              >
                {product.category}
              </span>
              <span
                style={{
                  fontSize: ".7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
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
            <h2
              style={{
                marginTop: ".5rem",
                fontSize: "1.35rem",
                fontWeight: "bolder",
                color: "var(--text-primary)",
                lineHeight: 1.25,
              }}
            >
              {product.product_name}
            </h2>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", marginTop: ".25rem" }}>
              <strong style={{ fontSize: "1.4rem", color: "var(--text-primary)" }}>
                NLE{valueFormater(product.product_price)}
              </strong>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".25rem",
                  fontSize: ".9rem",
                  color: "var(--text-muted)",
                }}
              >
                <CalendarDays size={14} />
                Uploaded {formatDate(product.uploadedAt)}
              </span>
            </div>
          </div>

          <p
            style={{
              margin: 0,
              color: "var(--text-secondary)",
              fontSize: ".95rem",
              lineHeight: 1.6,
            }}
          >
            {product.description ?? "No description provided for this product."}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: ".5rem",
              padding: "1rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
              borderRadius: "1rem",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: ".85rem",
                fontWeight: "bold",
                color: "var(--text-primary)",
              }}
            >
              Ratings & reviews
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".2rem",
                }}
                role="radiogroup"
                aria-label="Rate this product"
              >
                {([1, 2, 3, 4, 5] as StarRating[]).map((star) => {
                  const active = (hovered ?? ratings.userRating ?? 0) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => handleRate(star)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: "0 .1rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        color: "gold",
                        transform: hovered === star ? "scale(1.1)" : "scale(1)",
                        transition: "transform .15s ease",
                      }}
                    >
                      <Star
                        size={22}
                        strokeWidth={active ? 0 : 2}
                        fill={active ? "gold" : "none"}
                      />
                    </button>
                  );
                })}
              </div>
              <strong style={{ fontSize: ".95rem", color: "var(--text-primary)" }}>
                {ratings.count > 0
                  ? `${ratings.average.toFixed(1)} / 5`
                  : "No ratings yet"}
              </strong>
            </div>

            <span
              style={{
                fontSize: ".8rem",
                color: "var(--text-muted)",
              }}
            >
              {ratings.userRating
                ? `Your rating: ${ratings.userRating} / 5`
                : "Tap a star to rate this product"}
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: ".35rem" }}>
              {ratings.levels.map((level) => (
                <div
                  key={level.star}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                    fontSize: ".8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span
                    style={{
                      flex: "0 0 2.2rem",
                      display: "flex",
                      alignItems: "center",
                      gap: ".15rem",
                    }}
                  >
                    {level.star} <Star size={11} color="gold" fill="gold" />
                  </span>
                  <div
                    style={{
                      flex: "1",
                      height: ".45rem",
                      borderRadius: "3rem",
                      background: "var(--bg-tertiary)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(level.count / maxCount) * 100}%`,
                        borderRadius: "3rem",
                        background: "gold",
                      }}
                    />
                  </div>
                  <span style={{ flex: "0 0 3.5rem", textAlign: "right" }}>
                    {level.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            className="click"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
              width: "100%",
              padding: ".85rem",
              borderRadius: "1rem",
              cursor: product.inStock ? "pointer" : "not-allowed",
              background: product.inStock
                ? "var(--bg-nav-active)"
                : "var(--text-placeholder)",
              border: "none",
              opacity: product.inStock ? 1 : 0.5,
            }}
          >
            <ShoppingCart size={18} color="var(--bg-surface)" />
            <span style={{ color: "var(--bg-surface)", fontWeight: 600 }}>
              {added
                ? "Added to Cart"
                : product.inStock
                  ? "Add to Cart"
                  : "Sold out"}
            </span>
          </button>

          <button
            className="click"
            onClick={handleShopClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
              width: "100%",
              padding: ".85rem",
              borderRadius: "1rem",
              cursor: "pointer",
              background: "var(--bg-nav-active)",
              border: "none",
            }}
          >
            <Store size={18} color="var(--bg-surface)" />
            <span style={{ color: "var(--bg-surface)", fontWeight: 600 }}>
              Visit {shop ? shop.shop_name : product.shop_name}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
