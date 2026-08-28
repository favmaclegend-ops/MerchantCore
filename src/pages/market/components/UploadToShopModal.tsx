import { Fragment, useContext, useEffect, useState, type CSSProperties } from "react";
import {
  Check,
  CheckSquare,
  Layers,
  Loader2,
  Package,
  Plus,
  Store,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Authcontext } from "@/context/auth_context";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { api } from "@/lib/api";
import type { MarketProductVariant, MarketStoreShop } from "../demoMarketStore";
import { useShopOwner } from "../useShopOwner";
import {
  createMarketShop,
  getMyShop,
  getUploadedSourceIds,
  removeProductFromMarket,
  uploadProductsToShop,
  type PosSourceProduct,
} from "../marketUpload";
import { syncUserMarketData } from "../marketApi";
import { valueFormater } from "../market";
import { geocodeAddress } from "../geocode";
import { GracefulImage } from "@/components/GracefulImage";
import {
  LocationAutocomplete,
  type LocationSelection,
} from "./LocationAutocomplete";
import { store } from "@/context/store";

export function UploadToShopModal({ onClose }: { onClose: () => void }) {
  const bp = useBreakpoint();
  const { user, orgUser } = useContext(Authcontext);
  const { ownerKey } = useShopOwner();
  const [shop, setShop] = useState<MarketStoreShop | null>(null);

  useEffect(() => {
    let active = true;
    getMyShop(ownerKey).then((s) => {
      if (active) setShop(s ?? null);
    });
    return () => { active = false; };
  }, [ownerKey]);

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
            minHeight: 0,
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
  const [addressSelection, setAddressSelection] = useState<LocationSelection | null>(null);
  const [citySelection, setCitySelection] = useState<LocationSelection | null>(null);
  const [locationNote, setLocationNote] = useState("");
  
  
  
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

  const submit = async () => {
    if (!name.trim()) {
      store.setState({error: "Shop name is required."});
      return;
    }

    store.setState({busy: true});
    store.setState({error: ""})
    setLocationNote("");
    let lat: number | undefined;
    let lng: number | undefined;
    const picked = addressSelection ?? citySelection;
    if (picked) {
      lat = picked.lat;
      lng = picked.lng;
      setLocationNote("Location set from the suggested address.");
    } else if (address.trim() || city.trim()) {
      const resolved = await geocodeAddress(
        [address.trim(), city.trim()].filter(Boolean).join(", "),
      );
      if (resolved) {
        lat = resolved.lat;
        lng = resolved.lng;
        setLocationNote("Location set from your typed address.");
      } else {
        setLocationNote(
          "Could not pinpoint the address — the shop will appear with no map pin.",
        );
      }
    }
    const shop = await createMarketShop(ownerKey, {
      shop_name: name,
      owner,
      description,
      shopProfileImage: image,
      address,
      city,
      lat,
      lng,
    });
    store.setState({busy: false});
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
        <LocationAutocomplete
          label="Address"
          placeholder="Street address"
          value={address}
          onChange={setAddress}
          onSelectionChange={setAddressSelection}
        />
        <LocationAutocomplete
          label="City"
          placeholder="City"
          value={city}
          onChange={setCity}
          onSelectionChange={setCitySelection}
          cityMode
        />
      </div>

      {locationNote && (
        <p
          style={{
            margin: 0,
            fontSize: ".78rem",
            color:
              locationNote.startsWith("Could not")
                ? "var(--text-warning)"
                : "var(--text-success)",
          }}
        >
          {locationNote}
        </p>
      )}

      {store.getState().error && (
        <p
          style={{
            margin: 0,
            fontSize: ".8rem",
            color: "var(--text-danger)",
          }}
        >
          {store.getState().error}
        </p>
      )}

      <button
        className="click"
        onClick={submit}
        disabled={store.getState().busy}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: ".5rem",
          width: "100%",
          padding: ".85rem",
          borderRadius: "1rem",
          cursor: store.getState().busy ? "wait" : "pointer",
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
 
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadedIds, setUploadedIds] = useState<string[]>([]);
  const [success, setSuccess] = useState("");
  const [openVariants, setOpenVariants] = useState<string | null>(null);
  const [variantDrafts, setVariantDrafts] = useState<Record<string, VariantDraft[]>>({});

  useEffect(() => {
    let active = true;
    getUploadedSourceIds(ownerKey).then((ids) => {
      if (active) setUploadedIds(ids);
    });
    return () => { active = false; };
  }, [ownerKey]);

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
            image: String((p as { image?: unknown }).image ?? ""),
            rating:
              (p as { rating?: unknown }).rating != null
                ? Number((p as { rating?: unknown }).rating)
                : undefined,
          })),
        );
      })
      .catch(() => {
        if (mounted)
          store.setState({error:"Could not load your POS items. Check your connection and try again.",})
      });
    return () => {
      mounted = false;
    };
  }, [posApi]);

  const uploadedSet = new Set(uploadedIds);
  const available = (products ?? []).filter((p) => !uploadedSet.has(p.id));
  const alreadyUploaded = (products ?? []).filter((p) => uploadedSet.has(p.id));

  const doUpload = async (list: PosSourceProduct[]) => {
    if (list.length === 0) return;
    const missingImage = list.filter((p) => !p.image?.trim());
    if (missingImage.length > 0) {
      const names = missingImage.map((p) => `"${p.name}"`).join(", ");
      setSuccess("");
      store.setState({error:
        `Sorry, please select an image for ${missingImage.length === 1 ? "this product" : "these products"} before uploading: ${names}`,
      })
      return;
    }
    store.setState({busy: true});
    store.setState({error: ""})
    try {
      const withVariants = list.map((p) => ({ ...p, variants: toVariantInput(p) }));
      const added = await uploadProductsToShop(ownerKey, withVariants);
      syncUserMarketData();
      const ids = await getUploadedSourceIds(ownerKey);
      setUploadedIds(ids);
      setSelected(new Set());
      setSuccess(
        `${added.length} item${added.length === 1 ? "" : "s"} uploaded to ${shop.shop_name}.`,
      );
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      store.setState({error: e instanceof Error ? e.message : "Upload failed, please try again.",});
    } finally {
      store.setState({busy: true});
    }
  };

  const doRemove = async (product: PosSourceProduct) => {
    if (
      !window.confirm(
        `Remove "${product.name}" from ${shop.shop_name}? It stays in your POS inventory.`,
      )
    )
      return;
    store.setState({error: ""})
    if (await removeProductFromMarket(ownerKey, product.id)) {
      syncUserMarketData();
      const ids = await getUploadedSourceIds(ownerKey);
      setUploadedIds(ids);
      setSuccess(`"${product.name}" removed from ${shop.shop_name}.`);
      setTimeout(() => setSuccess(""), 4000);
    } else {
      store.setState({error:`Could not remove "${product.name}" — it is not your upload.`});
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

  const toggleVariants = (id: string) =>
    setOpenVariants((prev) => (prev === id ? null : id));

  const setDraftsFor =
    (id: string) => (next: VariantDraft[]) =>
      setVariantDrafts((prev) => ({ ...prev, [id]: next }));

  const toVariantInput = (
    p: PosSourceProduct,
  ): MarketProductVariant[] | undefined => {
    const drafts = variantDrafts[p.id];
    if (!drafts || drafts.length === 0) return undefined;
    const cleaned = drafts
      .map((d) => ({
        image: d.image.trim() || undefined,
        size: d.size.trim() || undefined,
        color: d.color.trim() || undefined,
        shape: d.shape.trim() || undefined,
      }))
      .filter((v) => !!(v.image || v.size || v.color || v.shape));
    return cleaned.length ? cleaned : undefined;
  };

  if (products === null && !store.getState().error) {
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

      {store.getState().error && (
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
          {store.getState().error}
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
          {available.map((p) => {
            const drafts = variantDrafts[p.id] ?? [];
            const filledDrafts = drafts.filter(
              (d) => d.image || d.size || d.color || d.shape,
            );
            return (
              <Fragment key={p.id}>
                <ItemRow
                  name={p.name}
                  price={p.price}
                  inStock={p.stock > 0}
                  selectable={mode === "selected"}
                  checked={selected.has(p.id)}
                  uploaded={false}
                  image={p.image}
                  onToggle={() => toggle(p.id)}
                  compact={bp.sm}
                  onToggleVariants={() => toggleVariants(p.id)}
                  variantCount={filledDrafts.length}
                />
                {openVariants === p.id && (
                  <VariantEditor
                    drafts={drafts}
                    onChange={setDraftsFor(p.id)}
                  />
                )}
              </Fragment>
            );
          })}
          {alreadyUploaded.map((p) => (
            <ItemRow
              key={p.id}
              name={p.name}
              price={p.price}
              inStock={p.stock > 0}
              selectable={false}
              checked={false}
              uploaded
              image={p.image}
              onToggle={() => {}}
              onRemove={() => doRemove(p)}
              compact={bp.sm}
            />
          ))}
        </div>
      )}

      <button
        className="click"
        disabled={store.getState().busy || (mode === "all" ? available.length === 0 : selected.size === 0)}
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
            store.getState().busy || (mode === "all" ? available.length === 0 : selected.size === 0)
              ? "not-allowed"
              : "pointer",
          background: "var(--bg-nav-active)",
          border: "none",
          opacity: store.getState().busy || (mode === "all" ? available.length === 0 : selected.size === 0) ? 0.5 : 1,
        }}
      >
        {store.getState().busy ? (
          <Loader2 size={18} className="spin" color="var(--bg-surface)" />
        ) : (
          <Upload size={18} color="var(--bg-surface)" />
        )}
        <span style={{ color: "var(--bg-surface)", fontWeight: 600 }}>
          {store.getState().busy
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
  image,
  onToggle,
  onRemove,
  compact,
  onToggleVariants,
  variantCount,
}: {
  name: string;
  price: number;
  inStock: boolean;
  selectable: boolean;
  checked: boolean;
  uploaded: boolean;
  image?: string;
  onToggle: () => void;
  onRemove?: () => void;
  compact: boolean;
  onToggleVariants?: () => void;
  variantCount?: number;
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
      <div
        style={{
          width: "28px",
          height: "28px",
          flexShrink: 0,
          borderRadius: "6px",
          overflow: "hidden",
          border: "1px solid var(--border-default)",
          background: "var(--bg-tertiary)",
        }}
      >
        <GracefulImage src={image} alt={name} />
      </div>
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
          {uploaded
            ? "Already in shop"
            : !image
              ? "No image — add one to upload"
              : inStock
                ? "In stock"
                : "Sold out"}
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
      {onToggleVariants && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVariants();
          }}
          title="Edit variants"
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".3rem",
            padding: ".35rem .6rem",
            borderRadius: ".5rem",
            cursor: "pointer",
            border: "1px solid var(--border-default)",
            background: variantCount ? "var(--bg-nav)" : "var(--bg-tertiary)",
            color: variantCount ? "var(--text-info)" : "var(--text-secondary)",
            fontSize: ".72rem",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <Layers size={12} />
          {variantCount ? `Variants · ${variantCount}` : "Variants"}
        </button>
      )}
      {uploaded && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remove from market"
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".3rem",
            padding: ".35rem .6rem",
            borderRadius: ".5rem",
            cursor: "pointer",
            border: "1px solid var(--border-danger)",
            background: "var(--bg-danger)",
            color: "var(--text-danger)",
            fontSize: ".72rem",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <Store size={12} />
          Remove from market
        </button>
      )}
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

