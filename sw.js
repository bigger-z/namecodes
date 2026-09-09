const CACHE = "codenames-v32";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./words.js",
  "./manifest.webmanifest",
  "./images/icon-192.png",
  "./images/icon-512.png",
  "./images/red-agent-a.jpg",
  "./images/red-agent-b.jpg",
  "./images/red-agent-c.jpg",
  "./images/blue-agent-a.jpg",
  "./images/blue-agent-b.jpg",
  "./images/blue-agent-c.jpg",
  "./images/civilian-a.jpg",
  "./images/civilian-b.jpg",
  "./images/civilian-c.jpg",
  "./images/civilian-d.jpg",
  "./images/assassin.jpg",
  "./images/overlay-spy-left.png",
  "./images/overlay-spy-right.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const freshFirst = /\.(?:html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith("/");

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return freshFirst ? fetched : cached || fetched;
    })
  );
});
