import { api } from "@/lib/api";
import type {
  MarketProductVariant,
  MarketStore,
  MarketStoreProduct,
  MarketStoreShop,
} from "./demoMarketStore";

// All shop/product CRUD now goes through the backend market API.
// localStorage fallbacks have been removed — the backend owns the data.

export const DEFAULT_SHOP_IMAGE = "/img1.png";

export interface PosSourceProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  rating?: number;
  variants?: MarketProductVariant[];
}

export interface MarketShopInput {
  shop_name: string;
  owner?: string;
  description?: string;
  shopProfileImage?: string;
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export interface UploadedMarketProduct extends MarketStoreProduct {
  ownerKey: string;
  sourceId: string;
}

export interface MarketShopDraft extends MarketStoreShop {
  ownerKey: string;
}

// Owner key: personal logins own a shop as `user:<id>`, org members share `org:<orgId>`.
export const getOwnerKey = (
  user?: { id?: string; email?: string } | null,
  orgUser?: { id?: string; email?: string } | null,
  orgId?: string | null,
): string => {
  if (orgUser) return `org:${orgId ?? orgUser.id}`;
  return `user:${user?.id ?? user?.email ?? "guest"}`;
};

// Fetch the current user's shop from the backend (matched by owner_id).
export const getMyShop = async (ownerKey: string): Promise<MarketShopDraft | undefined> => {
  try {
    const res = await api.market.getShops(undefined, 1, 100);
    const ownerId = ownerKey.replace(/^user:|^org:/, "");
    const match = res.shops.find((s: Record<string, unknown>) => String(s.owner_id) === ownerId);
    return match ? { ...adaptShopDraft(match), ownerKey } : undefined;
  } catch {
    return undefined;
  }
};

function adaptShopDraft(raw: Record<string, unknown>): MarketShopDraft {
  return {
    id: String(raw.id ?? ""),
    shop_id: String(raw.id ?? ""),
    shop_name: String(raw.shop_name ?? ""),
    owner: String(raw.owner_name ?? raw.owner_id ?? ""),
    product_id: String(raw.id ?? ""),
    shopProfileImage: raw.profile_image ? String(raw.profile_image) : undefined,
    shopProfileImagebg: raw.background_image ? String(raw.background_image) : undefined,
    rating: raw.rating != null ? String(raw.rating) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    createdAt: raw.created_at ? String(raw.created_at) : undefined,
    ownerKey: "",
  };
}

// Create a new shop on the backend.
export const createMarketShop = async (
  ownerKey: string,
  input: MarketShopInput,
): Promise<MarketShopDraft> => {
  const res = await api.market.createShop({
    shop_name: input.shop_name.trim(),
    description: input.description?.trim() || null,
    profile_image: input.shopProfileImage?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
  });
  return { ...adaptShopDraft(res), ownerKey };
};

// Update shop profile/background image via PATCH.
const setShopImage = async (
  ownerKey: string,
  imageUrl: string,
  field: "profile_image" | "background_image",
): Promise<MarketShopDraft | undefined> => {
  const next = imageUrl?.trim();
  if (!next) return undefined;
  const shop = await getMyShop(ownerKey);
  if (!shop?.id) return undefined;
  await api.market.updateShop(shop.id, { [field]: next });
  return { ...shop, [field === "profile_image" ? "shopProfileImage" : "shopProfileImagebg"]: next };
};

export const updateShopProfileImage = async (
  ownerKey: string,
  imageUrl: string,
): Promise<MarketShopDraft | undefined> => setShopImage(ownerKey, imageUrl, "profile_image");

export const updateShopProfileBackground = async (
  ownerKey: string,
  imageUrl: string,
): Promise<MarketShopDraft | undefined> => setShopImage(ownerKey, imageUrl, "background_image");

// Get source IDs of products already uploaded to the market by this owner.
export const getUploadedSourceIds = async (ownerKey: string): Promise<string[]> => {
  try {
    const shop = await getMyShop(ownerKey);
    if (!shop?.id) return [];
    const res = await api.market.getShop(shop.id);
    const products = Array.isArray(res.products) ? res.products : [];
    return products.map((p: Record<string, unknown>) => String(p.source_id ?? ""));
  } catch {
    return [];
  }
};

// Remove a product from the market by its backend product id.
export const removeProductFromMarket = async (
  _ownerKey: string,
  productId: string,
): Promise<boolean> => {
  try {
    await api.market.deleteProduct(productId);
    return true;
  } catch {
    return false;
  }
};

// Sync inventory edits to the market product on the backend.
export const updateMarketProductFromInventory = async (
  _ownerKey: string,
  productId: string,
  changes: {
    name: string;
    price: number;
    stock: number;
    category: string;
    image?: string;
  },
): Promise<boolean> => {
  try {
    await api.market.updateProduct(productId, {
      name: changes.name,
      price: changes.price,
      in_stock: changes.stock > 0,
      category: changes.category?.trim() || "General",
      image_url: changes.image?.trim() || null,
    });
    return true;
  } catch {
    return false;
  }
};

const sanitizeVariants = (
  variants: MarketProductVariant[],
): MarketProductVariant[] =>
  variants
    .map((v) => ({
      image: v.image?.trim() || undefined,
      size: v.size?.trim() || undefined,
      color: v.color?.trim() || undefined,
      shape: v.shape?.trim() || undefined,
    }))
    .filter((v) => !!(v.image || v.size || v.color || v.shape));

// Upload products from inventory to the market via the backend.
export const uploadProductsToShop = async (
  ownerKey: string,
  sourceProducts: PosSourceProduct[],
): Promise<UploadedMarketProduct[]> => {
  const shop = await getMyShop(ownerKey);
  if (!shop?.id) throw new Error("Create a shop before uploading items");
  const withoutImage = sourceProducts.filter((p) => !p.image?.trim());
  if (withoutImage.length > 0) {
    const names = withoutImage.map((p) => `"${p.name}"`).join(", ");
    throw new Error(
      `Sorry, please select an image for the following product${withoutImage.length === 1 ? "" : "s"} before uploading: ${names}`,
    );
  }

  // Deduplicate against already-uploaded source IDs.
  const existingIds = new Set(await getUploadedSourceIds(ownerKey));
  const added: UploadedMarketProduct[] = [];

  for (let i = 0; i < sourceProducts.length; i++) {
    const source = sourceProducts[i];
    if (existingIds.has(source.id)) continue;

    const res = await api.market.createProduct(shop.id, {
      name: source.name,
      price: source.price,
      category: source.category?.trim() || "General",
      in_stock: source.stock > 0,
      image_url: source.image?.trim() || null,
      keywords: [source.name.toLowerCase()],
      source_id: source.id,
      variants: source.variants ? sanitizeVariants(source.variants) : [],
    });

    added.push({
      ownerKey,
      sourceId: source.id,
      id: String(res.id ?? ""),
      group_id: shop.id,
      product_id: String(res.id ?? ""),
      product_name: String(res.name ?? source.name),
      product_rating: "0",
      inStock: source.stock > 0,
      shop_name: shop.shop_name,
      product_price: String(res.price ?? source.price),
      category: String(res.category ?? source.category ?? "General"),
      keywords: Array.isArray(res.keywords) ? res.keywords.map(String) : [source.name.toLowerCase()],
      productImageUrl: res.image_url ? String(res.image_url) : undefined,
    });

    existingIds.add(source.id);
  }

  return added;
};

// Fold user shops/products into a base MarketStore — kept for compat with components
// that still merge at render time.
export const mergeUserMarketData = (base: MarketStore): MarketStore => base;
