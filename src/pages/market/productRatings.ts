import type { MarketStoreProduct } from "./demoMarketStore";
import { getOwnerKey } from "./marketUpload";

// User product ratings live in localStorage (like the other `merchant_*` mock stores)
// so they survive reloads. Each product keeps a map of rater -> star rating, keyed by
// the same account owner key used for shops/uploads so guests, personal logins and org
// members are kept apart. Products that already carry a historical popularity figure
// (`product_rating`) get a deterministic seed distribution on the fly, so seeded market
// items keep their existing breakdown while real user ratings layer on top of it.
// When a real backend ships, this becomes `PUT /market/products/:id/rating`.

const RATINGS_KEY = "mc_market_product_ratings_v1";

export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface RatingLevel {
  star: number;
  count: number;
}

export interface ProductRatings {
  userRating: StarRating | undefined;
  average: number;
  count: number;
  levels: RatingLevel[];
}

type RatingsState = Record<string, Partial<Record<string, StarRating>>>;

const STAR_LEVELS: StarRating[] = [5, 4, 3, 2, 1];

function readRatings(): RatingsState {
  try {
    const raw = localStorage.getItem(RATINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RatingsState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRatings(state: RatingsState): void {
  try {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (blocked/quota) — best effort, do not throw
  }
}

export const getRaterKey = (
  user?: { id?: string; email?: string } | null,
  orgUser?: { id?: string; email?: string } | null,
  orgId?: string | null,
): string => getOwnerKey(user, orgUser, orgId);

// Deterministic distribution for products that already carry a historical popularity
// figure, mirroring the previous rating breakdown so seeded items keep their look.
function seedLevels(productId: string, total: number): RatingLevel[] {
  let h = productId
    .split("")
    .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
  const weights = Array.from({ length: 5 }, () => {
    h = (h * 9301 + 49297) % 233280;
    return (h % 100) + 10;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  return STAR_LEVELS.map((star, i) => ({
    star,
    count: Math.round((weights[i] / sum) * total),
  }));
}

export function getProductRatings(
  product: MarketStoreProduct,
  raterKey?: string,
): ProductRatings {
  const ratings = readRatings()[product.product_id] ?? {};
  const userRating = raterKey ? ratings[raterKey] : undefined;
  const seedTotal = Math.max(0, parseInt(product.product_rating ?? "0", 10) || 0);
  const counts = new Map<number, number>();
  for (const level of seedLevels(product.product_id, seedTotal)) {
    counts.set(level.star, (counts.get(level.star) ?? 0) + level.count);
  }
  for (const star of Object.values(ratings)) {
    if (typeof star === "number" && star >= 1 && star <= 5) {
      counts.set(star, (counts.get(star) ?? 0) + 1);
    }
  }
  const levels: RatingLevel[] = STAR_LEVELS.map((star) => ({
    star,
    count: counts.get(star) ?? 0,
  }));
  const count = levels.reduce((a, l) => a + l.count, 0);
  const average =
    count > 0 ? levels.reduce((a, l) => a + l.star * l.count, 0) / count : 0;
  return { userRating, average, count, levels };
}

export function setProductRating(
  productId: string,
  raterKey: string,
  stars: StarRating,
): void {
  const state = readRatings();
  const productRatings = state[productId] ?? {};
  productRatings[raterKey] = stars;
  state[productId] = productRatings;
  writeRatings(state);
}
