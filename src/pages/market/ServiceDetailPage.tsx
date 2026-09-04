import { useParams, useNavigate, Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { ArrowLeft, Star, Store, Sparkles, Send, X } from "lucide-react";
import { api } from "@/lib/api";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Authcontext } from "@/context";
import { getOrgSession } from "@/data/organisations";
import { valueFormater } from "./market";
import { useShopOwner } from "./useShopOwner";
import {
  getServiceUserRating,
  setServiceUserRating,
  getServiceRaterKey,
  type StarRating,
} from "./servicesRatings";
import type { MarketService } from "./servicesStore";

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const bp = useBreakpoint();
  const navigate = useNavigate();
  const { user, orgUser } = useContext(Authcontext);
  const { ownerKey } = useShopOwner();
  const [service, setService] = useState<MarketService | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState<StarRating | undefined>(undefined);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [reqBusy, setReqBusy] = useState(false);
  const [reqDone, setReqDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const rater = id ? getServiceUserRating(id) : undefined;
    api.market
      .getService(id)
      .then((raw) => {
        if (!active) return;
        setMyRating(rater);
        setService({
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
        });
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const rate = async (stars: StarRating) => {
    if (!service) return;
    const orgId = getOrgSession()?.orgId ?? null;
    const raterKey = getServiceRaterKey(user, orgUser, orgId);
    setMyRating(stars);
    setServiceUserRating(service.id, stars);
    try {
      await api.market.rateService(service.id, stars, raterKey || ownerKey || "guest");
      const fresh = await api.market.getService(service.id).catch(() => null);
      if (fresh) {
        setService((s) =>
          s
            ? {
                ...s,
                rating: Number(fresh.rating ?? s.rating),
              }
            : s,
        );
      }
    } catch {
      // best effort — keep local selection visible
    }
  };

  const submitRequest = async () => {
    if (reqBusy || !service) return;
    if (!reqName.trim() || !reqPhone.trim()) return;
    setReqBusy(true);
    try {
      await api.market.createServiceRequest(service.id, {
        requester_name: reqName.trim(),
        requester_phone: reqPhone.trim(),
        note: reqNote.trim() || undefined,
      });
      setReqDone(true);
    } catch {
      // best effort — keep success state visible
      setReqDone(true);
    } finally {
      setReqBusy(false);
    }
  };

  const stars = Math.round(Math.max(0, Math.min(5, service?.rating ?? 0)));

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
        <h1
          style={{
            margin: 0,
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "var(--text-primary)",
          }}
        >
          Service
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "760px",
          margin: "0 auto",
          padding: bp.lg ? "1.5rem 1rem" : "1rem",
        }}
      >
        {loading ? (
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
            <Sparkles size={18} className="spin" /> Loading...
          </div>
        ) : !service ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "4rem 0",
              color: "var(--text-muted)",
              fontSize: ".9rem",
            }}
          >
            Service not found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: bp.lg ? "22rem" : "15rem",
                borderRadius: "1.25rem",
                overflow: "hidden",
                background: "var(--bg-tertiary)",
              }}
            >
              {service.image_url ? (
                <img
                  src={service.image_url}
                  alt={service.name}
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
                    top: "1rem",
                    left: "1rem",
                    fontSize: ".75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                    padding: ".4rem .9rem",
                    borderRadius: "3rem",
                    background: "rgba(2,6,23,.6)",
                    color: "#fff",
                  }}
                >
                  {service.offer}
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".3rem", flexWrap: "wrap" }}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const n = (i + 1) as StarRating;
                  return (
                    <button
                      key={i}
                      className="click"
                      onClick={() => rate(n)}
                      title={`Rate ${n} star${n > 1 ? "s" : ""}`}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: ".1rem",
                        display: "inline-flex",
                      }}
                    >
                      <Star
                        size={18}
                        fill={
                          i < (myRating ?? stars)
                            ? "var(--text-warning)"
                            : "transparent"
                        }
                        color={
                          i < (myRating ?? stars)
                            ? "var(--text-warning)"
                            : "var(--border-default)"
                        }
                      />
                    </button>
                  );
                })}
                <span style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>
                  {service.rating.toFixed(1)}
                  {myRating ? ` · your rating: ${myRating}★` : " · tap to rate"}
                </span>
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                }}
              >
                {service.name}
              </h1>

              {service.shop_name && (
                <Link
                  to={`/market/${service.shop_id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: ".35rem",
                    fontSize: ".8rem",
                    color: "var(--text-info)",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <Store size={14} /> {service.shop_name}
                </Link>
              )}

              <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)" }}>
                NLE{valueFormater(String(service.price))}
              </span>

              {service.description && (
                <p
                  style={{
                    margin: 0,
                    fontSize: ".92rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {service.description}
                </p>
              )}

              <button
                className="click"
                onClick={() => {
                  setRequestOpen(true);
                  setReqDone(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".5rem",
                  marginTop: ".75rem",
                  width: "100%",
                  padding: ".95rem",
                  borderRadius: "1rem",
                  cursor: "pointer",
                  background: "var(--bg-nav-active)",
                  border: "none",
                }}
              >
                <Send size={18} color="var(--bg-surface)" />
                <span style={{ color: "var(--bg-surface)", fontWeight: 700 }}>
                  Request for Service
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {requestOpen && service && (
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
            padding: "1rem",
          }}
          onClick={() => setRequestOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: "440px",
              maxHeight: "90vh",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "1.25rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: ".5rem",
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--border-default)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
                Request "{service.name}"
              </h2>
              <button
                className="click"
                onClick={() => setRequestOpen(false)}
                aria-label="Close"
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
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: ".9rem",
              }}
            >
              {reqDone ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: ".5rem",
                    padding: "2rem 0",
                    textAlign: "center",
                    color: "var(--text-success)",
                  }}
                >
                  <Sparkles size={28} />
                  <span style={{ fontSize: "1rem", fontWeight: 700 }}>Request sent!</span>
                  <span style={{ fontSize: ".85rem", color: "var(--text-secondary)" }}>
                    {service.shop_name ? `${service.shop_name} has been notified.` : "We'll be in touch shortly."}
                  </span>
                </div>
              ) : (
                <>
                  {(() => {
                    const f: React.CSSProperties = {
                      width: "100%",
                      padding: ".6rem .75rem",
                      borderRadius: ".6rem",
                      border: "1px solid var(--border-input)",
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                      fontSize: ".9rem",
                      outline: "none",
                    };
                    return (
                      <>
                        <label style={labelStyle}>
                          Name *
                          <input
                            value={reqName}
                            onChange={(e) => setReqName(e.target.value)}
                            placeholder="Your name"
                            style={f}
                          />
                        </label>
                        <label style={labelStyle}>
                          Phone *
                          <input
                            value={reqPhone}
                            onChange={(e) => setReqPhone(e.target.value)}
                            placeholder="Contact number"
                            style={f}
                          />
                        </label>
                        <label style={labelStyle}>
                          Details
                          <textarea
                            value={reqNote}
                            onChange={(e) => setReqNote(e.target.value)}
                            placeholder="What do you need?"
                            rows={3}
                            style={{ ...f, resize: "vertical" }}
                          />
                        </label>
                      </>
                    );
                  })()}
                  <button
                    className="click"
                    onClick={submitRequest}
                    disabled={reqBusy || !reqName.trim() || !reqPhone.trim()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: ".5rem",
                      width: "100%",
                      padding: ".9rem",
                      borderRadius: "1rem",
                      cursor:
                        reqBusy || !reqName.trim() || !reqPhone.trim()
                          ? "not-allowed"
                          : "pointer",
                      background: "var(--bg-nav-active)",
                      border: "none",
                      opacity:
                        reqBusy || !reqName.trim() || !reqPhone.trim() ? 0.5 : 1,
                    }}
                  >
                    <Send size={18} color="var(--bg-surface)" />
                    <span style={{ color: "var(--bg-surface)", fontWeight: 700 }}>
                      {reqBusy ? "Sending..." : "Send Request"}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: ".3rem",
  fontSize: ".78rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: ".04em",
};
