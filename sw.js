// NMS Icon Pack — Service Worker v9.0
const CACHE = 'nms-icon-pack-v35';

// 2026-10-14: downloads (zips, videos, fonts, xml) are never kept in the app's cache -- they already
// go to the phone's Downloads folder, so caching them too doubled the storage the app used.
const NO_CACHE_RE = /\.(zip|mp4|webm|mov|ttf|otf|xml|apk)(\?|$)/i;
const MAX_CACHE_BYTES = 1.5 * 1024 * 1024; // anything bigger than this is fetched fresh, not stored

const CORE_FILES = [
  '/',
  '/index.html',
  '/preview.html',
  '/manifest.json',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
];

// Install — cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      console.log('NMS PWA: Caching core files');
      return cache.addAll(CORE_FILES);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    // Give back space taken by downloads an older version of this worker cached.
    try {
      const c = await caches.open(CACHE);
      for (const req of await c.keys()) if (NO_CACHE_RE.test(req.url)) await c.delete(req);
    } catch (err) {}
  })());
  self.clients.claim();
});

// Fetch — HTML pages go network-first (so updates show immediately); everything else stays cache-first
self.addEventListener('fetch', e => {
  // Skip non-GET and chrome-extension requests
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  // HTML documents (index.html, preview.html): always try the network first
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // Downloads: straight from the network, never stored in the app cache.
  if (NO_CACHE_RE.test(e.request.url)) return;
  // Live data (Galactic Atlas proxy, used by countdown.html): always fresh from the network.
  if (new URL(e.request.url).pathname.startsWith('/nms-api/')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful responses
        const len = +(response && response.headers.get('content-length')) || 0;
        if (response && response.status === 200 && response.type === 'basic' && len <= MAX_CACHE_BYTES) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (e.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// 2026-10-09: RETIRED_HOST — on the old *.netlify.app address this worker cleans up after itself:
// drops any push sign-up (so alerts don't arrive twice once the app is reinstalled from
// https://theme.nomansskyhub.app), clears its caches, unregisters and sends open windows to the new address.
if (/\.netlify\.app$/.test(self.location.hostname)) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', e => e.waitUntil((async () => {
    try {
      const s = self.registration.pushManager && await self.registration.pushManager.getSubscription();
      if (s) {
        await fetch('/api/push-subscribe', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: s.endpoint }) }).catch(() => {});
        await s.unsubscribe();
      }
    } catch (err) {}
    try { for (const k of await caches.keys()) await caches.delete(k); } catch (err) {}
    await self.registration.unregister();
    const wins = await self.clients.matchAll({ type: 'window' });
    wins.forEach(c => { const u = new URL(c.url); c.navigate('https://theme.nomansskyhub.app' + u.pathname + u.search).catch(() => {}); });
  })()));
}

// --- Push alerts (2026-10-23): sent by the Weather station's alert server, signed up via nms-push.js ---
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: '◈ No Man\'s Sky Hub', body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(data.title || '◈ No Man\'s Sky Hub', {
    body: data.body || '', icon: data.icon || 'pwa/icon-192.png', badge: 'badge-96.png', tag: data.tag || 'nms-alert', data: data.url || './'
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const abs = new URL(event.notification.data || './', self.registration.scope);
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.split('#')[0] === abs.href && 'focus' in c) return c.focus(); }
    return clients.openWindow ? clients.openWindow(abs.href) : null;
  }));
});
