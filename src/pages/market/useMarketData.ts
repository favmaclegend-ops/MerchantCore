import { useEffect, useState } from "react";
import { marketStore } from "./demoMarketStore";
import { fetchMarketData } from "./marketApi";

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
          if (mounted) marketStore.setState({ ...data, fetchError: null });
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), FETCH_TIMEOUT_MS),
        ),
      ]).catch((err) => {
        if (!mounted) return;
        const msg =
          err?.message === "timeout"
            ? "Connection timed out. Please check your internet connection."
            : "Failed to load market data. Please check your connection.";
        marketStore.setState({ fetchError: msg });
        setError(msg);
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
