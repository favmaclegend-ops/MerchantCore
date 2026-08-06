import { useContext, useEffect, useState, type CSSProperties } from "react";
import {
  Check,
  CheckSquare,
  Loader2,
  Package,
  Store,
  Upload,
  X,
} from "lucide-react";
import { Authcontext } from "@/context/auth_context";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { api } from "@/lib/api";
import type { MarketStoreShop } from "../demoMarketStore";
import { useShopOwner } from "../useShopOwner";
import {
  createMarketShop,
  getMyShop,
  getUploadedSourceIds,
  uploadProductsToShop,
  type PosSourceProduct,
} from "../marketUpload";
import { syncUserMarketData } from "../marketApi";
import { valueFormater } from "../market";

export function UploadToShopModal({ onClose }: { onClose: () => void }) {
  const bp = useBreakpoint();
  const { user, orgUser } = useContext(Authcontext);
  const { ownerKey } = useShopOwner();
  const [shop, setShop] = useState<MarketStoreShop | null>(() =>
    getMyShop(ownerKey) ?? null,
  );

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
          maxWidth: "560px",
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
              {shop ? `Upload to ${shop.shop_name}` : "Create your shop"}
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
            overflowY: "auto",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {shop === null ? (
            <CreateShopForm
              ownerName={user?.full_name || orgUser?.name || ""}
              onCreated={(newShop) => {
                syncUserMarketData();
                setShop(newShop);
              }}
            />
          ) : (
            <UploadItemsForm shop={shop} />
          )}
        </div>
      </div>
    </div>
  );
}

function CreateShopForm({
  ownerName,
  onCreated,
}: {
  ownerName: string;
  onCreated: (shop: MarketStoreShop) => void;
}) {
  const { ownerKey } = useShopOwner();
  const [name, setName] = useState("");
  const [owner, setOwner] = useState(ownerName);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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

  const submit = () => {
    if (!name.trim()) {
      setError("Shop name is required.");
      return;
    }
    setBusy(true);
    const shop = createMarketShop(ownerKey, {
      shop_name: name,
      owner,
      description,
      shopProfileImage: image,
      address,
      city,
    });
    setBusy(false);
    onCreated(shop);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
      <p
        style={{
          margin: 0,
          fontSize: ".9rem",
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        You don&apos;t have a shop yet. Tell us a little about it and we&apos;ll
        open one for you, then you can upload your POS items to it.
      </p>

      <label style={labelStyle}>
        Shop name *
        <input
          placeholder="e.g. Kofi's Corner Store"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={fieldStyle}
        />
      </label>

      <label style={labelStyle}>
        Owner
        <input
          placeholder="Owner display name"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          style={fieldStyle}
        />
      </label>

      <label style={labelStyle}>
        Description
        <textarea
          placeholder="What does your shop sell?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </label>

      <label style={labelStyle}>
        Shop image (URL, optional)
        <input
          placeholder="https://..."
          value={image}
          onChange={(e) => setImage(e.target.value)}
          style={fieldStyle}
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
        <label style={labelStyle}>
          Address
          <input
            placeholder="Street address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={fieldStyle}
          />
        </label>
        <label style={labelStyle}>
          City
          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={fieldStyle}
          />
        </label>
      </div>

      {error && (
        <p
          style={{
            margin: 0,
            fontSize: ".8rem",
            color: "var(--text-danger)",
          }}
        >
          {error}
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
          marginTop: ".25rem",
        }}
      >
        <Store size={18} color="var(--bg-surface)" />
        <span style={{ color: "var(--bg-surface)", fontWeight: 600 }}>
          Create shop
        </span>
      </button>
    </div>
  );
}

function UploadItemsForm({ shop }: { shop: MarketStoreShop }) {
  const { orgUser } = useContext(Authcontext);
  const { ownerKey } = useShopOwner();
  const posApi = orgUser ? api.org : api;
  const bp = useBreakpoint();
  const [products, setProducts] = useState<PosSourceProduct[] | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadedIds, setUploadedIds] = useState<string[]>(() =>
    getUploadedSourceIds(ownerKey),
  );
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    posApi
      .getProducts()
      .then((items: unknown) => {
        if (!mounted) return;
        const list = Array.isArray(items) ? items : [];
        setProducts(
          list.map((p) => ({
            id: String((p as { id?: unknown }).id ?? ""),
            name: String((p as { name?: unknown }).name ?? "Unnamed item"),
            price: Number((p as { price?: unknown }).price ?? 0),
            stock: Number((p as { stock?: unknown }).stock ?? 0),
            category: String((p as { category?: unknown }).category ?? ""),
          })),
        );
      })
      .catch(() => {
        if (mounted)
          setError(
            "Could not load your POS items. Check your connection and try again.",
          );
      });
    return () => {
      mounted = false;
    };
  }, [posApi]);

  const uploadedSet = new Set(uploadedIds);
  const available = (products ?? []).filter((p) => !uploadedSet.has(p.id));
  const alreadyUploaded = (products ?? []).filter((p) => uploadedSet.has(p.id));

  const doUpload = (list: PosSourceProduct[]) => {
    if (list.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const added = uploadProductsToShop(ownerKey, list);
      syncUserMarketData();
      setUploadedIds(getUploadedSourceIds(ownerKey));
      setSelected(new Set());
      setSuccess(
        `${added.length} item${added.length === 1 ? "" : "s"} uploaded to ${shop.shop_name}.`,
      );
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Upload failed, please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (products === null && !error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: ".5rem",
          padding: "3rem 0",
          color: "var(--text-muted)",
          fontSize: ".9rem",
        }}
      >
        <Loader2 size={18} className="spin" /> Loading your POS items...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          display: "flex",
          gap: ".5rem",
          padding: ".3rem",
          borderRadius: ".75rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-default)",
        }}
      >
        <ModeButton
          active={mode === "all"}
          onClick={() => setMode("all")}
          label="All items"
          count={available.length}
        />
        <ModeButton
          active={mode === "selected"}
          onClick={() => setMode("selected")}
          label="Selected items"
          count={selected.size}
        />
      </div>

      {error && (
        <p
          style={{
            margin: 0,
            fontSize: ".85rem",
            color: "var(--text-danger)",
            background: "var(--bg-danger)",
            padding: ".6rem .75rem",
            borderRadius: ".6rem",
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
            fontSize: ".85rem",
            color: "var(--text-success)",
            background: "var(--bg-success)",
            padding: ".6rem .75rem",
            borderRadius: ".6rem",
            border: "1px solid var(--border-success)",
          }}
        >
          <Check size={14} style={{ verticalAlign: "middle", marginRight: ".25rem" }} />
          {success}
        </p>
      )}

      <p
        style={{
          margin: 0,
          fontSize: ".85rem",
          color: "var(--text-muted)",
        }}
      >
        Items already in your shop are highlighted and cannot be uploaded twice.
      </p>

      {(products ?? []).length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: ".5rem",
            padding: "2rem 1rem",
            color: "var(--text-muted)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: ".75rem",
          }}
        >
          <Package size={28} color="var(--text-placeholder)" />
          <span style={{ fontSize: ".85rem" }}>
            No POS items found{orgUser ? "" : " — connect to the server to load your products"}.
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: ".5rem",
          }}
        >
          {available.map((p) => (
            <ItemRow
              key={p.id}
              name={p.name}
              price={p.price}
              inStock={p.stock > 0}
              selectable={mode === "selected"}
              checked={selected.has(p.id)}
              uploaded={false}
              onToggle={() => toggle(p.id)}
              compact={bp.sm}
            />
          ))}
          {alreadyUploaded.map((p) => (
            <ItemRow
              key={p.id}
              name={p.name}
              price={p.price}
              inStock={p.stock > 0}
              selectable={false}
              checked={false}
              uploaded
              onToggle={() => {}}
              compact={bp.sm}
            />
          ))}
        </div>
      )}

      <button
        className="click"
        disabled={busy || (mode === "all" ? available.length === 0 : selected.size === 0)}
        onClick={() =>
          doUpload(mode === "all" ? available : available.filter((p) => selected.has(p.id)))
        }
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: ".5rem",
          width: "100%",
          padding: ".85rem",
          borderRadius: "1rem",
          cursor:
            busy || (mode === "all" ? available.length === 0 : selected.size === 0)
              ? "not-allowed"
              : "pointer",
          background: "var(--bg-nav-active)",
          border: "none",
          opacity: busy || (mode === "all" ? available.length === 0 : selected.size === 0) ? 0.5 : 1,
        }}
      >
        {busy ? (
          <Loader2 size={18} className="spin" color="var(--bg-surface)" />
        ) : (
          <Upload size={18} color="var(--bg-surface)" />
        )}
        <span style={{ color: "var(--bg-surface)", fontWeight: 600 }}>
          {busy
            ? "Uploading..."
            : mode === "all"
              ? `Upload all (${available.length})`
              : `Upload selected (${selected.size})`}
        </span>
      </button>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: ".35rem",
        padding: ".5rem .75rem",
        borderRadius: ".55rem",
        cursor: "pointer",
        border: "none",
        fontSize: ".85rem",
        fontWeight: 600,
        background: active ? "var(--bg-nav-active)" : "transparent",
        color: active ? "var(--bg-surface)" : "var(--text-secondary)",
      }}
    >
      {label}
      <span
        style={{
          fontSize: ".7rem",
          fontWeight: 700,
          padding: ".1rem .45rem",
          borderRadius: "3rem",
          background: active ? "rgba(255,255,255,.2)" : "var(--bg-tertiary)",
        }}
      >
        {count}
      </span>
    </button>
  );
}

