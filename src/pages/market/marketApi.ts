import { api } from "@/lib/api";
import { marketStore } from "./demoMarketStore";
import type {
  MarketStore,
  MarketStoreAdvert,
  MarketStoreProduct,
  MarketStoreShop,
} from "./demoMarketStore";
import { DEFAULT_TAX_RATE, type MarketCartItem } from "./cart";

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
    ownerKey: raw.owner_id ? String(raw.owner_id) : undefined,
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
    sourceId: raw.source_id ? String(raw.source_id) : undefined,
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
    .then((data) => marketStore.setState({ ...data, fetchError: null }))
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
// Order / checkout — backed by the backend market order API
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
  delivery_name?: string;
  delivery_phone?: string;
  delivery_address?: string;
}

/** A backend market order (one per shop group). */
export interface MarketOrder {
  id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  shop_id: string;
  org_id: string;
  status: "pending" | "completed" | "cancelled";
  payment_method: string | null;
  subtotal: number;
  tax: number;
  total: number;
  items: Array<Record<string, unknown>>;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  completed_at: string | null;
  created_at: string | null;
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
  orders: MarketOrder[];
}

export interface MarketOrdersState extends Record<string, unknown> {
  orders: MarketOrder[];
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

export const adaptOrder = (raw: Record<string, unknown>): MarketOrder => ({
  id: String(raw.id ?? ""),
  buyer_id: String(raw.buyer_id ?? ""),
  buyer_name: String(raw.buyer_name ?? ""),
  buyer_email: String(raw.buyer_email ?? ""),
  shop_id: String(raw.shop_id ?? ""),
  org_id: String(raw.org_id ?? ""),
  status: (raw.status as MarketOrder["status"]) ?? "pending",
  payment_method: raw.payment_method ? String(raw.payment_method) : null,
  subtotal: Number(raw.subtotal ?? 0),
  tax: Number(raw.tax ?? 0),
  total: Number(raw.total ?? 0),
  items: Array.isArray(raw.items) ? (raw.items as Array<Record<string, unknown>>) : [],
  delivery_name: raw.delivery_name ? String(raw.delivery_name) : null,
  delivery_phone: raw.delivery_phone ? String(raw.delivery_phone) : null,
  delivery_address: raw.delivery_address ? String(raw.delivery_address) : null,
  completed_at: raw.completed_at ? String(raw.completed_at) : null,
  created_at: raw.created_at ? String(raw.created_at) : null,
});

export const fetchMyOrders = async (
  status?: string,
): Promise<MarketOrder[]> => {
  const res = await api.market.getMyOrders(status);
  return (res.orders ?? []).map(adaptOrder);
};

export const submitMarketOrder = async (
  input: MarketCheckoutInput,
): Promise<MarketCheckoutResult> => {
  if (input.items.length === 0) {
    throw new Error("Cannot checkout an empty cart");
  }
  const products = marketStore.getState().products;
  const productById = new Map(products.map((p) => [p.product_id, p]));

  const groups = Object.values(groupCartItemsByShop(input.items)).map((group) => {
    const subtotal = group.reduce(
      (sum, item) => sum + parseFloat(item.product_price) * item.quantity,
      0,
    );
    const tax = subtotal * (DEFAULT_TAX_RATE ?? 0.05);
    return {
      shop_id: group[0].shop_id,
      payment_method: input.payment_method,
      delivery_name: input.delivery_name,
      delivery_phone: input.delivery_phone,
      delivery_address: input.delivery_address,
      items: group.map((item) => {
        const src = productById.get(item.product_id);
        return {
          product_id: item.product_id,
          source_id: src?.sourceId ?? undefined,
          name: item.product_name,
          price: parseFloat(item.product_price),
          quantity: item.quantity,
          variant_id: item.variant_id,
        };
      }),
      subtotal,
      tax,
      total: subtotal + tax,
    };
  });

  const createdAt = new Date().toISOString();
  const res = await api.market.placeOrders(groups);
  const orders = (res.orders ?? []).map(adaptOrder);
  const alerts: MarketOrderAlert[] = (res.alerts ?? []).map((a) => ({
    shop_id: String(a.shop_id ?? ""),
    shop_name: String(a.shop_name ?? ""),
    owner: "",
    message: String(a.message ?? ""),
    amount: Number(a.amount ?? 0),
    sentAt: String(a.sentAt ?? createdAt),
  }));

  const result: MarketCheckoutResult = {
    order_id: orders[0]?.id ?? `MC-ORD-${Date.now()}`,
    createdAt,
    payment_method: input.payment_method,
    items: input.items,
    subtotal: groups.reduce((s, g) => s + g.subtotal, 0),
    tax: groups.reduce((s, g) => s + g.tax, 0),
    total: groups.reduce((s, g) => s + g.total, 0),
    alerts,
    orders,
  };

  marketOrdersStore.setState({
    orders: [...orders, ...marketOrdersStore.getState().orders],
  });

  return result;
};
