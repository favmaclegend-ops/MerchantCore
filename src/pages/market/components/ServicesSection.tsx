import { useStore } from "elk-components";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { MarketServiceCard } from "./MarketServiceCard";
import { fetchMarketServices, marketServicesStore } from "../servicesStore";
import { marketBasePath } from "../market";

export const SERVICES_PANEL_MAX = 6;

export function ServicesSection() {
  const navigate = useNavigate();
  const { items, loading, loaded } = useStore(marketServicesStore);

  useEffect(() => {
    if (!loaded) fetchMarketServices();
  }, [loaded]);

  if (!loading && !loaded && items.length === 0) return null;
  if (items.length === 0) return null;

  const visible = items.slice(0, SERVICES_PANEL_MAX);
  const total = items.length;

  return (
    <section
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: ".6rem",
        padding: "1rem 0",
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
          <Sparkles size={18} color="var(--text-info)" />
          <h2
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            Services
          </h2>
        </div>
        {total > SERVICES_PANEL_MAX && (
          <button
            className="click"
            onClick={() => navigate(`${marketBasePath()}/services`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".2rem",
              padding: ".35rem .7rem",
              borderRadius: "3rem",
              cursor: "pointer",
              border: "1px solid var(--border-info)",
              background: "var(--bg-nav)",
              color: "var(--text-info)",
              fontSize: ".78rem",
              fontWeight: 700,
            }}
          >
            Explore More
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: ".85rem",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          padding: "0 1rem .5rem",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {visible.map((service) => (
          <div
            key={service.id}
            style={{
              scrollSnapAlign: "start",
              flexShrink: 0,
              contentVisibility: "auto",
              containIntrinsicSize: "290px",
            }}
          >
            <MarketServiceCard
              service={service}
              onClick={() => navigate(`${marketBasePath()}/services/${service.id}`)}
            />
          </div>
        ))}
        {total > SERVICES_PANEL_MAX && (
          <button
            className="click"
            onClick={() => navigate(`${marketBasePath()}/services`)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
              minWidth: "150px",
              width: "150px",
              borderRadius: "1rem",
              cursor: "pointer",
              border: "1px dashed var(--border-info)",
              background: "var(--bg-surface)",
              color: "var(--text-info)",
              fontSize: ".85rem",
              fontWeight: 700,
              alignSelf: "stretch",
            }}
          >
            <Sparkles size={22} />
            Explore all services
          </button>
        )}
      </div>
    </section>
  );
}