interface VariantDraft {
  id: string;
  image: string;
  size: string;
  color: string;
  shape: string;
}

const newVariantDraft = (): VariantDraft => ({
  id: `v_${Math.random().toString(36).slice(2, 10)}`,
  image: "",
  size: "",
  color: "",
  shape: "",
});

function VariantEditor({
  drafts,
  onChange,
}: {
  drafts: VariantDraft[];
  onChange: (next: VariantDraft[]) => void;
}) {
  const fieldStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: ".45rem .6rem",
    borderRadius: ".5rem",
    border: "1px solid var(--border-input)",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: ".8rem",
    outline: "none",
  };
  const update = (id: string, patch: Partial<VariantDraft>) =>
    onChange(drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: ".5rem",
        padding: ".75rem",
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border-default)",
        borderRadius: ".75rem",
      }}
    >
      <span
        style={{
          fontSize: ".72rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".04em",
          color: "var(--text-muted)",
        }}
      >
        Variants (size / colour / shape / extra image)
      </span>
      {drafts.length === 0 && (
        <span style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>
          No variants yet. Buyers will pick from the options you add, with the
          first variant selected by default.
        </span>
      )}
      {drafts.map((d) => (
        <div
          key={d.id}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: ".4rem",
            padding: ".6rem",
            border: "1px solid var(--border-default)",
            borderRadius: ".6rem",
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ display: "flex", gap: ".4rem" }}>
            <input
              value={d.size}
              onChange={(e) => update(d.id, { size: e.target.value })}
              placeholder="Size (e.g. M, 500ml)"
              style={fieldStyle}
            />
            <input
              value={d.color}
              onChange={(e) => update(d.id, { color: e.target.value })}
              placeholder="Colour (e.g. Red)"
              style={fieldStyle}
            />
          </div>
          <div style={{ display: "flex", gap: ".4rem" }}>
            <input
              value={d.shape}
              onChange={(e) => update(d.id, { shape: e.target.value })}
              placeholder="Shape (e.g. Round)"
              style={fieldStyle}
            />
            <input
              value={d.image}
              onChange={(e) => update(d.id, { image: e.target.value })}
              placeholder="Image URL (optional)"
              style={fieldStyle}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: ".5rem",
            }}
          >
            <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>
              {[d.size, d.color, d.shape].filter(Boolean).join(" · ") ||
                "Empty variant"}
            </span>
            <button
              onClick={() => onChange(drafts.filter((x) => x.id !== d.id))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".3rem",
                padding: ".3rem .55rem",
                borderRadius: ".5rem",
                cursor: "pointer",
                border: "1px solid var(--border-danger)",
                background: "var(--bg-danger)",
                color: "var(--text-danger)",
                fontSize: ".72rem",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => onChange([...drafts, newVariantDraft()])}
        style={{
          display: "flex",
          alignItems: "center",
          gap: ".3rem",
          alignSelf: "flex-start",
          padding: ".4rem .7rem",
          borderRadius: ".5rem",
          cursor: "pointer",
          border: "1px dashed var(--border-info)",
          background: "transparent",
          color: "var(--text-info)",
          fontSize: ".78rem",
          fontWeight: 600,
        }}
      >
        <Plus size={14} /> Add variant
      </button>
    </div>
  );
}
