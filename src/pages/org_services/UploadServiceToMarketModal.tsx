import { useContext, useEffect, useState, type CSSProperties } from "react";
import { Check, Image as ImageIcon, Loader2, Store, Upload, X } from "lucide-react";
import { Authcontext } from "@/context";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { api } from "@/lib/api";
import type { OrgService } from "./service_demo";
import { useShopOwner } from "../market/useShopOwner";
import { getMyShop, createMarketShop } from "../market/marketUpload";
import { fetchMarketServices } from "../market/servicesStore";
import { valueFormater } from "../market/market";

export function UploadServiceToMarketModal({
  service,
  onClose,
}: {
  service: OrgService;
  onClose: () => void;
}) {
  const bp = useBreakpoint();
  const { user, orgUser } = useContext(Authcontext);
  const { ownerKey } = useShopOwner();

  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [needShop, setNeedShop] = useState(false);

  const [shopNameInput, setShopNameInput] = useState("");
  const [offer, setOffer] = useState<string>("");
  const [image, setImage] = useState<string>(service.service_img || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fieldStyle: CSSProperties = {
    width: "100%",
    padding: ".6rem .75rem",
    borderRadius: ".6rem",
    border: "1px solid var(--border-input)",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: ".9rem",
    outline: "none",
  };

  useEffect(() => {
    let active = true;
    getMyShop(ownerKey)
      .then((s) => {
        if (!active) return;
        if (s?.id) {
          setShopId(s.id);
          setShopName(s.shop_name);
        } else {
          setNeedShop(true);
        }
      })
      .catch(() => {
        if (active) setNeedShop(true);
      });
    return () => {
      active = false;
    };
  }, [ownerKey]);

  const ensureShop = async () => {
    const name = shopNameInput.trim();
    if (!name) {
      setError("Shop name is required to list your service.");
      return false;
    }
    setBusy(true);
    setError("");
    try {
      const shop = await createMarketShop(ownerKey, {
        shop_name: name,
        owner: orgUser?.name || user?.full_name || "",
        shopProfileImage: "/img1.png",
      });
      setShopId(shop.id ?? null);
      setShopName(shop.shop_name);
      setNeedShop(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create your shop.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!shopId) {
      if (await ensureShop()) await doUpload();
      return;
    }
    await doUpload();
  };

  const doUpload = async () => {
    const trimmedImage = image.trim();
    if (!trimmedImage) {
      setError(
        "An image is required before uploading this service to the market. Please add one.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.market.createService(shopId!, {
        name: service.name,
        price: service.price,
        offer: offer.trim() || null,
        description: service.description || null,
        image_url: trimmedImage,
        source_id: service.service_id,
      });
      setSuccess(`"${service.name}" is now live on the market.`);
      fetchMarketServices();
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed, please try again.");
    } finally {
      setBusy(false);
    }
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
          maxWidth: "500px",
          maxHeight: "90vh",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "1.25rem",
          overflow: "hidden",
          boxShadow: "var(--shadow-menu)",
          position: "relative",
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
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            <Store size={18} color="var(--text-info)" />
            <h2
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: "bolder",
                color: "var(--text-primary)",
              }}
            >
              {needShop ? "Create your shop" : `Upload "${service.name}" to market`}
            </h2>
          </div>
          <button
            className="click"
            onClick={onClose}
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
            gap: "1rem",
          }}
        >
          {needShop ? (
            <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: ".9rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                You need a market shop to list services. Tell us a little about it
                and we&apos;ll open one for you.
              </p>
              <label style={labelStyle}>
                Shop name *
                <input
                  placeholder="e.g. Kofi's Services"
                  value={shopNameInput}
                  onChange={(e) => setShopNameInput(e.target.value)}
                  style={fieldStyle}
                />
              </label>
              {error && (
                <p style={{ margin: 0, fontSize: ".8rem", color: "var(--text-danger)" }}>
                  {error}
                </p>
              )}
              <button
                className="click"
                onClick={ensureShop}
                disabled={busy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".5rem",
                  width: "100%",
                  padding: ".85rem",
                  borderRadius: "1rem",
                  cursor: busy ? "wait" : "pointer",
                  background: "var(--bg-nav-active)",
                  border: "none",
                }}
              >
                {busy ? (
                  <Loader2 size={18} className="spin" color="var(--bg-surface)" />
                ) : (
                  <Store size={18} color="var(--bg-surface)" />
                )}
                <span style={{ color: "var(--bg-surface)", fontWeight: 600 }}>
                  Create shop
                </span>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: ".5rem",
                  padding: ".6rem .75rem",
                  borderRadius: ".6rem",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <span style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>
                  Listing to
                </span>
                <span style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {shopName}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                {image ? (
                  <img
                    src={image}
                    alt={service.name}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: ".6rem",
                      objectFit: "cover",
                      border: "1px solid var(--border-default)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: ".6rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <ImageIcon size={20} color="var(--text-placeholder)" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: ".9rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {service.name}
                  </p>
                  <span style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    NLE{valueFormater(String(service.price))}
                  </span>
                </div>
              </div>

              <label style={labelStyle}>
                Image (URL) *
                <input
                  placeholder="https://..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  style={fieldStyle}
                />
              </label>

              <label style={labelStyle}>
                Offer (optional)
                <input
                  placeholder="e.g. 20% off first booking"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  style={fieldStyle}
                />
              </label>

              {!image && (
                <p
                  style={{
                    margin: 0,
                    fontSize: ".78rem",
                    color: "var(--text-warning)",
                    background: "var(--bg-warning)",
                    padding: ".5rem .7rem",
                    borderRadius: ".5rem",
                    border: "1px solid var(--border-warning)",
                  }}
                >
                  An image is required before this service can be uploaded to the
                  market.
                </p>
              )}

              {error && (
                <p
                  style={{
                    margin: 0,
                    fontSize: ".8rem",
                    color: "var(--text-danger)",
                    background: "var(--bg-danger)",
                    padding: ".5rem .7rem",
                    borderRadius: ".5rem",
                    border: "1px solid var(--border-danger)",
                  }}
                >
                  {error}
                </p>
              )}
              {success && (
                <p
                  style={{
                    margin: 0,
                    fontSize: ".8rem",
                    color: "var(--text-success)",
                    background: "var(--bg-success)",
                    padding: ".5rem .7rem",
                    borderRadius: ".5rem",
                    border: "1px solid var(--border-success)",
                  }}
                >
                  <Check size={14} style={{ verticalAlign: "middle", marginRight: ".25rem" }} />
                  {success}
                </p>
              )}

              <button
                className="click"
                onClick={submit}
                disabled={busy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".5rem",
                  width: "100%",
                  padding: ".85rem",
                  borderRadius: "1rem",
                  cursor: busy ? "wait" : "pointer",
                  background: "var(--bg-nav-active)",
                  border: "none",
                }}
              >
                {busy ? (
                  <Loader2 size={18} className="spin" color="var(--bg-surface)" />
                ) : (
                  <Upload size={18} color="var(--bg-surface)" />
                )}
                <span style={{ color: "var(--bg-surface)", fontWeight: 600 }}>
                  {busy ? "Uploading..." : "Upload to market"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: ".3rem",
  fontSize: ".78rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: ".04em",
};
