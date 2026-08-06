import { useEffect, useState } from "react";
import { marketStore } from "./demoMarketStore";
import { fetchMarketData } from "./marketApi";

let marketDataPromise: Promise<unknown> | null = null;

export function useMarketData() {
  const [loading, setLoading] = useState(
    () => marketStore.getState().products.length > 0,
  );
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let mounted = true;

    if (!marketDataPromise) {
      marketDataPromise = fetchMarketData()
        .then((data) => marketStore.setState(data))
        .catch((err) => {
          marketDataPromise = null;
          throw err;
        });
    }

    marketDataPromise
      .then(() => {
        if (mounted) setLoading(false);
      })
      .catch((err) => {
        if (mounted) setError(err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { loading, error };
}
