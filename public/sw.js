/* Merchant Core service worker
 * - Pre-caches the app shell once installed.
 * - Network-first for navigations with a cached + offline page fallback.
 * - Runtime caches successful same-origin requests so recently visited pages
 *   stay available offline.
 */
const VERSION = "v1.0.0";
const APP_SHELL_CACHE = `merchant-core-shell-${VERSION}`;
const RUNTIME_CACHE = `merchant-core-runtime-${VERSION}`;
const OFFLINE_PAGE = "/offline.html";

const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/favicon.svg",
  "/icons/icon.svg",
  "/icons/mask-icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // App navigations (HTML documents).
  if (request.mode === "navigate") {
    event.respondWith(networkFirstForNavigation(request));
    return;
  }

  // Static assets / API-style requests: cache-first with network refresh.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirstRefreshInBackground(request));
    return;
  }

  // Everything else: stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstForNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const copy = networkResponse.clone();
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, copy).catch(() => {});
      return networkResponse;
    }
    throw new Error("Navigation failed");
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    // Fully offline: show the dedicated offline page.
    const offline = await caches.match(OFFLINE_PAGE);
    if (offline) return offline;
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}

async function cacheFirstRefreshInBackground(request) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
      }
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    // Refresh the cache but don't block the user on the network.
    networkPromise.catch(() => {});
    return cached;
  }
  const network = await networkPromise;
  if (network) return network;
  return cached;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
      }
      return response;
    })
    .catch(() => undefined);
  if (cached) return cached;
  return (await networkPromise) || cached;
}
