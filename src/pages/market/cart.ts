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
  variant_id?: string;
  variant?: { size?: string; color?: string; shape?: string };
}

export interface MarketCartState extends Record<string, unknown> {
  items: MarketCartItem[];
}

export const marketCartStore = createStore<MarketCartState>({ items: [] });

export const DEFAULT_TAX_RATE = 0.05;

export const getMarketCartItemKey = (item: MarketCartItem): string =>
  item.variant_id ?? item.product_id;

export const buildMarketCartItem = (
  product: MarketStoreProduct,
  shops: Record<string, MarketStoreShop>,
  variantIndex: number = 0,
): MarketCartItem => {
  const shop = resolveShopForProduct(shops, product);
  const variant = product.variants?.[variantIndex];
  return {
    product_id: product.product_id,
    group_id: product.group_id,
    shop_id: shop?.shop_id ?? product.group_id,
    shop_name: shop?.shop_name ?? product.shop_name,
    product_name: product.product_name,
    product_price: product.product_price,
    quantity: 1,
    variant_id: variant
      ? `${product.product_id}::${variantIndex}`
      : undefined,
    variant: variant
      ? { size: variant.size, color: variant.color, shape: variant.shape }
      : undefined,
  };
};

export const addToMarketCart = (
  product: MarketStoreProduct,
  quantity: number = 1,
  variantIndex: number = 0,
): boolean => {
  if (!product.inStock) return false;
  const item = buildMarketCartItem(
    product,
    marketStore.getState().shops,
    variantIndex,
  );
  const key = getMarketCartItemKey(item);
  const existing = marketCartStore
    .getState()
    .items.find((i) => getMarketCartItemKey(i) === key);
  const items = existing
    ? marketCartStore
        .getState()
        .items.map((i) =>
          getMarketCartItemKey(i) === key
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        )
    : [...marketCartStore.getState().items, item];
  marketCartStore.setState({ items });
  return true;
};

export const updateMarketCartQuantity = (lineKey: string, delta: number): void => {
  const items = marketCartStore
    .getState()
    .items.map((item) =>
      getMarketCartItemKey(item) === lineKey
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item,
    )
    .filter((item) => item.quantity > 0);
  marketCartStore.setState({ items });
};

export const removeFromMarketCart = (lineKey: string): void => {
  marketCartStore.setState({
    items: marketCartStore
      .getState()
      .items.filter((item) => getMarketCartItemKey(item) !== lineKey),
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

/**
 * Add a product to the cart at a discounted price (used for conversation
 * discount offers). The discounted price is baked into the cart line so the
 * normal checkout flow charges the reduced amount instead of the list price.
 */
export const addDiscountedProductToCart = (
  product: MarketStoreProduct,
  discountPrice: string,
  quantity: number = 1,
): boolean => {
  const parsed = parseFloat(discountPrice);
  if (!Number.isFinite(parsed) || parsed < 0) return false;
  const discounted: MarketStoreProduct = {
    ...product,
    product_price: discountPrice,
  };
  return addToMarketCart(discounted, quantity, 0);
};
