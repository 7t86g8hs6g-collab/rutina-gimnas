// Service Worker per a la Rutina de Gimnàs — funcionament offline
const CACHE_NAME = "rutina-gimnas-v1";
const APP_SHELL = [
  "./",
  "./RUTINA_GIMNAS_V23.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Afegim cada fitxer per separat: si algun no existeix (p.ex. "./"
      // si no hi ha index.html), no volem que falli tota la instal·lació.
      return Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch(() => {
            /* ignorem els que no es puguin desar */
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratègia: cache-first amb actualització en segon pla (stale-while-revalidate)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached); // sense connexió: ens quedem amb la còpia en cau

      return cached || networkFetch;
    })
  );
});
