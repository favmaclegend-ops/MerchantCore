import { useStore } from "elk-components";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Sparkles, Ban } from "lucide-react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { MarketServiceCard } from "./components/MarketServiceCard";
import { fetchMarketServices, marketServicesStore } from "./servicesStore";

export function ServicesPage() {
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const { items, loading, error } = useStore(marketServicesStore);

  useEffect(() => {
    if (!marketServicesStore.getState().loaded) fetchMarketServices();
  }, []);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
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
          alignItems: "center",
          gap: ".75rem",
          paddingBottom: ".85rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          borderBottom: "1px solid var(--border-default)",
          background: "var(--bg-nav)",
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
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <Sparkles size={18} color="var(--text-info)" />
          <h1
            style={{
              margin: 0,
              fontSize: "1.05rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            Services
          </h1>
        </div>
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
        {loading && items.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
              padding: "4rem 0",
              color: "var(--text-muted)",
              fontSize: ".9rem",
            }}
          >
            <Sparkles size={18} className="spin" /> Loading services...
          </div>
        ) : items.length === 0 ? (
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
              {error ? "Could not load services." : "No services listed yet."}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: bp.lg
                ? "repeat(auto-fill, minmax(270px, 1fr))"
                : "repeat(auto-fill, minmax(min(100%, 230px), 1fr))",
              gap: "1rem",
            }}
          >
            {items.map((service) => (
              <div key={service.id} style={{ justifyContent: "center", display: "flex" }}>
                <MarketServiceCard
                  service={service}
                  onClick={() => navigate(`/market/services/${service.id}`)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
