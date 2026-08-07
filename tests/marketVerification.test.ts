import { beforeEach, describe, expect, it } from "vitest";
import type { MarketStoreProduct, MarketStoreShop } from "@/pages/market/demoMarketStore";
import { setProductRating } from "@/pages/market/productRatings";
import {
  getShopAgeMonths,
  getShopPopularity,
  isShopVerified,
  VERIFIED_MIN_AGE_MONTHS,
  VERIFIED_MIN_PRODUCTS,
  VERIFIED_MIN_POPULARITY,
} from "@/pages/market/verification";

const shop: MarketStoreShop = {
  shop_id: "my_shop@123",
  shop_name: "My Shop",
  owner: "Me",
  product_id: "my_shop_products@123",
  rating: "0",
  createdAt: new Date().toISOString().slice(0, 10),
};

const makeProduct = (id: string): MarketStoreProduct => ({
  group_id: shop.product_id,
  product_id: id,
  product_name: `Item ${id}`,
  product_rating: "0",
  inStock: true,
  shop_name: shop.shop_name,
  product_price: "10",
  category: "General",
});

const withAge = (monthsAgo: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - Math.round(monthsAgo));
  return d.toISOString().slice(0, 10);
};

beforeEach(() => {
  localStorage.clear();
});

describe("verification", () => {
  it("a brand-new shop is never verified", () => {
    const products = Array.from({ length: 10 }, (_, i) => makeProduct(`p${i}`));
    expect(isShopVerified(shop, products)).toBe(false);
  });

  it("an old shop with few products stays unverified", () => {
    const old = { ...shop, createdAt: withAge(24) };
    expect(isShopVerified(old, [makeProduct("p1")])).toBe(false);
  });

  it("an old shop with enough products but no popularity stays unverified", () => {
    const old = { ...shop, createdAt: withAge(24) };
    const products = Array.from({ length: VERIFIED_MIN_PRODUCTS }, (_, i) =>
      makeProduct(`p${i}`),
    );
    expect(isShopVerified(old, products)).toBe(false);
  });

  it("verifies an established shop that meets every criterion", () => {
    const old = { ...shop, createdAt: withAge(24), rating: "204000" };
    const products = Array.from({ length: VERIFIED_MIN_PRODUCTS }, (_, i) =>
      makeProduct(`p${i}`),
    );
    expect(isShopVerified(old, products)).toBe(true);
  });

  it("verifies a user shop that earned enough popularity from product ratings", () => {
    const old = { ...shop, createdAt: withAge(24) };
    const products = Array.from({ length: VERIFIED_MIN_PRODUCTS }, (_, i) =>
      makeProduct(`p${i}`),
    );
    for (let i = 0; i < VERIFIED_MIN_POPULARITY; i++) {
      setProductRating(products[i % products.length].product_id, `user:${i}`, 5);
    }
    expect(getShopPopularity(old, products)).toBeGreaterThanOrEqual(
      VERIFIED_MIN_POPULARITY,
    );
    expect(isShopVerified(old, products)).toBe(true);
  });

  it("requires at least 5 months of history", () => {
    const young = { ...shop, createdAt: withAge(2) };
    const mature = { ...shop, createdAt: withAge(8) };
    const products = Array.from({ length: VERIFIED_MIN_PRODUCTS }, (_, i) =>
      makeProduct(`p${i}`),
    );
    for (let i = 0; i < VERIFIED_MIN_POPULARITY; i++) {
      setProductRating(products[i % products.length].product_id, `user:${i}`, 5);
    }
    expect(isShopVerified(young, products)).toBe(false);
    expect(isShopVerified(mature, products)).toBe(true);
  });

  it("computes shop age in months", () => {
    expect(getShopAgeMonths(undefined)).toBe(0);
    expect(getShopAgeMonths(withAge(12))).toBeGreaterThan(VERIFIED_MIN_AGE_MONTHS);
    expect(getShopAgeMonths(withAge(0))).toBeLessThan(1);
  });
});
