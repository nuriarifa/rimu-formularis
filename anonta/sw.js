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

// Notificacions al mòbil (missatges del xat, documents nous, canvis, recordatoris)
self.addEventListener("push", e => {
  let d = {};
  try{ d = e.data ? e.data.json() : {}; }catch(_){ d = { titol: "Anonta", cos: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titol || "Anonta", {
    body: d.cos || "", tag: d.tag || undefined, renotify: !!d.tag,
    data: { url: new URL(d.url || "./", self.registration.scope).href }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(llista => {
    const cami = u => new URL(u).pathname.replace(/index\.html$/, "");
    for(const c of llista){
      if(cami(c.url) === cami(url) && "focus" in c){ if(c.navigate) c.navigate(url).catch(() => {}); return c.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
