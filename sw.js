const CACHE = "codenames-v19";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./words.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./red-agent-a.jpg",
  "./red-agent-b.jpg",
  "./red-agent-c.jpg",
  "./blue-agent-a.jpg",
  "./blue-agent-b.jpg",
  "./blue-agent-c.jpg",
  "./civilian-a.jpg",
  "./civilian-b.jpg",
  "./civilian-c.jpg",
  "./civilian-d.jpg",
  "./assassin.jpg",
  "./overlay-spy-left.png",
  "./overlay-spy-right.png",
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
      return cached || fetched;
    })
  );
});
