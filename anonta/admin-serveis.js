// Anonta · Panell: serveis del viatge amb camps segons el tipus
// (vol amb buscador, allotjament amb categoria i nits, excursió, assegurança)
(function(){
  const COLS = ["titol", "proveidor", "localitzador", "data_inici", "hora_inici", "data_fi", "hora_fi", "descripcio"];
  const opc = (map, val, buida = true) => (buida ? `<option value="">—</option>` : "")
    + Object.entries(map).map(([k, x]) => `<option value="${k}"${k === val ? " selected" : ""}>${x.ico ? x.ico + " " : ""}${esc(x[LANG] || x.ca)}</option>`).join("");
  const c = (k, label, val, o = {}) => `<div class="camp${o.ample ? " ample" : ""}${o.cls ? " " + o.cls : ""}"><label>${label}</label>${
    o.t === "textarea" ? `<textarea data-k="${k}"${o.ph ? ` placeholder="${esc(o.ph)}"` : ""}>${esc(val)}</textarea>`
    : `<input data-k="${k}" type="${o.t || "text"}" value="${esc(val ?? "")}"${o.ph ? ` placeholder="${esc(o.ph)}"` : ""}${o.extra || ""}>`}${o.ajuda ? `<div class="ajuda">${o.ajuda}</div>` : ""}</div>`;
  const x = (k, label, val, o = {}) => c(k, label, val, o).replace(`data-k="${k}"`, `data-x="${k}"`);
  const sel = (k, label, map, val, o = {}) => `<div class="camp${o.ample ? " ample" : ""}"><label>${label}</label><select data-x="${k}">${opc(map, val)}</select></div>`;
  const chk = (k, label, val) => `<label class="check"><input type="checkbox" data-x="${k}"${val ? " checked" : ""}> <span>${label}</span></label>`;
  const lLoc = L("Localitzador", "Localizador");

  function campsDe(t, r){
    const e = r.extra || {};
    if(t === "vol") return `
      <div class="camp"><label>${L("Número de vol", "Número de vuelo")}</label><div style="display:flex;gap:6px">
        <input data-x="numero" value="${esc(e.numero || "")}" placeholder="${L("Ex.: VY1234", "Ej.: VY1234")}" style="text-transform:uppercase">
        <button type="button" class="boto sec petit" data-buscavol title="${L("Buscar horari i companyia", "Buscar horario y compañía")}">🔎</button></div>
        <div class="ajuda">${L("Posa el número i la data i prem 🔎: s'omple sol.", "Pon el número y la fecha y pulsa 🔎: se rellena solo.")}</div></div>
      ${c("data_inici", L("Data del vol", "Fecha del vuelo"), r.data_inici, { t: "date" })}
      ${c("proveidor", L("Companyia", "Compañía"), r.proveidor, { ph: L("Ex.: Vueling", "Ej.: Vueling") })}
      ${c("localitzador", lLoc, r.localitzador)}
      ${x("origen", L("Origen", "Origen"), e.origen, { ph: L("Ex.: Barcelona (BCN)", "Ej.: Barcelona (BCN)") })}
      ${x("desti", L("Destí", "Destino"), e.desti, { ph: L("Ex.: Roma (FCO)", "Ej.: Roma (FCO)") })}
      ${c("hora_inici", L("Hora de sortida", "Hora de salida"), r.hora_inici, { t: "time" })}
      ${c("hora_fi", L("Hora d'arribada", "Hora de llegada"), r.hora_fi, { t: "time" })}
      <div class="camp ample">${chk("data_arribada", L("Arriba l'endemà (+1)", "Llega al día siguiente (+1)"), e.data_arribada)}</div>
      <div class="camp">${chk("cabina", "🎒 " + L("Inclou maleta de cabina", "Incluye maleta de cabina"), e.cabina)}
        <div class="kg ${e.cabina ? "" : "amagat"}" style="margin-top:6px"><input data-x="cabina_kg" type="number" min="0" max="50" inputmode="numeric" value="${esc(e.cabina_kg || "")}" placeholder="kg" style="width:90px"> kg</div></div>
      <div class="camp">${chk("facturada", "🧳 " + L("Inclou maleta facturada", "Incluye maleta facturada"), e.facturada)}
        <div class="kg ${e.facturada ? "" : "amagat"}" style="margin-top:6px"><input data-x="facturada_kg" type="number" min="0" max="50" inputmode="numeric" value="${esc(e.facturada_kg || "")}" placeholder="kg" style="width:90px"> kg</div></div>
      ${c("titol", L("Nom que veu el client", "Nombre que ve el cliente") + ` <span class="opc">(${L("opcional", "opcional")})</span>`, r.titol, { ample: true, ajuda: L("Si el deixes buit, es mostra «Origen → Destí».", "Si lo dejas vacío, se muestra «Origen → Destino».") })}
      ${c("descripcio", L("Detalls per al client", "Detalles para el cliente"), r.descripcio, { t: "textarea", ample: true, ph: L("Ex.: Facturació 3 h abans. Escala a Doha.", "Ej.: Facturación 3 h antes. Escala en Doha.") })}`;
    if(t === "hotel") return `
      ${c("titol", L("Nom de l'allotjament", "Nombre del alojamiento") + " *", r.titol, { ample: true, ph: L("Ex.: Hotel Shinjuku Garden", "Ej.: Hotel Shinjuku Garden") })}
      <div class="camp"><label>${L("Categoria", "Categoría")}</label><select data-x="estrelles"><option value="">—</option>${[1,2,3,4,5].map(n => `<option value="${n}"${Number(e.estrelles) === n ? " selected" : ""}>${"★".repeat(n)}</option>`).join("")}</select></div>
      ${sel("allotjament", L("Tipus d'allotjament", "Tipo de alojamiento"), SRV.ALLOTJAMENTS, e.allotjament)}
      ${sel("regim", L("Règim", "Régimen"), SRV.REGIMS, e.regim)}
      ${x("habitacio", L("Tipus d'habitació", "Tipo de habitación"), e.habitacio, { ph: L("Ex.: Doble amb vistes al mar", "Ej.: Doble con vistas al mar") })}
      ${c("data_inici", L("Data d'entrada", "Fecha de entrada"), r.data_inici, { t: "date" })}
      ${c("data_fi", L("Data de sortida", "Fecha de salida"), r.data_fi, { t: "date" })}
      <div class="camp ample"><span class="xip blau" data-nits></span></div>
      ${c("localitzador", lLoc, r.localitzador)}
      ${c("descripcio", L("Detalls de l'hotel", "Detalles del hotel"), r.descripcio, { t: "textarea", ample: true, ph: L("Ex.: Al centre, a 5 minuts de l'estació. Wifi gratuït.", "Ej.: En el centro, a 5 minutos de la estación. Wifi gratuito.") })}
      ${x("checkin", L("Detalls del check-in", "Detalles del check-in"), e.checkin, { t: "textarea", ample: true, ph: L("Ex.: A partir de les 15:00. Sortida abans de les 11:00. Cal ensenyar el passaport.", "Ej.: A partir de las 15:00. Salida antes de las 11:00. Hay que enseñar el pasaporte.") })}`;
    if(t === "circuit") return `
      ${c("titol", L("Nom del circuit", "Nombre del circuito") + " *", r.titol, { ample: true, ph: L("Ex.: Japó essencial", "Ej.: Japón esencial") })}
      ${c("proveidor", L("Operador / majorista", "Operador / mayorista"), r.proveidor, { ph: L("Ex.: Catai", "Ej.: Catai") })}
      ${c("localitzador", L("Localitzador / núm. de reserva", "Localizador / nº de reserva"), r.localitzador)}
      ${c("data_inici", L("Data d'inici", "Fecha de inicio"), r.data_inici, { t: "date" })}
      ${c("data_fi", L("Data de tornada", "Fecha de regreso"), r.data_fi, { t: "date" })}
      <div class="camp ample"><span class="xip blau" data-nits></span></div>
      <div class="camp"><label>${L("Categoria d'hotels", "Categoría de hoteles")}</label><select data-x="categoria"><option value="">—</option>${Object.entries(SRV.CATEGORIES).map(([k, v]) => `<option value="${k}"${e.categoria === k ? " selected" : ""}>${k} · ${v}</option>`).join("")}</select></div>
      ${sel("regim", L("Règim", "Régimen"), SRV.REGIMS, e.regim)}
      <div class="camp ample"><label>✈️ ${L("Vols del circuit", "Vuelos del circuito")}</label><div data-llista="vols">${(e.vols || []).map(filaVol).join("")}</div>
        <button type="button" class="boto sec petit" data-afegeix="vols">+ ${L("Afegeix un vol", "Añadir un vuelo")}</button></div>
      <div class="camp">${chk("cabina", "🎒 " + L("Inclou maleta de cabina", "Incluye maleta de cabina"), e.cabina)}
        <div class="kg ${e.cabina ? "" : "amagat"}" style="margin-top:6px"><input data-x="cabina_kg" type="number" min="0" max="50" inputmode="numeric" value="${esc(e.cabina_kg || "")}" placeholder="kg" style="width:90px"> kg</div></div>
      <div class="camp">${chk("facturada", "🧳 " + L("Inclou maleta facturada", "Incluye maleta facturada"), e.facturada)}
        <div class="kg ${e.facturada ? "" : "amagat"}" style="margin-top:6px"><input data-x="facturada_kg" type="number" min="0" max="50" inputmode="numeric" value="${esc(e.facturada_kg || "")}" placeholder="kg" style="width:90px"> kg</div></div>
      <div class="camp ample"><label>🏨 ${L("Hotels previstos (o similars)", "Hoteles previstos (o similares)")}</label><div data-llista="hotels">${(e.hotels || []).map(filaHotel).join("")}</div>
        <button type="button" class="boto sec petit" data-afegeix="hotels">+ ${L("Afegeix un hotel", "Añadir un hotel")}</button></div>
      ${x("inclou", "✅ " + L("Inclou", "Incluye"), e.inclou, { t: "textarea", ample: true, ph: L("Ex.: Vols, hotels, guia acompanyant en castellà, entrades als monuments…", "Ej.: Vuelos, hoteles, guía acompañante en castellano, entradas a los monumentos…") })}
      ${x("no_inclou", "❌ " + L("No inclou", "No incluye"), e.no_inclou, { t: "textarea", ample: true, ph: L("Ex.: Propines, begudes, visats…", "Ej.: Propinas, bebidas, visados…") })}
      ${x("telefon", "📞 " + L("Telèfon 24 h del receptiu", "Teléfono 24 h del receptivo"), e.telefon, { t: "tel", ph: "+81 …" })}
      ${c("descripcio", L("Detalls per al client", "Detalles para el cliente"), r.descripcio, { t: "textarea", ample: true })}`;
    if(t === "excursio") return `
      ${c("titol", L("Títol", "Título") + " *", r.titol, { ample: true, ph: L("Ex.: Visita guiada a Kyoto", "Ej.: Visita guiada a Kioto") })}
      ${c("data_inici", L("Data", "Fecha"), r.data_inici, { t: "date" })}
      ${c("hora_inici", L("Hora d'inici", "Hora de inicio"), r.hora_inici, { t: "time" })}
      ${x("lloc", L("Lloc de trobada", "Punto de encuentro"), e.lloc, { ample: true, ph: L("Ex.: Recepció de l'hotel", "Ej.: Recepción del hotel") })}
      ${c("localitzador", lLoc, r.localitzador)}
      ${c("descripcio", L("Detalls", "Detalles"), r.descripcio, { t: "textarea", ample: true })}`;
    if(t === "asseguranca") return `
      ${c("titol", L("Títol", "Título") + " *", r.titol, { ample: true, ph: L("Ex.: Assegurança de viatge", "Ej.: Seguro de viaje") })}
      ${sel("tipus", L("Tipus d'assegurança", "Tipo de seguro"), SRV.ASSEGURANCES, e.tipus)}
      ${x("tipus_altre", L("Quin tipus?", "¿Qué tipo?"), e.tipus_altre, { cls: e.tipus === "altre" ? "" : "amagat" })}
      ${c("localitzador", L("Núm. de pòlissa", "Nº de póliza"), r.localitzador)}
      ${c("descripcio", L("Detalls", "Detalles"), r.descripcio, { t: "textarea", ample: true, ph: L("Ex.: Telèfon d'assistència 24 h…", "Ej.: Teléfono de asistencia 24 h…") })}`;
    return `
      ${c("titol", L("Nom del servei", "Nombre del servicio") + " *", r.titol, { ample: true })}
      ${c("proveidor", L("Proveïdor / companyia", "Proveedor / compañía"), r.proveidor)}
      ${c("localitzador", lLoc, r.localitzador)}
      ${c("data_inici", L("Data d'inici", "Fecha de inicio"), r.data_inici, { t: "date" })}
      ${c("hora_inici", L("Hora d'inici", "Hora de inicio"), r.hora_inici, { t: "time" })}
      ${c("data_fi", L("Data de fi", "Fecha de fin"), r.data_fi, { t: "date" })}
      ${c("hora_fi", L("Hora de fi", "Hora de fin"), r.hora_fi, { t: "time" })}
      ${c("descripcio", L("Detalls per al client", "Detalles para el cliente"), r.descripcio, { t: "textarea", ample: true })}`;
  }

  // Files repetibles del circuit: vols i hotels previstos
  const iv = (k, val, ph, o = "") => `<input data-v="${k}" value="${esc(val ?? "")}"${ph ? ` placeholder="${esc(ph)}"` : ""} ${o}>`;
  function filaVol(v = {}){
    return `<div class="subllista" data-fila="vols" style="margin:0 0 8px;padding:10px"><div class="graella">
      <div class="camp"><label>${L("Número de vol", "Número de vuelo")}</label><div style="display:flex;gap:6px">${iv("numero", v.numero, "VY1234", 'style="text-transform:uppercase"')}
        <button type="button" class="boto sec petit" data-buscavol>🔎</button></div></div>
      <div class="camp"><label>${L("Data", "Fecha")}</label>${iv("data", v.data, "", 'type="date"')}</div>
      <div class="camp"><label>${L("Companyia", "Compañía")}</label>${iv("companyia", v.companyia)}</div>
      <div class="camp"><label>${L("Origen → Destí", "Origen → Destino")}</label><div style="display:flex;gap:6px">${iv("origen", v.origen, "BCN")}${iv("desti", v.desti, "HND")}</div></div>
      <div class="camp"><label>${L("Sortida → Arribada", "Salida → Llegada")}</label><div style="display:flex;gap:6px">${iv("sortida", v.sortida, "", 'type="time"')}${iv("arribada", v.arribada, "", 'type="time"')}</div></div>
      <div class="camp"><label class="check"><input type="checkbox" data-v="plus1"${v.plus1 ? " checked" : ""}> <span>${L("Arriba l'endemà (+1)", "Llega al día siguiente (+1)")}</span></label>
        <button type="button" class="mini perill" data-treu style="margin-top:8px">${L("Treu el vol", "Quitar el vuelo")}</button></div>
    </div></div>`;
  }
  function filaHotel(h = {}){
    return `<div class="fila" data-fila="hotels" style="margin-bottom:6px;flex-wrap:nowrap">
      <div style="flex:1">${iv("ciutat", h.ciutat, L("Ciutat", "Ciudad"))}</div><div style="flex:2">${iv("hotel", h.hotel, L("Hotel", "Hotel"))}</div>
      <div style="width:80px">${iv("nits", h.nits, L("Nits", "Noches"), 'type="number" min="1" inputmode="numeric"')}</div>
      <button type="button" class="mini perill" data-treu>✕</button></div>`;
  }
  function llegirFiles(form, tipus){
    return [...form.querySelectorAll(`[data-fila="${tipus}"]`)].map(f => {
      const o = {};
      f.querySelectorAll("[data-v]").forEach(i => { const v = i.type === "checkbox" ? i.checked : i.value.trim(); if(v !== "" && v !== false) o[i.dataset.v] = i.dataset.v === "numero" ? v.toUpperCase().replace(/\s+/g, "") : v; });
      return o;
    }).filter(o => Object.keys(o).length);
  }

  // Llegeix el formulari: columnes i "extra"
  function llegir(form){
    const reg = {}, extra = {};
    form.querySelectorAll("[data-k]").forEach(i => { reg[i.dataset.k] = i.value.trim() || null; });
    form.querySelectorAll("[data-x]").forEach(i => {
      const v = i.type === "checkbox" ? i.checked : i.value.trim();
      if(v !== "" && v !== false) extra[i.dataset.x] = i.dataset.x === "numero" ? String(v).toUpperCase().replace(/\s+/g, "") : v;
    });
    if(extra.estrelles) extra.estrelles = Number(extra.estrelles);
    if(!extra.cabina) delete extra.cabina_kg;
    if(!extra.facturada) delete extra.facturada_kg;
    if(extra.tipus !== "altre") delete extra.tipus_altre;
    if(form.querySelector('[data-llista="vols"]')){
      const vols = llegirFiles(form, "vols"), hotels = llegirFiles(form, "hotels");
      if(vols.length) extra.vols = vols;
      if(hotels.length) extra.hotels = hotels;
    }
    return { reg, extra };
  }

  const resum = s => {
    const e = s.extra || {}, ico = AN.TIPUS_SERVEI[s.tipus]?.ico || "";
    if(s.tipus === "vol") return `${ico} ${SRV.titolVol(s) || L("Vol", "Vuelo")}${e.numero ? " · " + e.numero : ""}`;
    return `${ico} ${s.titol || L("(sense nom)", "(sin nombre)")}`;
  };
  const sub = s => {
    const e = s.extra || {};
    if(s.tipus === "hotel"){
      const n = SRV.nits(s.data_inici, s.data_fi);
      return [s.data_inici && dataCurta(s.data_inici), n && SRV.T[LANG].nits(n), e.estrelles && "★".repeat(e.estrelles)].filter(Boolean).join(" · ");
    }
    if(s.tipus === "asseguranca") return [SRV.tipusAssegurança(e, LANG), s.localitzador].filter(Boolean).join(" · ");
    if(s.tipus === "circuit"){
      const n = SRV.nits(s.data_inici, s.data_fi);
      return [s.data_inici && dataCurta(s.data_inici), n && SRV.T[LANG].nits(n), e.categoria && L("Cat. ", "Cat. ") + e.categoria].filter(Boolean).join(" · ");
    }
    return [s.data_inici ? dataCurta(s.data_inici) + (s.hora_inici ? " " + s.hora_inici : "") : "", s.localitzador].filter(Boolean).join(" · ");
  };

  subServeis = async function(cont, v){
    const { data, error } = await sb.from("an_serveis").select("*").eq("viatge_id", v.id)
      .order("data_inici", { ascending: true, nullsFirst: false }).order("hora_inici", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true });
    if(error){ cont.innerHTML = `<div class="error">${esc(errMsg(error))}</div>`; return; }
    const files = data || [];
    cont.innerHTML = `<div class="targeta"><h2>${L("Serveis contractats", "Servicios contratados")}</h2><div class="llista"></div>
      ${files.length ? "" : `<p class="meta">${L("Afegeix-hi vols, hotels, excursions, assegurança… El client ho veurà amb les dates i els localitzadors.", "Añade vuelos, hoteles, excursiones, seguro… El cliente lo verá con las fechas y los localizadores.")}</p>`}
      <button class="boto petit" type="button" data-nou>+ ${L("Afegeix un servei", "Añadir un servicio")}</button></div>`;
    const llista = cont.querySelector(".llista"), bNou = cont.querySelector("[data-nou]");
    const recarrega = () => subServeis(cont, v);

    const pinta = (r, obert) => {
      const el = document.createElement("details");
      el.className = "el"; if(obert) el.open = true;
      el.innerHTML = `<summary><span class="n">${esc(r.id ? resum(r) : L("Nou servei", "Nuevo servicio"))}</span>${r.id ? `<span class="meta">${esc(sub(r))}</span>` : ""}</summary>
        <div class="el-cos"><form>
          <div class="camp"><label>${L("Tipus", "Tipo")}</label><select data-tipus>${opc(AN.TIPUS_SERVEI, r.tipus || "vol", false)}</select></div>
          <div class="graella" data-camps></div>
          <div class="fila entre" style="margin-top:4px">
            <span class="fila"><button class="boto petit" type="submit">${L("Desa", "Guardar")}</button>
              ${r.id ? "" : `<button class="boto sec petit" type="button" data-cancela>${L("Cancel·la", "Cancelar")}</button>`}</span>
            ${r.id ? `<button class="mini perill" type="button" data-esb>${L("Esborra", "Borrar")}</button>` : ""}
          </div></form></div>`;
      const form = el.querySelector("form"), zona = el.querySelector("[data-camps]"), selT = el.querySelector("[data-tipus]");
      const munta = valors => {
        zona.innerHTML = campsDe(selT.value, valors);
        const nits = () => {
          const b = zona.querySelector("[data-nits]"); if(!b) return;
          const n = SRV.nits(zona.querySelector('[data-k="data_inici"]').value, zona.querySelector('[data-k="data_fi"]').value);
          b.textContent = n ? (selT.value === "circuit" ? "📅 " + SRV.T[LANG].dies(n + 1) + " / " + SRV.T[LANG].nits(n) : "🌙 " + SRV.T[LANG].nits(n))
            : L("Posa les dates i es calculen les nits", "Pon las fechas y se calculan las noches");
          b.classList.toggle("amagat", false);
        };
        zona.querySelectorAll('[data-k="data_inici"],[data-k="data_fi"]').forEach(i => i.addEventListener("input", nits));
        nits();
        zona.querySelectorAll('[data-x="cabina"],[data-x="facturada"]').forEach(i => i.onchange = () => i.closest(".camp").querySelector(".kg").classList.toggle("amagat", !i.checked));
        const ta = zona.querySelector('[data-x="tipus"]');
        if(ta) ta.onchange = () => zona.querySelector('[data-x="tipus_altre"]').closest(".camp").classList.toggle("amagat", ta.value !== "altre");
        const lligaFila = f => {
          f.querySelector("[data-treu]").onclick = () => f.remove();
          const b = f.querySelector("[data-buscavol]");
          if(b) b.onclick = () => buscarVol(f, b, true);
        };
        zona.querySelectorAll("[data-fila]").forEach(lligaFila);
        zona.querySelectorAll("[data-afegeix]").forEach(b => b.onclick = () => {
          const ll = zona.querySelector(`[data-llista="${b.dataset.afegeix}"]`);
          ll.insertAdjacentHTML("beforeend", b.dataset.afegeix === "vols" ? filaVol() : filaHotel());
          lligaFila(ll.lastElementChild);
          ll.lastElementChild.querySelector("input")?.focus();
        });
        const bv = selT.value === "vol" && zona.querySelector("[data-buscavol]");
        if(bv) bv.onclick = () => buscarVol(zona, bv);
      };
      munta(r);
      selT.onchange = () => { const { reg, extra } = llegir(form); munta({ ...reg, extra }); };

      form.onsubmit = async ev => {
        ev.preventDefault();
        const { reg, extra } = llegir(form), tipus = selT.value;
        if(tipus !== "vol" && !reg.titol) return avis(L("Falta el títol.", "Falta el título."), true);
        if(reg.data_inici && reg.data_fi && reg.data_fi < reg.data_inici) return avis(L("La data de fi no pot ser abans de la d'inici.", "La fecha de fin no puede ser anterior a la de inicio."), true);
        const fila = { tipus, extra };
        COLS.forEach(k => fila[k] = reg[k] ?? null);
        if(tipus === "vol"){
          fila.data_fi = fila.data_inici && extra.data_arribada
            ? (() => { const d = new Date(fila.data_inici + "T12:00:00"); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })()
            : fila.data_inici;
        }
        let error;
        if(r.id) ({ error } = await sb.from("an_serveis").update(fila).eq("id", r.id));
        else ({ error } = await sb.from("an_serveis").insert({ ...fila, viatge_id: v.id }));
        if(error) return avis(errMsg(error), true);
        avis(L("Desat ✓", "Guardado ✓"));
        recarrega();
      };
      const canc = form.querySelector("[data-cancela]");
      if(canc) canc.onclick = () => { el.remove(); bNou.disabled = false; };
      const esb = form.querySelector("[data-esb]");
      if(esb) esb.onclick = async () => {
        if(!confirm(L("Segur que vols esborrar aquest servei?", "¿Seguro que quieres borrar este servicio?"))) return;
        const { error } = await sb.from("an_serveis").delete().eq("id", r.id);
        if(error) return avis(errMsg(error), true);
        recarrega();
      };
      return el;
    };

    files.forEach(r => llista.appendChild(pinta(r, false)));
    bNou.onclick = () => {
      llista.appendChild(pinta({ tipus: "vol", extra: {} }, true));
      bNou.disabled = true;
      llista.lastChild.querySelector("select")?.focus();
    };
  };

  // Buscador de vols (el mateix servei que fan servir els itineraris)
  async function buscarVol(zona, boto, fila){
    // fila = un vol dins d'un circuit (camps data-v); si no, el servei de vol (camps data-k / data-x)
    const NOMS = { proveidor: "companyia", hora_inici: "sortida", hora_fi: "arribada", data_arribada: "plus1", data_inici: "data" };
    const q = k => fila ? zona.querySelector(`[data-v="${NOMS[k] || k}"]`) : (zona.querySelector(`[data-k="${k}"]`) || zona.querySelector(`[data-x="${k}"]`));
    const numero = q("numero").value.toUpperCase().replace(/\s+/g, ""), data = q("data_inici").value;
    if(!numero){ avis(L("Escriu el número de vol.", "Escribe el número de vuelo."), true); return; }
    if(!data){ avis(L("Posa la data del vol.", "Pon la fecha del vuelo."), true); return; }
    boto.disabled = true; boto.textContent = "…";
    try{
      const { data: r, error } = DEMO
        ? { data: { numero, companyia: "Vueling", origen: "BCN", origen_nom: "Barcelona", desti: "FCO", desti_nom: "Roma", sortida: "07:05", arribada: "08:50" } }
        : await sb.functions.invoke("it-vol", { body: { numero, data } });
      if(error) throw error;
      if(r.error === "FALTA_CLAU"){ avis(L("La cerca de vols encara no està activada. Omple les dades a mà.", "La búsqueda de vuelos todavía no está activada. Rellena los datos a mano."), true); return; }
      if(r.error === "NO_TROBAT"){ avis(L("No s'ha trobat aquest vol en aquesta data. Omple-ho a mà.", "No se ha encontrado este vuelo en esta fecha. Rellénalo a mano."), true); return; }
      if(r.error) throw new Error(r.error);
      q("numero").value = r.numero || numero;
      if(r.companyia) q("proveidor").value = r.companyia;
      if(r.origen) q("origen").value = r.origen_nom && !fila ? `${r.origen_nom} (${r.origen})` : r.origen;
      if(r.desti) q("desti").value = r.desti_nom && !fila ? `${r.desti_nom} (${r.desti})` : r.desti;
      if(r.sortida) q("hora_inici").value = r.sortida;
      if(r.arribada) q("hora_fi").value = r.arribada;
      q("data_arribada").checked = !!r.data_arribada;
      avis(L("Dades del vol omplertes ✈️ Recorda clicar «Desa».", "Datos del vuelo rellenados ✈️ Recuerda pulsar «Guardar»."));
    }catch(err){ avis(L("No s'ha pogut buscar el vol.", "No se ha podido buscar el vuelo."), true); }
    finally{ boto.disabled = false; boto.textContent = "🔎"; }
  }
})();
