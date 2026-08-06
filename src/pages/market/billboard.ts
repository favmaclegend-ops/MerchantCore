import { useCallback, useEffect, useMemo, useState } from "react";
import type { MarketStoreAdvert } from "./demoMarketStore";

export const BILLBOARD_AD_COUNT = 3;

export type RandomSource = () => number;

export function pickBillboardAds(
  ads: MarketStoreAdvert[],
  count: number = BILLBOARD_AD_COUNT,
  random: RandomSource = Math.random,
): MarketStoreAdvert[] {
  if (ads.length === 0) return [];
  const pool = ads.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export const advertTargetUrl = (ad?: MarketStoreAdvert): string | undefined => {
  const url = ad?.visitLink?.trim();
  return url || undefined;
};

export const openAdvertTarget = (ad?: MarketStoreAdvert): void => {
  const url = advertTargetUrl(ad);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
};

export function useBillboardAds(
  ads: MarketStoreAdvert[],
  count: number = BILLBOARD_AD_COUNT,
): MarketStoreAdvert[] {
  return useMemo(() => pickBillboardAds(ads, count), [ads, count]);
}

export function useBillboardPlayer(ads: MarketStoreAdvert[]) {
  const [index, setIndex] = useState(0);
  const count = ads.length;
  const current = count > 0 ? ads[index % count] : undefined;

  const next = useCallback(() => {
    setIndex((prev) => (count > 0 ? (prev + 1) % count : 0));
  }, [count]);

  useEffect(() => {
    setIndex(0);
  }, [ads]);

  return { current, next, index };
}
