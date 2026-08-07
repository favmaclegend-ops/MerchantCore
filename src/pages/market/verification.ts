import type { MarketStoreProduct, MarketStoreShop } from "./demoMarketStore";
import { getProductRatings } from "./productRatings";

// Shops on the market are only "verified" when they meet the public criteria:
//   - the business must have existed for at least 5 months,
//   - it must list enough products to look established, and
//   - it must have earned popularity (seeded shops carry a large `rating` figure;
//     user shops build theirs from the engagement their products attract).
// Anything short of that stays unverified.

export const VERIFIED_MIN_AGE_MONTHS = 5;
export const VERIFIED_MIN_PRODUCTS = 5;
export const VERIFIED_MIN_POPULARITY = 10;

export const getShopAgeMonths = (createdAt?: string): number => {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return (Date.now() - created) / (1000 * 60 * 60 * 24 * 30.4375);
};

export const getShopProducts = (
  shop: MarketStoreShop,
  products: MarketStoreProduct[],
): MarketStoreProduct[] =>
  products.filter(
    (p) => p.group_id === shop.product_id || p.shop_name === shop.shop_name,
  );

export const getShopPopularity = (
  shop: MarketStoreShop,
  products: MarketStoreProduct[],
): number => {
  const stored = parseInt(shop.rating ?? "", 10);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return getShopProducts(shop, products).reduce(
    (sum, p) => sum + getProductRatings(p).count,
    0,
  );
};

export const isShopVerified = (
  shop: MarketStoreShop,
  products: MarketStoreProduct[],
): boolean =>
  getShopAgeMonths(shop.createdAt) >= VERIFIED_MIN_AGE_MONTHS &&
  getShopProducts(shop, products).length >= VERIFIED_MIN_PRODUCTS &&
  getShopPopularity(shop, products) >= VERIFIED_MIN_POPULARITY;
