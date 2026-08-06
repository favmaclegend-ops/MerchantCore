import type { MarketStore, MarketStoreProduct, MarketStoreShop } from "./demoMarketStore";

// User-owned market shops and uploaded items are kept in localStorage (like the other
// `merchant_*` mock stores) so they survive reloads. `mergeUserMarketData` folds them into
// the seeded market data so the market hub, shop pages and billboards see them too.
// When a real backend ships, these become `POST /market/shops`, `POST /market/items`, etc.

const USER_SHOPS_KEY = "mc_market_user_shops";
const USER_PRODUCTS_KEY = "mc_market_user_products";
export const DEFAULT_SHOP_IMAGE = "/img1.png";

export interface PosSourceProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  rating?: number;
}

export interface MarketShopInput {
  shop_name: string;
  owner?: string;
  description?: string;
  shopProfileImage?: string;
  address?: string;
  city?: string;
}

export interface UploadedMarketProduct extends MarketStoreProduct {
  ownerKey: string;
  sourceId: string;
}

export interface MarketShopDraft extends MarketStoreShop {
  ownerKey: string;
}

function readStore<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (blocked/quota) — best effort, do not throw
  }
}

export const loadUserShops = (): MarketShopDraft[] =>
  readStore<MarketShopDraft>(USER_SHOPS_KEY);

export const loadUserProducts = (): UploadedMarketProduct[] =>
  readStore<UploadedMarketProduct>(USER_PRODUCTS_KEY);

// Personal logins own a shop as `user:<id>`, organisation members share `org:<orgId>` so
// every member of the org can manage the same shop.
export const getOwnerKey = (
  user?: { id?: string; email?: string } | null,
  orgUser?: { id?: string; email?: string } | null,
  orgId?: string | null,
): string => {
  if (orgUser) return `org:${orgId ?? orgUser.id}`;
  return `user:${user?.id ?? user?.email ?? "guest"}`;
};

export const getMyShop = (ownerKey: string): MarketShopDraft | undefined =>
  loadUserShops().find((shop) => shop.ownerKey === ownerKey);

export const createMarketShop = (
  ownerKey: string,
  input: MarketShopInput,
): MarketShopDraft => {
  const slug =
    input.shop_name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "shop";
  const stamp = Date.now();
  const shop: MarketShopDraft = {
    shop_id: `mc_${slug}@${stamp}`,
    shop_name: input.shop_name.trim(),
    owner: input.owner?.trim() || "Shop Owner",
    product_id: `mc_${slug}_products@${stamp}`,
    shopProfileImage: input.shopProfileImage?.trim() || DEFAULT_SHOP_IMAGE,
    shopProfileImagebg: "",
    rating: "0",
    description: input.description?.trim() || "",
    createdAt: new Date().toISOString().slice(0, 10),
    location:
      input.address?.trim() || input.city?.trim()
        ? {
            lat: 0,
            lng: 0,
            address: input.address?.trim() || "",
            city: input.city?.trim(),
          }
        : undefined,
    ownerKey,
  };
  const shops = loadUserShops();
  shops.push(shop);
  writeStore(USER_SHOPS_KEY, shops);
  return shop;
};

export const getUploadedSourceIds = (ownerKey: string): string[] =>
  loadUserProducts()
    .filter((product) => product.ownerKey === ownerKey)
    .map((product) => product.sourceId);

export const uploadProductsToShop = (
  ownerKey: string,
  sourceProducts: PosSourceProduct[],
): UploadedMarketProduct[] => {
  const shop = getMyShop(ownerKey);
  if (!shop) throw new Error("Create a shop before uploading items");
  const existingIds = new Set(getUploadedSourceIds(ownerKey));
  const products = loadUserProducts();
  const added: UploadedMarketProduct[] = [];
  sourceProducts.forEach((source, index) => {
    if (existingIds.has(source.id)) return;
    const product: UploadedMarketProduct = {
      ownerKey,
      sourceId: source.id,
      group_id: shop.product_id,
      product_id: `mc_up_${Date.now()}_${index}`,
      product_name: source.name,
      product_rating: String(source.rating ?? 0),
      inStock: source.stock > 0,
      shop_name: shop.shop_name,
      product_price: String(source.price),
      category: source.category?.trim() || "General",
      keywords: [source.name.toLowerCase()],
      productImageUrl: source.image?.trim() || undefined,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    products.push(product);
    added.push(product);
    existingIds.add(source.id);
  });
  writeStore(USER_PRODUCTS_KEY, products);
  return added;
};

export const mergeUserMarketData = (base: MarketStore): MarketStore => {
  const userShops = loadUserShops();
  const userProducts = loadUserProducts();
  if (userShops.length === 0 && userProducts.length === 0) return base;
  const shops: Record<string, MarketStoreShop> = { ...base.shops };
  for (const shop of userShops) shops[shop.shop_id] = shop;
  return {
    ...base,
    shops,
    products: [...base.products, ...userProducts],
  };
};
