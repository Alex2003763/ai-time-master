// This is the "Offline copy of pages" service worker

// It's a good practice to have separate cache names for different types of assets.
const CACHE_PAGES = "atm-pages-v1";
const CACHE_STATIC = "atm-static-v1";
const CACHE_IMAGES = "atm-images-v1";

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

if (workbox) {
  console.log(`Workbox is loaded and ready to work offline.`);

  // This allows the new service worker to take control of the page immediately.
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  });

  // The original route `new RegExp('/*')` was too broad and caused errors by trying
  // to cache requests with unsupported schemes like 'chrome-extension://'.
  // The following, more specific routes fix this issue and are a PWA best practice.

  // 1. For navigation requests (the HTML page), use a NetworkFirst strategy.
  // This ensures users see the latest content if they are online, but can
  // still load the app from the cache if they are offline.
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_PAGES,
    })
  );

  // 2. For CSS, JavaScript, and other static assets, use a StaleWhileRevalidate strategy.
  // This serves content from the cache first for a fast experience, then updates
  // the cache in the background with the latest version from the network.
  // We only cache assets from our own origin and our trusted CDN.
  workbox.routing.registerRoute(
    ({ request, url }) =>
      (request.destination === 'script' || request.destination === 'style') &&
      (url.origin === self.location.origin || url.origin === 'https://aistudiocdn.com'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: CACHE_STATIC,
      plugins: [
        // Ensure that we only cache successful responses (including opaque responses from CDNs).
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 3. For images, use a CacheFirst strategy.
  // Once an image is in the cache, it will be served from there, which is ideal
  // for assets that don't change often.
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_IMAGES,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          // Only cache up to 50 images.
          maxEntries: 50,
          // Cache for up to 30 days.
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );
} else {
  console.log(`Workbox failed to load, offline functionality will be limited.`);
}