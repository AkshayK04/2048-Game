const CACHE_NAME = "2048-cache-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./manifest.json",
  "/sounds/click.mp3",
  "./Icon/game.svg"
];


  // 🎨 assets (IMPORTANT for your setup)
  "./Icon/game.svg"
];

/* INSTALL SERVICE WORKER */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

/* ACTIVATE & CLEAN OLD CACHE */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );

  self.clients.claim();
});

/* FETCH STRATEGY */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cache first
      if (cachedResponse) return cachedResponse;

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          // fallback (optional)
          if (event.request.destination === "document") {
            return caches.match("./index.html");
          }
        });
    })
  );
});