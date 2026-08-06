import { createStore } from "elk-components";
import { marketData, marketStore } from "./demoMarketStore";
import type {
  MarketStore,
  MarketStoreAdvert,
  MarketStoreProduct,
  MarketStoreShop,
} from "./demoMarketStore";
import { mergeUserMarketData } from "./marketUpload";
import type { MarketCartItem } from "./cart";

const LATENCY = 600;

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

const delay = <T>(data: T, ms: number = LATENCY): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(clone(data)), ms));

export const fetchMarketData = (): Promise<MarketStore> =>
  delay(mergeUserMarketData(marketData));

// Folds user-created shops + uploaded items into the market store immediately so the hub
// and shop pages reflect them without a full reload.
export const syncUserMarketData = (): void => {
  marketStore.setState(mergeUserMarketData(marketData));
};

export const fetchShops = (): Promise<MarketStoreShop[]> =>
  delay(Object.values(marketData.shops));

export const fetchShop = (id: string): Promise<MarketStoreShop | undefined> =>
  delay(marketData.shops[id]);

export const fetchProducts = (): Promise<MarketStoreProduct[]> =>
  delay(marketData.products);

export const fetchTopRatedShops = (): Promise<MarketStoreShop[]> =>
  delay(marketData.top4tRatingShops ?? []);

export const fetchAdverts = (): Promise<MarketStoreAdvert[]> =>
  delay(marketData.advert ?? []);

export const fetchCategories = (): Promise<string[]> =>
  delay(marketData.catergories ?? []);

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
    const shop = marketData.shops[group[0].shop_id];
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

  return delay(result);
};
