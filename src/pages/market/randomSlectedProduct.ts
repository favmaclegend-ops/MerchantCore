import { marketStore, type MarketStoreProduct } from "./demoMarketStore";

interface Chunck {
  size?: number;
  start?: number;
  end?: number;
}

export const getRandomProduct = (): MarketStoreProduct[] | undefined => {
  const products = marketStore.getState().products;
  if (products.length === 0) return undefined;
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10);
};

export const getProductsByChunck = async ({
  start,
  end,
}: Chunck): Promise<MarketStoreProduct[]> => {
  const store = marketStore.getState().products;
  const product = store?.slice(start ?? 0, end ?? store.length);
  const resolveProduct = await Promise.resolve(product);
  return resolveProduct;
};
