import { useEffect, useState } from "react";
import { marketStore } from "./demoMarketStore";
import { fetchMarketData } from "./marketApi";

// Clear any previously seeded demo data so the market always loads fresh data
// from the real backend.
marketStore.setState({ products: [], shops: {}, advert: [], catergories: ["All"], top4tRatingShops: [], fetchError: null });

const FETCH_TIMEOUT_MS = 12_000;

let marketDataPromise: Promise<unknown> | null = null;

export function useMarketData() {
  const [loading, setLoading] = useState(
    () => marketStore.getState().products.length === 0,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!marketDataPromise) {
      marketDataPromise = Promise.race([
        fetchMarketData().then((data) => {
          // The store is module-level, so it must be set even if the effect
          // that started this fetch was torn down (React StrictMode runs
          // effects twice in dev) — otherwise the market would look empty.
          marketStore.setState({ ...data, fetchError: null });
          return data;
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), FETCH_TIMEOUT_MS),
        ),
      ]).catch((err) => {
        const msg =
          err?.message === "timeout"
            ? "Connection timed out. Please check your internet connection."
            : "Failed to load market data. Please check your connection.";
        marketStore.setState({ fetchError: msg });
        if (mounted) setError(msg);
        marketDataPromise = null;
      });
    }

    marketDataPromise.then(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { loading, error };
}
