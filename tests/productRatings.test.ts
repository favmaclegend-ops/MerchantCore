import { beforeEach, describe, expect, it } from "vitest";
import type { MarketStoreProduct } from "@/pages/market/demoMarketStore";
import {
  getProductRatings,
  getRaterKey,
  setProductRating,
} from "@/pages/market/productRatings";

const product: MarketStoreProduct = {
  group_id: "grp",
  product_id: "mc_test-1",
  product_name: "Fresh Milk",
  product_rating: "0",
  inStock: true,
  shop_name: "Sunrise Mart",
  product_price: "2.99",
  category: "Dairy",
};

beforeEach(() => {
  localStorage.clear();
});

describe("productRatings", () => {
  it("starts unrated with empty stroke state", () => {
    const ratings = getProductRatings(product, "user:1");
    expect(ratings.userRating).toBeUndefined();
    expect(ratings.count).toBe(0);
    expect(ratings.average).toBe(0);
    expect(ratings.levels.every((l) => l.count === 0)).toBe(true);
  });

  it("persists a rating and reflects it as filled stars", () => {
    setProductRating(product.product_id, "user:1", 4);
    const ratings = getProductRatings(product, "user:1");
    expect(ratings.userRating).toBe(4);
    expect(ratings.count).toBe(1);
    expect(ratings.average).toBe(4);
  });

  it("replaces the rater's previous rating instead of double counting", () => {
    setProductRating(product.product_id, "user:1", 2);
    setProductRating(product.product_id, "user:1", 5);
    const ratings = getProductRatings(product, "user:1");
    expect(ratings.userRating).toBe(5);
    expect(ratings.count).toBe(1);
    expect(ratings.average).toBe(5);
  });

  it("aggregates ratings from different users", () => {
    setProductRating(product.product_id, "user:1", 5);
    setProductRating(product.product_id, "user:2", 3);
    const ratings = getProductRatings(product, "user:1");
    expect(ratings.count).toBe(2);
    expect(ratings.average).toBe(4);
  });

  it("keeps the seeded breakdown for products with historical ratings", () => {
    const seeded: MarketStoreProduct = { ...product, product_rating: "2500" };
    const ratings = getProductRatings(seeded, "user:1");
    expect(ratings.count).toBeGreaterThan(2400);
    expect(ratings.count).toBeLessThan(2600);
    expect(ratings.average).toBeGreaterThan(1);
    expect(ratings.average).toBeLessThan(5);
    expect(ratings.levels.reduce((a, l) => a + l.count, 0)).toBe(ratings.count);
  });

  it("derives the rater key from the account owner key", () => {
    expect(getRaterKey({ id: "abc" })).toBe("user:abc");
    expect(getRaterKey(null, null, null)).toBe("user:guest");
  });
});
