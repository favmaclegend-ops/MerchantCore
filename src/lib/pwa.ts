import { useEffect, useState } from "react";

/**
 * Registers the service worker so the app shell is cached and the app can
 * serve its offline page when there's no connection.
 */
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // Retry registration on next load if it failed (e.g. slow start).
      });
  };

  window.addEventListener("load", register);

  // Re-register when coming back online (covers transient failures).
  window.addEventListener("online", () => {
    if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
      window.removeEventListener("load", register);
      register();
    }
  });
}

/**
 * Tracks live connectivity. Returns true when the browser reports an
 * internet connection is available.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
