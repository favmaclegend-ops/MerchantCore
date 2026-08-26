import { api } from "@/lib/api";
import { marketStore } from "./demoMarketStore";
import type {
  MarketStore,
  MarketStoreAdvert,
  MarketStoreProduct,
  MarketStoreShop,
} from "./demoMarketStore";
import type { MarketCartItem } from "./cart";

// ---------------------------------------------------------------------------
// Backend → Frontend adapters
// ---------------------------------------------------------------------------

function adaptShop(raw: Record<string, unknown>): MarketStoreShop {
  const loc =
    raw.lat != null || raw.lng != null || raw.address
      ? {
          lat: Number(raw.lat ?? 0),
          lng: Number(raw.lng ?? 0),
          address: String(raw.address ?? ""),
          city: raw.city ? String(raw.city) : undefined,
        }
      : undefined;
  return {
    id: String(raw.id ?? ""),
    shop_id: String(raw.id ?? raw.shop_id ?? ""),
    shop_name: String(raw.shop_name ?? ""),
    owner: String(raw.owner_name ?? raw.owner_id ?? ""),
    product_id: String(raw.id ?? raw.shop_id ?? ""),
    shopProfileImage: raw.profile_image ? String(raw.profile_image) : undefined,
    shopProfileImagebg: raw.background_image ? String(raw.background_image) : undefined,
    rating: raw.rating != null ? String(raw.rating) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    createdAt: raw.created_at ? String(raw.created_at) : undefined,
    ownerKey: raw.owner_id ? `user:${raw.owner_id}` : undefined,
    location: loc,
  };
}

function adaptProduct(raw: Record<string, unknown>, shopName?: string): MarketStoreProduct {
  const images = Array.isArray(raw.images)
    ? (raw.images as Array<Record<string, unknown>>).map((i) => String(i.image_url ?? i.image ?? ""))
    : [];
  const variants = Array.isArray(raw.variants)
    ? (raw.variants as Array<Record<string, unknown>>).map((v) => ({
        id: v.id ? String(v.id) : undefined,
        image: v.image ? String(v.image) : undefined,
        size: v.size ? String(v.size) : undefined,
        color: v.color ? String(v.color) : undefined,
        shape: v.shape ? String(v.shape) : undefined,
      }))
    : [];
  return {
    id: String(raw.id ?? ""),
    group_id: String(raw.shop_id ?? ""),
    product_id: String(raw.id ?? ""),
    product_name: String(raw.name ?? ""),
    product_rating: "0",
    inStock: raw.in_stock !== false,
    shop_name: shopName ?? "",
    product_price: String(raw.price ?? "0"),
    category: String(raw.category ?? "General"),
    keywords: Array.isArray(raw.keywords) ? raw.keywords.map(String) : [],
    productImageUrl: raw.image_url ? String(raw.image_url) : undefined,
    productImages: images.length > 0 ? images : undefined,
    variants: variants.length > 0 ? variants : undefined,
    description: raw.description ? String(raw.description) : undefined,
    uploadedAt: raw.created_at ? String(raw.created_at) : undefined,
  };
}

function adaptAdvert(raw: Record<string, unknown>): MarketStoreAdvert {
  return {
    id: String(raw.id ?? ""),
    title: raw.title ? String(raw.title) : undefined,
    advertUrl: String(raw.advert_url ?? ""),
    videoUrl: raw.video_url ? String(raw.video_url) : undefined,
    visitLink: String(raw.visit_link ?? ""),
  };
}

// ---------------------------------------------------------------------------
// Public fetchers (called on mount / page load)
// ---------------------------------------------------------------------------

export const fetchMarketData = async (): Promise<MarketStore> => {
  const [shopsRes, productsRes, advertsRaw, categoriesRaw, topRatedRaw] =
    await Promise.all([
      api.market.getShops(undefined, 1, 100),
      api.market.getProducts(),
      api.market.getAdverts(),
      api.market.getCategories(),
      api.market.getTopRated(4),
    ]);

  const shops: Record<string, MarketStoreShop> = {};
  for (const raw of shopsRes.shops) {
    const shop = adaptShop(raw);
    shops[shop.shop_id] = shop;
  }

  const products = productsRes.products.map((p: Record<string, unknown>) => {
    const shopName = shops[String(p.shop_id)]?.shop_name;
    return adaptProduct(p, shopName);
  });

  const advert = advertsRaw.map(adaptAdvert);
  const catergories = categoriesRaw.map((c: Record<string, unknown>) => String(c.name ?? ""));
  const top4tRatingShops = topRatedRaw.map(adaptShop);

  return { shops, products, advert, catergories, top4tRatingShops };
};

