// ⬆️ Incrémente ce numéro à chaque déploiement pour forcer la mise à jour
const CACHE_VERSION = 3;
const CACHE = `10000-v${CACHE_VERSION}`;
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

// Installation : mise en cache des ressources statiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting(); // Active immédiatement le nouveau SW
});

// Activation : supprime les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // Prend le contrôle des onglets ouverts
});

// Fetch : stratégie Cache First pour les assets, Network First sinon
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension://')) return;
  // Ignore les requêtes cross-origin (Google Fonts, etc.)
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      });
      return cached || network;
    })
  );
});
