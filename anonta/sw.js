// Anonta: permet instal·lar l'app. Sempre intenta la xarxa primer (dades al dia);
// si no hi ha connexió, mostra l'última versió guardada de les pàgines de l'app.
const CACHE = "anonta-v1";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return; // Supabase i fitxers: sempre directes
  e.respondWith(
    fetch(req).then(res => {
      if(res.ok){ const c = res.clone(); caches.open(CACHE).then(cache => cache.put(req, c)); }
      return res;
    }).catch(() => caches.match(req))
  );
});
