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
  const base = product.productImages?.length
    ? product.productImages
    : product.productImageUrl
      ? [product.productImageUrl]
      : [];
  const images = [...base];
  for (const variant of product.variants ?? []) {
    if (variant.image && !images.includes(variant.image)) {
      images.push(variant.image);
    }
  }
  return images;
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

