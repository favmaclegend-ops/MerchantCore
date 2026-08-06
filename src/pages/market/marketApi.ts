import { marketData } from "./demoMarketStore";
import type {
  MarketStore,
  MarketStoreAdvert,
  MarketStoreProduct,
  MarketStoreShop,
} from "./demoMarketStore";

const LATENCY = 600;

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

const delay = <T>(data: T, ms: number = LATENCY): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(clone(data)), ms));

export const fetchMarketData = (): Promise<MarketStore> => delay(marketData);

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
