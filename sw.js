/* YT Premium Lite service worker — app-shell offline cache.
   Network-first cho same-origin GET: luôn ưu tiên bản mới nhất,
   chỉ fallback sang cache khi offline. Version bump mỗi khi đổi assets. */
const CACHE = 'yt-lite-v3';
const ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Only cache same-origin GET (app shell). YouTube/API/embeds always go to network.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    // Network-first: tránh serving stale app.js sau mỗi lần deploy;
    // offline mới dùng cache (app shell vẫn hoạt động khi mất mạng).
    fetch(e.request).then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then((cached) => cached || caches.match('./index.html')))
  );
});
