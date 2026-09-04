import { useDebounceEffect } from "elk-components";
import { useState } from "react";
import { Ban, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { api } from "@/lib/api";
import { adaptProduct } from "../marketApi";
import type { MarketStoreProduct } from "../demoMarketStore";
import type { MarketService } from "../servicesStore";
import { MarketServiceCard } from "./MarketServiceCard";
import { marketBasePath } from "../market";

interface SearchState {
  products: MarketStoreProduct[];
  services: MarketService[];
  loading: boolean;
}

function adaptService(raw: Record<string, unknown>): MarketService {
  return {
    id: String(raw.id ?? ""),
    shop_id: String(raw.shop_id ?? ""),
    shop_name: raw.shop_name ? String(raw.shop_name) : undefined,
    source_id: raw.source_id ? String(raw.source_id) : null,
    name: String(raw.name ?? ""),
    price: Number(raw.price ?? 0),
    offer: raw.offer ? String(raw.offer) : null,
    description: raw.description ? String(raw.description) : null,
    image_url: String(raw.image_url ?? ""),
    rating: Number(raw.rating ?? 0),
    created_at: raw.created_at ? String(raw.created_at) : null,
  };
}

export function ServerSearchResults({ query }: { query: string }) {
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const [state, setState] = useState<SearchState>({
    products: [],
    services: [],
    loading: false,
  });

  useDebounceEffect(
    () => {
      const q = query.trim();
      if (!q) return;
      let active = true;
      setState({ products: [], services: [], loading: true });
      Promise.all([
        api.market.getProducts(undefined, q, 1, 22),
        api.market.getServices(q, 1, 30),
      ])
        .then(([prodRes, servRes]) => {
          if (!active) return;
          setState({
            products: (prodRes.products ?? []).map((p) => adaptProduct(p)),
            services: (servRes.services ?? []).map(adaptService),
            loading: false,
          });
        })
        .catch(() => {
          if (!active) return;
          setState({ products: [], services: [], loading: false });
        });
      return () => {
        active = false;
      };
    },
    400,
    [query],
  );

  if (!query.trim()) return null;

  const total = state.products.length + state.services.length;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: bp.lg ? "0" : "0 1rem",
      }}
    >
      {state.loading ? (
        <div
          style={{
            width: "100%",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: ".5rem",
            padding: "4rem 0",
            color: "var(--text-muted)",
            fontSize: ".9rem",
          }}
        >
          <Sparkles size={18} className="spin" /> Searching the market...
        </div>
      ) : total === 0 ? (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: ".5rem",
            padding: "4rem 0",
            color: "var(--text-muted)",
          }}
        >
          <Ban size={28} color="var(--text-placeholder)" />
          <span style={{ fontSize: ".9rem" }}>No results for "{query}"</span>
        </div>
      ) : (
        <>
          {state.services.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ".6rem",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                <Sparkles size={18} color="var(--text-info)" />
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                  }}
                >
                  Services
                </h3>
                <span style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>
                  {state.services.length}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: ".85rem",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  paddingBottom: ".5rem",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {state.services.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      flexShrink: 0,
                      scrollSnapAlign: "start",
                    }}
                  >
                    <MarketServiceCard
                      service={s}
                      onClick={() => navigate(`${marketBasePath()}/services/${s.id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.products.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: bp.lg
                  ? "repeat(auto-fit, minmax(190px, .5fr))"
                  : "repeat(auto-fill, minmax(min(100%, 160px), 1fr))",
                width: "100%",
                gap: "1rem",
              }}
            >
              {state.products.map((product) => (
                <div
                  key={product.product_id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    borderRadius: "1rem",
                    overflow: "hidden",
                    background: "var(--bg-nav)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "8rem",
                      overflow: "hidden",
                      background: "var(--bg-tertiary)",
                    }}
                  >
                    {product.productImageUrl ? (
                      <img
                        src={product.productImageUrl}
                        alt={product.product_name}
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
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: ".3rem",
                      padding: ".75rem",
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: ".85rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {product.product_name}
                    </h4>
                    <span
                      style={{
                        fontSize: ".9rem",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                      }}
                    >
                      NLE{product.product_price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
