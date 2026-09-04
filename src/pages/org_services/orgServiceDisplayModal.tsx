import { X, Tag, DollarSign, Hash, Building2, CircleDot, Star, Clock } from "lucide-react";
import { extractFirstLetter, serviceStore, formatRelativeTime } from "./service_demo";
import { valueFormater } from "../market/market";
import { CurrencyContext } from "@/context";
import { useContext, useEffect, useCallback } from "react";

interface OrgServiceDisplayModalProp {
  serviceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRender?: (serviceId: string) => void;
}

export default function OrgServiceDisplayModal({
  serviceId,
  isOpen,
  onClose,
  onRender,
}: OrgServiceDisplayModalProp) {
  const { currency } = useContext(CurrencyContext);

  const service = serviceId
    ? serviceStore
        .getState()
        .services.find((x) => x.service_id === serviceId) ?? null
    : null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !service) return null;

  const isActive = service.status === "active";
  const isCompleted = service.status === "completed";
  const isCancelled = service.status === "cancelled";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 111,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(12px)",
        padding: "1rem",
        animation: "modalFadeIn 0.2s ease-out",
      }}
    >
      <button
        onClick={onClose}
        className="click"
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        <X size={18} color="#fff" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 520,
          maxHeight: "calc(100dvh - 2rem)",
          borderRadius: "1.25rem",
          background: "var(--bg-surface)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
          animation: "modalSlideUp 0.25s ease-out",
        }}
      >
        {/* Hero Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "clamp(9rem, 28vw, 14rem)",
            background: "linear-gradient(135deg, var(--bg-nav-active), color-mix(in srgb, var(--bg-nav-active) 70%, #000))",
            flex: "0 0 auto",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.08) 0%, transparent 60%)",
            }}
          />
          <span
            style={{
              position: "relative",
              color: "var(--bg-surface)",
              fontSize: "clamp(2.2rem, 7vw, 4rem)",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textShadow: "0 2px 12px rgba(0,0,0,0.2)",
            }}
          >
            {extractFirstLetter(service.name, true, 2)}
          </span>

          {/* Status Badge */}
          <span
            style={{
              position: "absolute",
              top: "0.85rem",
              right: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.3rem 0.7rem",
              borderRadius: "2rem",
              fontSize: "clamp(0.6rem, 1.3vw, 0.7rem)",
              fontWeight: 600,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              background: isCompleted
                ? "rgba(34, 197, 94, 0.2)"
                : isActive
                  ? "rgba(59, 130, 246, 0.2)"
                  : isCancelled
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(156, 163, 175, 0.2)",
              color: isCompleted ? "#4ade80" : isActive ? "#60a5fa" : isCancelled ? "#f87171" : "#9ca3af",
              border: `1px solid ${isCompleted ? "rgba(34, 197, 94, 0.3)" : isActive ? "rgba(59, 130, 246, 0.3)" : isCancelled ? "rgba(239, 68, 68, 0.3)" : "rgba(156, 163, 175, 0.3)"}`,
              backdropFilter: "blur(8px)",
            }}
          >
            <CircleDot size={10} />
            {isCompleted ? "Completed" : isActive ? "Active" : isCancelled ? "Cancelled" : "Inactive"}
          </span>
        </div>

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "clamp(1.25rem, 4vw, 1.75rem)",
            gap: "1.25rem",
            overflowY: "auto",
            flex: "1 1 auto",
          }}
        >
          {/* Title & Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h2
              style={{
                fontWeight: 700,
                fontSize: "clamp(1.2rem, 3.5vw, 1.6rem)",
                color: "var(--text-primary)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {service.name}
            </h2>
            <p
              style={{
                color: "var(--text-secondary, GrayText)",
                margin: 0,
                lineHeight: 1.6,
                fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
              }}
            >
              {service.description}
            </p>
          </div>

          {/* IDs Row */}
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.75rem",
                borderRadius: "0.5rem",
                background: "var(--bg-input, rgba(0,0,0,0.04))",
                border: "1px solid var(--border-input, rgba(0,0,0,0.08))",
                fontSize: "clamp(0.65rem, 1.4vw, 0.75rem)",
                color: "var(--text-secondary, #666)",
                fontFamily: "monospace",
                letterSpacing: "0.02em",
              }}
            >
              <Hash size={12} style={{ opacity: 0.5 }} />
              <span>{service.service_id}</span>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.75rem",
                borderRadius: "0.5rem",
                background: "var(--bg-input, rgba(0,0,0,0.04))",
                border: "1px solid var(--border-input, rgba(0,0,0,0.08))",
                fontSize: "clamp(0.65rem, 1.4vw, 0.75rem)",
                color: "var(--text-secondary, #666)",
                fontFamily: "monospace",
                letterSpacing: "0.02em",
              }}
            >
              <Building2 size={12} style={{ opacity: 0.5 }} />
              <span>{service.organization_id}</span>
            </div>
          </div>

          {/* Price & Pricing Type */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            {/* Price Tag */}
            <div
              style={{
                flex: "1 1 160px",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                padding: "1rem 1.1rem",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #076440, #0a8a52)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                }}
              />
              <span
                style={{
                  fontSize: "clamp(0.6rem, 1.3vw, 0.68rem)",
                  color: "rgba(255,255,255,0.65)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <DollarSign size={11} />
                Price
              </span>
              <span
                style={{
                  fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.01em",
                }}
              >
                {currency + valueFormater(service.price as unknown as string)}
              </span>
            </div>

            {/* Pricing Type Tag */}
            <div
              style={{
                flex: "1 1 120px",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                padding: "1rem 1.1rem",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: -15,
                  left: -15,
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              <span
                style={{
                  fontSize: "clamp(0.6rem, 1.3vw, 0.68rem)",
                  color: "rgba(255,255,255,0.65)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <Tag size={11} />
                Pricing Type
              </span>
              <span
                style={{
                  fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
                  fontWeight: 800,
                  color: "#fff",
                  textTransform: "capitalize",
                  letterSpacing: "-0.01em",
                }}
              >
                {service.pricing_type}
              </span>
            </div>
          </div>

          {/* Category */}
          {service.category && (
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "2rem",
                background: "var(--bg-input, rgba(0,0,0,0.04))",
                border: "1px solid var(--border-input, rgba(0,0,0,0.08))",
                fontSize: "clamp(0.7rem, 1.5vw, 0.78rem)",
                color: "var(--text-secondary, #666)",
                fontWeight: 500,
                textTransform: "capitalize",
              }}
            >
              <Tag size={12} style={{ opacity: 0.5 }} />
              {service.category}
            </div>
          )}

          {/* Rate & Created */}
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              flexWrap: "wrap",
              fontSize: "clamp(0.65rem, 1.3vw, 0.73rem)",
              color: "var(--text-secondary, #888)",
            }}
          >
            {service.rate > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <Star size={12} />
                Rate: {service.rate}
              </span>
            )}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Clock size={12} />
              Created {formatRelativeTime(service.created_at)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div
          style={{
            padding: "0 clamp(1.25rem, 4vw, 1.75rem)",
            paddingBottom: "clamp(1.25rem, 4vw, 1.75rem)",
          }}
        >
          {service.status === "inactive" ? (
            <button
              onClick={() => {
                onRender?.(service.service_id);
                onClose();
              }}
              className="click"
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: "linear-gradient(135deg, var(--bg-nav-active), color-mix(in srgb, var(--bg-nav-active) 80%, #000))",
                color: "var(--bg-surface)",
                borderRadius: "0.85rem",
                padding: "0.8rem",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "clamp(0.85rem, 2vw, 1rem)",
                letterSpacing: "0.02em",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              Render Service
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: isCompleted
                  ? "rgba(34, 197, 94, 0.1)"
                  : isActive
                    ? "rgba(59, 130, 246, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                color: isCompleted ? "#22c55e" : isActive ? "#3b82f6" : "#ef4444",
                borderRadius: "0.85rem",
                padding: "0.8rem",
                fontWeight: 700,
                fontSize: "clamp(0.85rem, 2vw, 1rem)",
                letterSpacing: "0.02em",
                textTransform: "capitalize",
              }}
            >
              {isCompleted ? "Completed" : isActive ? "Active" : isCancelled ? "Cancelled" : "Inactive"}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
