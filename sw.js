// Offline support. Bump VERSION whenever you upload new app files.
const VERSION = "mbc-v6-2";
const FILES = ["./", "./index.html", "./app.html", "./firebase-config.js", "./manifest.json", "./icon-192.png", "./icon-512.png",
  "./firebase-app-compat.js", "./firebase-auth-compat.js", "./firebase-firestore-compat.js"];
const APP_PATHS = FILES.map(f => new URL(f, self.location).pathname);

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Only the app's own files are cached. Everything else (Google Sheet, Firebase) always goes to the network.
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || !APP_PATHS.includes(url.pathname)) return;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => null);
      return cached || (await fresh) || cache.match("./index.html");
    })
  );
});
