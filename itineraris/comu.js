// Funcions comunes de l'app d'itineraris (panell i pàgina del client)
window.IT = (function(){
  const TIPUS = {
    vol:         { ico: "✈️", ca: "Vol",          es: "Vuelo" },
    hotel:       { ico: "🏨", ca: "Allotjament",  es: "Alojamiento" },
    trasllat:    { ico: "🚐", ca: "Trasllat",     es: "Traslado" },
    excursio:    { ico: "🧭", ca: "Excursió",     es: "Excursión" },
    asseguranca: { ico: "🛡️", ca: "Assegurança",  es: "Seguro" },
    altre:       { ico: "⭐", ca: "Servei",       es: "Servicio" }
  };

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const text = s => esc(s).replace(/\n/g, "<br>");
  const num = v => Math.round((Number(v) || 0) * 100) / 100;

  function euros(v, idioma){
    return new Intl.NumberFormat(idioma === "es" ? "es-ES" : "ca-ES", { style: "currency", currency: "EUR" }).format(num(v));
  }

  // Preu d'un servei per a una persona
  function preuPersona(s, n){
    return s.preu_unitat === "grup" ? (Number(s.preu) || 0) / Math.max(1, n) : (Number(s.preu) || 0);
  }

  // Estat d'un opcional segons la tria del client (per defecte: inclòs per a tothom)
  function estatOpcional(s, seleccio, n){
    const t = (seleccio || {})[s.id];
    if(s.opcional_per_persones){
      const p = t && typeof t.persones === "number" ? Math.max(0, Math.min(n, t.persones)) : n;
      return { actiu: p > 0, persones: p };
    }
    return { actiu: t ? t.actiu !== false : true, persones: n };
  }

  // Import d'un servei tenint en compte la tria
  function importServei(s, seleccio, n){
    const base = s.preu_unitat === "grup" ? (Number(s.preu) || 0) : (Number(s.preu) || 0) * n;
    if(!s.opcional) return base;
    const e = estatOpcional(s, seleccio, n);
    if(!e.actiu) return 0;
    if(s.opcional_per_persones) return preuPersona(s, n) * e.persones;
    return base;
  }

  function totals(serveis, seleccio, n){
    const total = num(serveis.reduce((a, s) => a + importServei(s, seleccio, n), 0));
    return { total, perPersona: num(total / Math.max(1, n)) };
  }

  function dataDia(dataInici, index, idioma){
    if(!dataInici) return "";
    const d = new Date(dataInici + "T12:00:00");
    d.setDate(d.getDate() + index);
    return d.toLocaleDateString(idioma === "es" ? "es-ES" : "ca-ES", { weekday: "long", day: "numeric", month: "long" });
  }
  function dataCurta(iso){ if(!iso) return ""; const [a, m, d] = iso.split("-"); return `${d}/${m}/${a}`; }

  function aplicarColors(ag){
    if(!ag) return;
    const r = document.documentElement.style;
    if(ag.color) r.setProperty("--blau", ag.color);
    if(ag.color_fosc) r.setProperty("--blau-fosc", ag.color_fosc);
    if(ag.color_clar) r.setProperty("--blau-clar", ag.color_clar);
    if(ag.accent) r.setProperty("--coral", ag.accent);
    if(ag.accent_clar) r.setProperty("--coral-clar", ag.accent_clar);
  }

  // Apartats de la "Informació important" (l'apartat "altres" es desa a la columna notes)
  const INFO = [
    { k: "inclou",       ico: "✅", ca: "Què inclou",               es: "Qué incluye",              llista: true },
    { k: "no_inclou",    ico: "❌", ca: "Què no inclou",            es: "Qué no incluye",           llista: true },
    { k: "documentacio", ico: "🛂", ca: "Documentació necessària",  es: "Documentación necesaria" },
    { k: "pagament",     ico: "💳", ca: "Formes de pagament",       es: "Formas de pago" },
    { k: "cancelacio",   ico: "⚠️", ca: "Despeses de cancel·lació", es: "Gastos de cancelación" },
    { k: "altres",       ico: "ℹ️", ca: "Altres informacions",      es: "Otras informaciones" }
  ];
  // Avisos que surten sempre, a tots els itineraris
  const AVISOS = {
    ca: [
      "Els preus estan subjectes a disponibilitat i a les tarifes vigents en el moment de fer la reserva.",
      "És obligació de cada viatger complir els requisits d'entrada al país de destinació (documentació, visats, vacunes, etc.)."
    ],
    es: [
      "Los precios están sujetos a disponibilidad y a las tarifas vigentes en el momento de realizar la reserva.",
      "Es obligación de cada viajero cumplir los requisitos de entrada al país de destino (documentación, visados, vacunas, etc.)."
    ]
  };
  const valorInfo = (it, k) => k === "altres" ? (it.notes || "") : ((it.info || {})[k] || "");

  // Converteix un text en llista (una línia = un punt)
  function llista(s){
    const l = String(s || "").split("\n").map(x => x.replace(/^\s*[-•*·]\s*/, "").trim()).filter(Boolean);
    return "<ul>" + l.map(x => `<li>${esc(x)}</li>`).join("") + "</ul>";
  }

  return { INFO, AVISOS, valorInfo, llista, TIPUS, esc, text, num, euros, preuPersona, estatOpcional, importServei, totals, dataDia, dataCurta, aplicarColors };
})();
