const CACHE_VERSION = "obaida-platform-static-v3";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/favicon.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.png?v=3",
  "/icons/icon-512.png?v=3",
  "/icons/icon-maskable-512.png?v=3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const isStatic =
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    /\.(?:css|js|svg|png|jpg|jpeg|webp|woff2?)$/i.test(url.pathname);
  if (!isStatic) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request)
        .then(async (response) => {
          // Clone before any asynchronous cache work. A stale-while-revalidate
          // request may otherwise return/consume the response before clone() runs.
          if (response.ok) {
            const responseForCache = response.clone();
            const cache = await caches.open(CACHE_VERSION);
            await cache.put(request, responseForCache);
          }
          return response;
        })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});
