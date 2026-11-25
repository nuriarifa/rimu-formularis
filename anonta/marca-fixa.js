// Anonta · Icona i nom de l'app quan el client l'instal·la al mòbil.
// Es carrega dues vegades a index.html:
//  1) al <head>, abans de tot: si l'agència és Rimu Viatges (o la darrera agència vista), ja hi posa la seva fitxa d'instal·lació;
//  2) després d'app.js: quan l'app posa la fitxa d'instal·lació, per a Rimu i per a Anonta hi deixa els fitxers fixos
//     (manifest-rimu.webmanifest i manifest.webmanifest), que el mòbil llegeix millor que els generats al moment.
(function(){
  const posar = (rel, href) => {
    let l = document.querySelector(`link[rel="${rel}"]`);
    if(!l){ l = document.createElement("link"); l.rel = rel; document.head.appendChild(l); }
    if(l.getAttribute("href") !== href) l.href = href;
  };
  const desa = (k, v) => { try{ localStorage.setItem(k, v); }catch{} };
  const llegeix = k => { try{ return localStorage.getItem(k); }catch{ return null; } };

  // ---- 1) Al principi de la pàgina ----
  if(typeof posarLink !== "function"){
    const p = new URLSearchParams(location.search);
    if(p.has("demo")) return;
    const id = p.get("a") || llegeix("anonta-agencia");
    if(id === "rimu"){
      posar("manifest", "manifest-rimu.webmanifest");
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute("content", "Rimu Viatges");
      return;
    }
    let c = null; try{ c = JSON.parse(llegeix("anonta-marca-icones") || "null"); }catch{}
    if(id && c && c.id === id){
      posar("manifest", c.manifest); if(c.apple) posar("apple-touch-icon", c.apple);
      document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute("content", c.titol || "");
    }
    return;
  }

  // ---- 2) Després d'app.js ----
  if(typeof DEMO !== "undefined" && DEMO) return;
  const original = posarLink;
  posarLink = function(rel, href){
    const m = S.marca, propia = !!(m && m.propia !== false);
    if(rel === "manifest"){
      if(propia && m.id === "rimu") href = "manifest-rimu.webmanifest";
      else if(!propia) href = "manifest.webmanifest";
    }
    original(rel, href);
    // Altres agències: la fitxa es fa a partir del seu logo; la guardem per tenir-la ja des del principi la propera vegada
    if(rel === "manifest" && propia && m.id !== "rimu" && /^data:/.test(href))
      desa("anonta-marca-icones", JSON.stringify({ id: m.id, manifest: href, apple: document.querySelector('link[rel="apple-touch-icon"]')?.href, titol: m.nom }));
  };
})();
