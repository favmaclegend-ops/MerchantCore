import { createStore } from "elk-components";
import type { MarketStoreProduct, MarketStoreShop } from "./demoMarketStore";
import { marketStore } from "./demoMarketStore";
import { resolveShopForProduct } from "./market";

export interface MarketCartItem {
  product_id: string;
  group_id: string;
  shop_id: string;
  shop_name: string;
  product_name: string;
  product_price: string;
  quantity: number;
}

export interface MarketCartState extends Record<string, unknown> {
  items: MarketCartItem[];
}

export const marketCartStore = createStore<MarketCartState>({ items: [] });

export const DEFAULT_TAX_RATE = 0.05;

export const buildMarketCartItem = (
  product: MarketStoreProduct,
  shops: Record<string, MarketStoreShop>,
): MarketCartItem => {
  const shop = resolveShopForProduct(shops, product);
  return {
    product_id: product.product_id,
    group_id: product.group_id,
    shop_id: shop?.shop_id ?? product.group_id,
    shop_name: shop?.shop_name ?? product.shop_name,
    product_name: product.product_name,
    product_price: product.product_price,
    quantity: 1,
  };
};

export const addToMarketCart = (
  product: MarketStoreProduct,
  quantity: number = 1,
): boolean => {
  if (!product.inStock) return false;
  const item = buildMarketCartItem(product, marketStore.getState().shops);
  const existing = marketCartStore
    .getState()
    .items.find((i) => i.product_id === product.product_id);
  const items = existing
    ? marketCartStore
        .getState()
        .items.map((i) =>
          i.product_id === product.product_id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        )
    : [...marketCartStore.getState().items, item];
  marketCartStore.setState({ items });
  return true;
};

export const updateMarketCartQuantity = (productId: string, delta: number): void => {
  const items = marketCartStore
    .getState()
    .items.map((item) =>
      item.product_id === productId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item,
    )
    .filter((item) => item.quantity > 0);
  marketCartStore.setState({ items });
};

export const removeFromMarketCart = (productId: string): void => {
  marketCartStore.setState({
    items: marketCartStore
      .getState()
      .items.filter((item) => item.product_id !== productId),
  });
};

export const clearMarketCart = (): void => {
  marketCartStore.setState({ items: [] });
};

export interface MarketCartTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export const getMarketCartTotals = (
  items: MarketCartItem[],
  taxRate: number = DEFAULT_TAX_RATE,
): MarketCartTotals => {
  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.product_price) * item.quantity,
    0,
  );
  const tax = subtotal * taxRate;
  return { subtotal, tax, total: subtotal + tax };
};

export const getMarketCartCount = (items: MarketCartItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity, 0);
