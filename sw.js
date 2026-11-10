// Lift Log offline cache. Your logs live in the phone's local storage, not here; this only keeps the app itself available offline.
const CACHE = "liftlog-v23";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Network first so updates you push to GitHub show up. On weak gym signal it waits at most 3 s, then opens the saved copy (the download keeps going and updates it for next time).
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const net = fetch(e.request).then(r => { if (r.ok && new URL(e.request.url).origin === location.origin) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; });
  const saved = () => caches.match(e.request, { ignoreSearch: true });
  e.waitUntil(net.catch(() => {}));
  e.respondWith(Promise.race([net, new Promise(res => setTimeout(res, 3000))])
    .then(r => r || saved().then(c => c || net))
    .catch(() => saved().then(r => r || caches.match("index.html"))));
});
