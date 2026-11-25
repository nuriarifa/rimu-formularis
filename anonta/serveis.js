// Anonta · Camps propis de cada tipus de servei (vol, allotjament, excursió, assegurança)
// i com es mostren a l'app del client. Ho fan servir el panell i l'app.
window.SRV = (function(){
  // Tipus nou «Circuit» (es posa just després d'excursió)
  (function(){
    const t = AN.TIPUS_SERVEI, nou = {};
    Object.keys(t).forEach(k => { nou[k] = t[k]; if(k === "excursio") nou.circuit = { ico: "🚌", ca: "Circuit", es: "Circuito" }; });
    Object.keys(t).forEach(k => delete t[k]); Object.assign(t, nou);
  })();
  // Categories d'hotels dels circuits (de menys a més)
  const CATEGORIES = { A: "3★", B: "4★", C: "4★ sup.", D: "5★" };
  const REGIMS = {
    sa: { ca: "Només allotjament",      es: "Solo alojamiento" },
    ad: { ca: "Allotjament i esmorzar", es: "Alojamiento y desayuno" },
    mp: { ca: "Mitja pensió",           es: "Media pensión" },
    pc: { ca: "Pensió completa",        es: "Pensión completa" },
    ti: { ca: "Tot inclòs",             es: "Todo incluido" }
  };
  const ALLOTJAMENTS = {
    hotel:      { ca: "Hotel",      es: "Hotel" },
    apartament: { ca: "Apartament", es: "Apartamento" },
    hostal:     { ca: "Hostal",     es: "Hostal" },
    alberg:     { ca: "Alberg",     es: "Albergue" },
    casa_rural: { ca: "Casa rural", es: "Casa rural" },
    resort:     { ca: "Resort",     es: "Resort" },
    ryokan:     { ca: "Ryokan",     es: "Ryokan" },
    altre:      { ca: "Altre",      es: "Otro" }
  };
  const ASSEGURANCES = {
    inclusio:            { ca: "Inclusió",                     es: "Inclusión" },
    assistencia:         { ca: "Assistència",                  es: "Asistencia" },
    assistencia_cancel:  { ca: "Assistència i cancel·lació",   es: "Asistencia y cancelación" },
    cancelacio:          { ca: "Cancel·lació",                 es: "Cancelación" },
    altre:               { ca: "Altre (escriure-ho)",          es: "Otro (escribirlo)" }
  };
  const T = {
    ca: { nits: n => n === 1 ? "1 nit" : `${n} nits`, cabina: "Maleta de cabina", facturada: "Maleta facturada", checkin: "Check-in",
          trobada: "Punt de trobada", polissa: "Núm. de pòlissa", localitzador: "Localitzador", habitacio: "Habitació", sortida: "Sortida", arribada: "Arribada",
          entrada: "Entrada", sortidaH: "Sortida", assegurança: "Assegurança",
          dies: n => n === 1 ? "1 dia" : `${n} dies`, categoria: "Categoria", vols: "Vols", hotels: "Hotels previstos (o similars)",
          inclou: "Inclou", noInclou: "No inclou", tel24: "Telèfon 24 h del receptiu", operador: "Operador" },
    es: { nits: n => n === 1 ? "1 noche" : `${n} noches`, cabina: "Maleta de cabina", facturada: "Maleta facturada", checkin: "Check-in",
          trobada: "Punto de encuentro", polissa: "Nº de póliza", localitzador: "Localizador", habitacio: "Habitación", sortida: "Salida", arribada: "Llegada",
          entrada: "Entrada", sortidaH: "Salida", assegurança: "Seguro",
          dies: n => n === 1 ? "1 día" : `${n} días`, categoria: "Categoría", vols: "Vuelos", hotels: "Hoteles previstos (o similares)",
          inclou: "Incluye", noInclou: "No incluye", tel24: "Teléfono 24 h del receptivo", operador: "Operador" }
  };
  const nits = (a, b) => (a && b) ? Math.max(0, Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000)) : null;
  const nomDe = (map, k, idioma) => k && map[k] ? (map[k][idioma] || map[k].ca) : "";
  const tipusAssegurança = (e, idioma) => e.tipus === "altre" ? (e.tipus_altre || "") : nomDe(ASSEGURANCES, e.tipus, idioma);

  // Títol que es mostra d'un vol si l'agència no n'ha escrit cap
  function titolVol(s){
    const e = s.extra || {};
    if(s.titol) return s.titol;
    if(e.origen || e.desti) return `${e.origen || "?"} → ${e.desti || "?"}`;
    return e.numero || "";
  }

  // Targeta d'un servei a l'app del client. tr(s, camp) torna el text traduït.
  function htmlClient(s, idioma, tr, esc, text){
    const e = s.extra || {}, t = T[idioma] || T.ca;
    const ti = AN.TIPUS_SERVEI[s.tipus] || AN.TIPUS_SERVEI.altre;
    const dm = iso => AN.dataMitja(iso, idioma);
    const linia = (txt, ico) => txt ? `<div class="meta">${ico ? ico + " " : ""}${txt}</div>` : "";
    const loc = (lbl) => s.localitzador ? `<div style="margin-top:4px">${esc(lbl || t.localitzador)}: <span class="loc">${esc(s.localitzador)}</span></div>` : "";
    const detalls = s.descripcio ? `<div style="margin-top:6px;font-size:15px">${text(tr(s, "descripcio"))}</div>` : "";
    let cap = esc(ti[idioma] || ti.ca), titol = esc(tr(s, "titol") || ""), cos = "";

    if(s.tipus === "vol"){
      cap = [esc(ti[idioma]), e.numero && esc(e.numero), s.proveidor && esc(s.proveidor)].filter(Boolean).join(" · ");
      titol = s.titol ? esc(tr(s, "titol")) : esc(titolVol(s));
      const hores = [s.hora_inici, s.hora_fi && (s.hora_fi + (e.data_arribada ? " (+1)" : ""))].filter(Boolean).join(" → ");
      const rutaSiTitol = s.titol && (e.origen || e.desti) ? `<div class="meta">${esc(e.origen || "?")} → ${esc(e.desti || "?")}</div>` : "";
      const maletes = [e.cabina && `🎒 ${t.cabina}${e.cabina_kg ? " " + esc(e.cabina_kg) + " kg" : ""}`,
                       e.facturada && `🧳 ${t.facturada}${e.facturada_kg ? " " + esc(e.facturada_kg) + " kg" : ""}`].filter(Boolean).join(" · ");
      cos = rutaSiTitol + linia([s.data_inici && dm(s.data_inici), hores].filter(Boolean).map(esc).join(" · "), "📅")
        + (maletes ? `<div class="meta">${maletes}</div>` : "") + loc() + detalls;
    }else if(s.tipus === "hotel"){
      const allot = nomDe(ALLOTJAMENTS, e.allotjament, idioma);
      cap = [esc(allot || ti[idioma]), e.estrelles ? `<span style="color:#E0A100;letter-spacing:1px">${"★".repeat(Number(e.estrelles))}</span>` : ""].filter(Boolean).join(" · ");
      const n = nits(s.data_inici, s.data_fi);
      const dates = [s.data_inici && `${t.entrada} ${dm(s.data_inici)}`, s.data_fi && `${t.sortidaH} ${dm(s.data_fi)}`].filter(Boolean).join(" → ");
      const info = [nomDe(REGIMS, e.regim, idioma), e.habitacio && `${t.habitacio}: ${tr(s, "x_habitacio")}`].filter(Boolean).map(esc).join(" · ");
      cos = linia(esc(dates) + (n ? ` · <b>${esc(t.nits(n))}</b>` : ""), "📅") + linia(info, "🛏️") + loc() + detalls
        + (e.checkin ? `<div style="margin-top:6px;font-size:15px">🔑 <b>${esc(t.checkin)}:</b> ${text(tr(s, "x_checkin"))}</div>` : "");
    }else if(s.tipus === "excursio"){
      cos = linia([s.data_inici && dm(s.data_inici), s.hora_inici].filter(Boolean).map(esc).join(" · "), "📅")
        + (e.lloc ? linia(`${esc(t.trobada)}: ${esc(tr(s, "x_lloc"))}`, "📍") : "") + loc() + detalls;
    }else if(s.tipus === "circuit"){
      if(s.proveidor) cap += " · " + esc(s.proveidor);
      const n = nits(s.data_inici, s.data_fi);
      const dates = [s.data_inici && dm(s.data_inici), s.data_fi && dm(s.data_fi)].filter(Boolean).join(" → ");
      const cat = e.categoria ? `${t.categoria} ${esc(e.categoria)}${CATEGORIES[e.categoria] ? " (" + CATEGORIES[e.categoria] + ")" : ""}` : "";
      const vols = (e.vols || []).map(v => {
        const ruta = (v.origen || v.desti) ? `${esc(v.origen || "?")} → ${esc(v.desti || "?")}` : "";
        const hores = [v.sortida, v.arribada && (v.arribada + (v.plus1 ? " (+1)" : ""))].filter(Boolean).join(" → ");
        return `<div class="meta" style="margin-top:3px">✈️ ${[v.data && esc(dm(v.data)), [v.numero, v.companyia].filter(Boolean).map(esc).join(" "), ruta, hores && esc(hores)].filter(Boolean).join(" · ")}</div>`;
      }).join("");
      const maletes = [e.cabina && `🎒 ${t.cabina}${e.cabina_kg ? " " + esc(e.cabina_kg) + " kg" : ""}`,
                       e.facturada && `🧳 ${t.facturada}${e.facturada_kg ? " " + esc(e.facturada_kg) + " kg" : ""}`].filter(Boolean).join(" · ");
      const hotels = (e.hotels || []).map(h => `<div class="meta" style="margin-top:2px">🏨 ${[h.ciutat && `<b>${esc(h.ciutat)}</b>`, h.hotel && esc(h.hotel), h.nits && esc(t.nits(Number(h.nits)))].filter(Boolean).join(" · ")}</div>`).join("");
      const tel = e.telefon ? `<div style="margin-top:6px">📞 ${esc(t.tel24)}: <a href="tel:${esc(String(e.telefon).replace(/[^\d+]/g, ""))}">${esc(e.telefon)}</a></div>` : "";
      cos = linia(esc(dates) + (n ? ` · <b>${esc(t.dies(n + 1))} / ${esc(t.nits(n))}</b>` : ""), "📅")
        + linia([cat, e.regim && esc(nomDe(REGIMS, e.regim, idioma))].filter(Boolean).join(" · "), "🏨") + loc()
        + (vols ? `<div style="margin-top:8px;font-weight:600;font-size:14px">${esc(t.vols)}</div>${vols}` : "")
        + (maletes ? `<div class="meta" style="margin-top:3px">${maletes}</div>` : "")
        + (hotels ? `<div style="margin-top:8px;font-weight:600;font-size:14px">${esc(t.hotels)}</div>${hotels}` : "")
        + detalls
        + (e.inclou ? `<div style="margin-top:8px;font-size:15px">✅ <b>${esc(t.inclou)}:</b><br>${text(tr(s, "x_inclou"))}</div>` : "")
        + (e.no_inclou ? `<div style="margin-top:8px;font-size:15px">❌ <b>${esc(t.noInclou)}:</b><br>${text(tr(s, "x_no_inclou"))}</div>` : "")
        + tel;
    }else if(s.tipus === "asseguranca"){
      const tip = e.tipus === "altre" ? tr(s, "x_tipus_altre") : tipusAssegurança(e, idioma);
      cos = (tip ? `<div class="meta">🛡️ ${esc(tip)}</div>` : "") + loc(t.polissa) + detalls;
    }else{
      const ini = s.data_inici ? dm(s.data_inici) + (s.hora_inici ? " · " + s.hora_inici : "") : "";
      const fi = s.data_fi && (s.data_fi !== s.data_inici || s.hora_fi) ? dm(s.data_fi) + (s.hora_fi ? " · " + s.hora_fi : "") : (s.hora_fi || "");
      if(s.proveidor) cap += " · " + esc(s.proveidor);
      cos = (ini ? `<div class="meta">📅 ${esc(ini)}${fi ? " → " + esc(fi) : ""}</div>` : "") + loc() + detalls;
    }
    return `<div class="servei"><div class="ico">${ti.ico}</div><div style="flex:1;min-width:0">
      <div class="meta">${cap}</div><div class="nom">${titol}</div>${cos}</div></div>`;
  }

  return { REGIMS, ALLOTJAMENTS, ASSEGURANCES, CATEGORIES, T, nits, nomDe, titolVol, tipusAssegurança, htmlClient };
})();
