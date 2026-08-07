import type { MarketStoreProduct, MarketStoreShop } from "./demoMarketStore";

export const valueFormater = (value: string, fixed: number = 2) => {
  const parseValue = parseFloat(value);
  if (!parseValue) return "0";
  if (parseValue >= 1000000000000)
    return `${(parseValue / 1000000000).toFixed(fixed)}T`;
  if (parseValue >= 1000000000)
    return `${(parseValue / 1000000000).toFixed(fixed)}B`;
  if (parseValue >= 1000000) return `${(parseValue / 1000000).toFixed(fixed)}M`;
  if (parseValue >= 1000) return `${(parseValue / 1000).toFixed(fixed)}K`;
  else return `${parseValue.toFixed(fixed)}`;
};

export const formatDate = (date?: string) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const getProductImages = (product?: MarketStoreProduct): string[] => {
  if (!product) return [];
  if (product.productImages?.length) return product.productImages;
  if (product.productImageUrl) return [product.productImageUrl];
  return [];
};

export const resolveShopForProduct = (
  shops: Record<string, MarketStoreShop>,
  product?: MarketStoreProduct,
): MarketStoreShop | undefined => {
  if (!product) return undefined;
  return Object.values(shops).find(
    (shop) => shop.shop_id === product.group_id || shop.product_id === product.group_id,
  );
};

export interface RatingLevel {
  star: number;
  count: number;
}

export const getRatingBreakdown = (
  rating: string,
  seed: string,
): { levels: RatingLevel[]; average: number } => {
  const total = Math.max(0, parseInt(rating, 10) || 0);
  let h = seed.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
  const weights = Array.from({ length: 5 }, () => {
    h = (h * 9301 + 49297) % 233280;
    return (h % 100) + 10;
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.round((w / sum) * total));
  const levels: RatingLevel[] = [5, 4, 3, 2, 1].map((star, i) => ({
    star,
    count: counts[i],
  }));
  const counted = counts.reduce((a, b) => a + b, 0) || 1;
  const average =
    levels.reduce((acc, l) => acc + l.star * l.count, 0) / counted || 0;
  return { levels, average };
};

