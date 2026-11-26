// Configuració dels formularis de viatgers (Rimu Viatges i agències associades)
window.RIMU = {
  SUPABASE_URL: "https://ewcrlyoiyfcbzjsqaqzr.supabase.co",
  SUPABASE_KEY: "sb_publishable_fEZ3TlyG9yWIw1QM_DQhLA_FwpdQn5C"
};

// Aplica el logo i els colors d'una agència a la pàgina
window.aplicarMarca = function(ag){
  if(!ag) return;
  const r = document.documentElement.style;
  r.setProperty("--blau", ag.color);
  r.setProperty("--blau-fosc", ag.color_fosc);
  r.setProperty("--blau-clar", ag.color_clar);
  r.setProperty("--coral", ag.accent);
  r.setProperty("--coral-clar", ag.accent_clar);
  // Agència sense logo: es mostra el nom en lletres
  if(ag && ag.logo_fitxer === "" && !ag.logo_url){
    document.querySelectorAll("img.logo").forEach(i => {
      i.style.display = "none";
      let t = i.nextElementSibling;
      if(!t || !t.classList.contains("logo-text")){ t = document.createElement("div"); t.className = "logo-text"; t.style.cssText = "font-size:24px;font-weight:800;color:var(--blau);padding:6px 0;text-align:center"; i.after(t); }
      t.textContent = ag.nom || "";
    });
    return;
  }
  // Logo pujat des del panell d'agències (una imatge normal)
  if(ag.logo_url){
    document.querySelectorAll("img.logo").forEach(i => { i.src = ag.logo_url; i.alt = ag.nom; i.style.visibility = "visible"; i.style.display = "";
        const t = i.nextElementSibling; if(t && t.classList.contains("logo-text")) t.remove(); });
    return;
  }
  // El logo pot venir en un sol arxiu o en diverses parts separades per comes
  const fitxers = (ag.logo_fitxer || "logo.js").split(",").map(f => f.trim().replace(/[^a-z0-9._-]/gi, "")).filter(Boolean);
  let pendents = fitxers.length;
  window.LOGO_PARTS = [];
  const mostrar = () => {
    const src = window.LOGO_PARTS.length ? window.LOGO_PARTS.join("") : window.RIMU_LOGO;
    document.querySelectorAll("img.logo").forEach(i => { i.src = src; i.alt = ag.nom; i.style.visibility = "visible"; });
  };
  fitxers.forEach(f => {
    const s = document.createElement("script");
    s.src = f;
    s.onload = () => { if(--pendents === 0) mostrar(); };
    document.head.appendChild(s);
  });
};

// ---- Tarifes ----
// "agent": preus per als agents de Rimu Viatges (enllaços de sempre)
// "web":   preus per a les agències que arriben des de la pàgina pública d'Anonta (enllaços amb ?web), amb IVA inclòs
window.TARIFES = {
  agent: { formularis: 5, anonta: { basic: 20, premium: 25 }, itineraris: { basic: 10, premium: 15 } },
  web:   { formularis: 9, anonta: { basic: 29, premium: 39 }, itineraris: { basic: 15, premium: 22 } },
  descomptePack: 10   // % de descompte si contracten les 3 apps
};
(function(){
  const CLAU = "anonta_tarifa";
  const q = new URLSearchParams(location.search);
  try{
    if(q.has("web")) localStorage.setItem(CLAU, JSON.stringify({ m: "web", t: Date.now() }));
    if(q.has("agent")) localStorage.removeItem(CLAU);
  }catch(e){}
  let web = false;
  try{ const x = JSON.parse(localStorage.getItem(CLAU) || "null"); web = !!x && x.m === "web" && Date.now() - x.t < 7 * 864e5; }catch(e){}
  window.TARIFA_WEB = web;
  // Només a les demos: es canvien els preus d'agent pels de la web
  const esDemo = /demo/.test(location.search) || /demo\.html$/.test(location.pathname);
  if(!web || !esDemo) return;
  const A = TARIFES.agent, W = TARIFES.web, p = location.pathname;
  const mapa = /\/anonta\//.test(p) ? { [A.anonta.basic]: W.anonta.basic, [A.anonta.premium]: W.anonta.premium }
    : /\/itineraris\//.test(p) ? { [A.itineraris.basic]: W.itineraris.basic, [A.itineraris.premium]: W.itineraris.premium }
    : { [A.formularis]: W.formularis };
  const fets = new WeakSet();
  // (els preus "web" ja porten l'IVA inclòs)
  const re = /(^|[^\d.,])(\d+) €(?=\s*$|\s*\/\s*mes)/g;
  const canvia = arrel => {
    const w = document.createTreeWalker(arrel, NodeFilter.SHOW_TEXT);
    let n;
    while((n = w.nextNode())){
      if(fets.has(n) || !/€|IVA/.test(n.data)) continue;
      const nou = n.data.replace(re, (m, a, num) => mapa[num] != null ? `${a}${mapa[num]} €` : m)
        .replace(/\+\s?IVA/g, "IVA incl.").replace(/Preus sense IVA/g, "Preus amb IVA inclòs").replace(/Precios sin IVA/g, "Precios con IVA incluido")
        .replace(/sense IVA/g, "IVA inclòs").replace(/sin IVA/g, "IVA incluido");
      if(nou !== n.data){ n.data = nou; }
      fets.add(n);
    }
  };
  const inici = () => {
    canvia(document.body);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(x => {
      if(x.nodeType === 3){ if(x.parentNode) canvia(x.parentNode); } else if(x.nodeType === 1) canvia(x);
    }))).observe(document.body, { childList: true, subtree: true });
  };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", inici); else inici();
})();

// ---- Enllaç a les condicions legals a les sol·licituds de prova (#pAccepto) ----
(function(){
  const posa = () => {
    const c = document.getElementById("pAccepto");
    if(!c || c.dataset.legal) return;
    c.dataset.legal = "1";
    const es = (document.documentElement.lang || "es") !== "ca";
    const p = document.createElement("p");
    p.className = "ajuda";
    p.style.cssText = "margin:6px 0 0;font-size:13px";
    const u = location.origin + "/legal.html";
    p.innerHTML = es
      ? `Al solicitar la prueba aceptas también las <a href="${u}#condiciones" target="_blank" rel="noopener">condiciones de contratación</a> (incluido el <a href="${u}#encargo" target="_blank" rel="noopener">encargo del tratamiento</a> de los datos de tus clientes) y la <a href="${u}#privacidad" target="_blank" rel="noopener">política de privacidad</a>.`
      : `En sol·licitar la prova acceptes també les <a href="${u}#condiciones" target="_blank" rel="noopener">condicions de contractació</a> (inclòs l'<a href="${u}#encargo" target="_blank" rel="noopener">encàrrec del tractament</a> de les dades dels teus clients) i la <a href="${u}#privacidad" target="_blank" rel="noopener">política de privacitat</a>.`;
    (c.closest("label") || c).after(p);
  };
  const inici = () => { posa(); new MutationObserver(posa).observe(document.body, { childList: true, subtree: true }); };
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", inici); else inici();
})();