export const syncUserMarketData = (): void => {
  fetchMarketData()
    .then((data) => marketStore.setState(data))
    .catch(() => {});
};

export const fetchShops = async (): Promise<MarketStoreShop[]> => {
  const res = await api.market.getShops();
  return res.shops.map(adaptShop);
};

export const fetchShop = async (id: string): Promise<MarketStoreShop | undefined> => {
  try {
    const raw = await api.market.getShop(id);
    return adaptShop(raw);
  } catch {
    return undefined;
  }
};

export const fetchProducts = async (): Promise<MarketStoreProduct[]> => {
  const res = await api.market.getProducts();
  return res.products.map((p: Record<string, unknown>) => adaptProduct(p));
};

export const fetchTopRatedShops = async (): Promise<MarketStoreShop[]> => {
  const raw = await api.market.getTopRated(4);
  return raw.map(adaptShop);
};

export const fetchAdverts = async (): Promise<MarketStoreAdvert[]> => {
  const raw = await api.market.getAdverts();
  return raw.map(adaptAdvert);
};

export const fetchCategories = async (): Promise<string[]> => {
  const raw = await api.market.getCategories();
  return raw.map((c) => String(c.name ?? ""));
};

// ---------------------------------------------------------------------------
// Order / checkout (still client-side — no order backend yet)
// ---------------------------------------------------------------------------

export interface MarketOrderAlert {
  shop_id: string;
  shop_name: string;
  owner: string;
  message: string;
  amount: number;
  sentAt: string;
}

export interface MarketCheckoutInput {
  items: MarketCartItem[];
  payment_method: string;
}

export interface MarketCheckoutResult {
  order_id: string;
  createdAt: string;
  payment_method: string;
  items: MarketCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  alerts: MarketOrderAlert[];
}

export interface MarketOrdersState extends Record<string, unknown> {
  orders: MarketCheckoutResult[];
}

import { createStore } from "elk-components";
export const marketOrdersStore = createStore<MarketOrdersState>({ orders: [] });

export const groupCartItemsByShop = (
  items: MarketCartItem[],
): Record<string, MarketCartItem[]> =>
  items.reduce<Record<string, MarketCartItem[]>>((groups, item) => {
    (groups[item.shop_id] ??= []).push(item);
    return groups;
  }, {});

export const submitMarketOrder = (
  input: MarketCheckoutInput,
): Promise<MarketCheckoutResult> => {
  if (input.items.length === 0) {
    return Promise.reject(new Error("Cannot checkout an empty cart"));
  }
  const subtotal = input.items.reduce(
    (sum, item) => sum + parseFloat(item.product_price) * item.quantity,
    0,
  );
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const createdAt = new Date().toISOString();
  const order_id = `MC-ORD-${createdAt.replace(/\D/g, "").slice(0, 14)}-${Math.floor(
    Math.random() * 9999,
  )}`;

  const alerts: MarketOrderAlert[] = Object.values(
    groupCartItemsByShop(input.items),
  ).map((group) => {
    const shops = marketStore.getState().shops;
    const shop = shops[group[0].shop_id];
    const amount = group.reduce(
      (sum, item) => sum + parseFloat(item.product_price) * item.quantity,
      0,
    );
    const names = group.map((item) => item.product_name).join(", ");
    return {
      shop_id: group[0].shop_id,
      shop_name: group[0].shop_name,
      owner: shop?.owner ?? "",
      message: `New market order for ${group[0].shop_name} · ${group.reduce(
        (sum, item) => sum + item.quantity,
        0,
      )} item(s): ${names}`,
      amount,
      sentAt: createdAt,
    };
  });

  const result: MarketCheckoutResult = {
    order_id,
    createdAt,
    payment_method: input.payment_method,
    items: input.items,
    subtotal,
    tax,
    total,
    alerts,
  };

  marketOrdersStore.setState({
    orders: [result, ...marketOrdersStore.getState().orders],
  });

  return Promise.resolve(result);
};
