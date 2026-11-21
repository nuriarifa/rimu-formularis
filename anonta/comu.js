// Anonta: funcions comunes (panell de l'agència i app del client)
window.AN = (function(){
  const BUCKET = "anonta";

  const TIPUS_SERVEI = {
    vol:         { ico: "✈️", ca: "Vol",          es: "Vuelo" },
    hotel:       { ico: "🏨", ca: "Allotjament",  es: "Alojamiento" },
    trasllat:    { ico: "🚐", ca: "Trasllat",     es: "Traslado" },
    tren:        { ico: "🚆", ca: "Tren",         es: "Tren" },
    cotxe:       { ico: "🚗", ca: "Cotxe de lloguer", es: "Coche de alquiler" },
    excursio:    { ico: "🧭", ca: "Excursió",     es: "Excursión" },
    creuer:      { ico: "🚢", ca: "Creuer",       es: "Crucero" },
    asseguranca: { ico: "🛡️", ca: "Assegurança",  es: "Seguro" },
    altre:       { ico: "⭐", ca: "Altres",       es: "Otros" }
  };
  const CATEGORIA_DOC = {
    bitllet:     { ico: "🎫", ca: "Bitllets",     es: "Billetes" },
    bo:          { ico: "🧾", ca: "Bons i vals",  es: "Bonos" },
    asseguranca: { ico: "🛡️", ca: "Assegurança",  es: "Seguro" },
    contracte:   { ico: "📄", ca: "Contracte i condicions", es: "Contrato y condiciones" },
    factura:     { ico: "💶", ca: "Factures",     es: "Facturas" },
    altre:       { ico: "📎", ca: "Altres",       es: "Otros" }
  };
  const CATEGORIA_DESTI = {
    info:        { ico: "ℹ️", ca: "Informació pràctica", es: "Información práctica" },
    consell:     { ico: "💡", ca: "Consells",     es: "Consejos" },
    visita:      { ico: "📍", ca: "Què visitar",  es: "Qué visitar" },
    restaurant:  { ico: "🍽️", ca: "On menjar",    es: "Dónde comer" },
    compres:     { ico: "🛍️", ca: "Compres",      es: "Compras" },
    transport:   { ico: "🚌", ca: "Com moure's",  es: "Cómo moverse" }
  };
  const ESTAT = {
    en_preparacio: { ca: "En preparació", es: "En preparación" },
    confirmat:     { ca: "Confirmat",     es: "Confirmado" },
    cancelat:      { ca: "Cancel·lat",    es: "Cancelado" }
  };

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const text = s => esc(s).replace(/\n/g, "<br>");
  const loc = idioma => idioma === "es" ? "es-ES" : "ca-ES";

  function euros(v, idioma){
    return new Intl.NumberFormat(loc(idioma), { style: "currency", currency: "EUR" }).format(Number(v) || 0);
  }
  function dataLlarga(iso, idioma){
    if(!iso) return "";
    return new Date(iso + "T12:00:00").toLocaleDateString(loc(idioma), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function dataMitja(iso, idioma){
    if(!iso) return "";
    return new Date(iso + "T12:00:00").toLocaleDateString(loc(idioma), { day: "numeric", month: "short", year: "numeric" });
  }
  function dataCurta(iso){ if(!iso) return ""; const [a, m, d] = iso.split("-"); return `${d}/${m}/${a}`; }
  function avui(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function diesEntre(a, b){
    return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
  }
  function mida(bytes){
    if(!bytes) return "";
    if(bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
    return (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " MB";
  }

  function aplicarColors(ag){
    if(!ag) return;
    const r = document.documentElement.style;
    if(ag.color) r.setProperty("--blau", ag.color);
    if(ag.color_fosc) r.setProperty("--blau-fosc", ag.color_fosc);
    if(ag.color_clar) r.setProperty("--blau-clar", ag.color_clar);
    if(ag.accent) r.setProperty("--coral", ag.accent);
    if(ag.accent_clar) r.setProperty("--coral-clar", ag.accent_clar);
  }

  // Enllaços temporals per veure fotos i documents privats (1 hora)
  async function urlsSignades(sb, rutes){
    const valides = [...new Set(rutes.filter(Boolean))];
    if(!valides.length) return {};
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(valides, 3600);
    if(error || !data) return {};
    const out = {};
    data.forEach(x => { if(x.signedUrl) out[x.path] = x.signedUrl; });
    return out;
  }

  // Redueix una foto abans de pujar-la (màxim 1600 px, JPEG)
  function reduirFoto(fitxer, max = 1600){
    return new Promise((ok, ko) => {
      const img = new Image();
      img.onload = () => {
        const f = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * f); c.height = Math.round(img.height * f);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => b ? ok(b) : ko(new Error("foto")), "image/jpeg", 0.82);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => ko(new Error("foto"));
      img.src = URL.createObjectURL(fitxer);
    });
  }

  function nomFitxerSegur(nom){
    return String(nom || "fitxer").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80) || "fitxer";
  }

  // Logo de l'agència (imatge pujada) o, per defecte, el de Rimu Viatges
  function posarLogo(ag){
    const src = ag && ag.logo_url ? ag.logo_url : (!ag || ag.id === "rimu" ? window.RIMU_LOGO : null);
    document.querySelectorAll("img.logo").forEach(i => {
      if(src){ i.src = src; i.alt = ag?.nom || "Rimu Viatges"; i.style.display = ""; }
      else { i.style.display = "none"; }
    });
    const t = document.querySelector(".logo-text");
    if(t) t.textContent = src ? "" : (ag?.nom || "");
  }

  function nomComplet(c){ return [c?.nom, c?.cognoms].filter(Boolean).join(" "); }

  return { BUCKET, TIPUS_SERVEI, CATEGORIA_DOC, CATEGORIA_DESTI, ESTAT, esc, text, euros, dataLlarga, dataMitja,
           dataCurta, avui, diesEntre, mida, aplicarColors, urlsSignades, reduirFoto, nomFitxerSegur, nomComplet, posarLogo };
})();
