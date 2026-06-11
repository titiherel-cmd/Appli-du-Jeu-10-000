// ⬆️ Incrémente ce numéro à chaque déploiement pour forcer la mise à jour
const CACHE_VERSION = 2;
const CACHE = `10000-v${CACHE_VERSION}`;
const ASSETS = ['/index.html', '/manifest.json'];

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

// Fetch : stratégie Network First
// → Essaie le réseau en priorité, sinon sert depuis le cache
self.addEventListener('fetch', e => {
  // On ignore les requêtes non-GET et les extensions Chrome
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension://')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Si la réponse réseau est valide, on met à jour le cache
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Pas de réseau → on sert depuis le cache
        return caches.match(e.request).then(r => r || caches.match('/index.html'));
      })
  );
});
