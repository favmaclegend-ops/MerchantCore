import { Star } from "lucide-react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { valueFormater } from "../market";
import type { MarketService } from "../servicesStore";

export function MarketServiceCard({
  service,
  onClick,
}: {
  service: MarketService;
  onClick?: () => void;
}) {
  const bp = useBreakpoint();
  const stars = Math.round(Math.max(0, Math.min(5, service.rating)));

  return (
    <div
      className={onClick ? "click" : undefined}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        width: bp.lg ? "240px" : "205px",
        minWidth: bp.lg ? "240px" : "205px",
        borderRadius: "1rem",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-sm)",
        height: '100%'
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "8.25rem",
          overflow: "hidden",
          background: "var(--bg-tertiary)",
        }}
      >
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
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
        {service.offer && (
          <span
            style={{
              position: "absolute",
              top: ".6rem",
              left: ".6rem",
              fontSize: ".7rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".04em",
              padding: ".3rem .7rem",
              borderRadius: "3rem",
              background: "rgba(2,6,23,.6)",
              color: "#fff",
              maxWidth: "80%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {service.offer}
          </span>
        )}
        {service.shop_name && (
          <span
            style={{
              position: "absolute",
              bottom: ".6rem",
              left: ".6rem",
              fontSize: ".65rem",
              fontWeight: 700,
              letterSpacing: ".04em",
              padding: ".25rem .6rem",
              borderRadius: "3rem",
              background: "rgba(2,6,23,.55)",
              color: "#fff",
            }}
          >
            {service.shop_name}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: ".35rem",
          padding: ".7rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={13}
              fill={i < stars ? "var(--text-warning)" : "transparent"}
              color={i < stars ? "var(--text-warning)" : "var(--border-default)"}
            />
          ))}
          <span style={{ fontSize: ".7rem", color: "var(--text-muted)" }}>
            {service.rating.toFixed(1)}
          </span>
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: ".9rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {service.name}
        </h3>

        {service.description && (
          <p
            style={{
              margin: 0,
              fontSize: ".78rem",
              color: "var(--text-secondary)",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineClamp: 2,
              overflow: "hidden",
            }}
          >
            {service.description}
          </p>
        )}

        <span
          style={{
            fontSize: ".9rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            marginTop: ".15rem",
          }}
        >
          NLE{valueFormater(String(service.price))}
        </span>
      </div>
    </div>
  );
}