function ItemRow({
  name,
  price,
  inStock,
  selectable,
  checked,
  uploaded,
  onToggle,
  compact,
}: {
  name: string;
  price: number;
  inStock: boolean;
  selectable: boolean;
  checked: boolean;
  uploaded: boolean;
  onToggle: () => void;
  compact: boolean;
}) {
  return (
    <div
      onClick={selectable ? onToggle : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".6rem",
        padding: ".6rem .75rem",
        borderRadius: ".75rem",
        border: "1px solid var(--border-default)",
        background: uploaded
          ? "var(--bg-secondary)"
          : selectable && checked
            ? "var(--bg-nav-active)"
            : "var(--bg-surface)",
        cursor: selectable ? "pointer" : "default",
        opacity: uploaded ? 0.55 : 1,
      }}
    >
      {selectable ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            flexShrink: 0,
            borderRadius: "4px",
            cursor: "pointer",
            border: "1px solid var(--border-default)",
            background: checked ? "var(--bg-nav-active)" : "var(--bg-surface)",
          }}
        >
          {checked && <CheckSquare size={14} color="var(--bg-surface)" />}
        </button>
      ) : (
        <Check size={14} color="var(--text-success)" style={{ flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: compact ? ".8rem" : ".9rem",
            fontWeight: 500,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </p>
        <span
          style={{
            fontSize: ".75rem",
            color: uploaded ? "var(--text-muted)" : "var(--text-secondary)",
          }}
        >
          {uploaded ? "Already in shop" : inStock ? "In stock" : "Sold out"}
        </span>
      </div>
      <span
        style={{
          fontSize: ".85rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          flexShrink: 0,
        }}
      >
        NLE{valueFormater(String(price))}
      </span>
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
