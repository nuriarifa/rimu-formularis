// Anonta · Panell: missatges amb els viatgers (pestanya «💬 Missatges» de cada viatge, avís de missatges nous a la llista)
// i notificacions al mòbil de l'agència. S'afegeix a admin.js sense tocar-lo.
(function(){
  if(DEMO) return;
  let NL = [];
  const bombolla = n => n ? `<span class="xat-num">${n}</span>` : "";
  const nViatge = (id, fil) => NL.filter(x => x.viatge_id === id && (fil === undefined || (x.fil || null) === fil)).reduce((a, x) => a + Number(x.n), 0);
  async function actualitza(){
    try{ NL = await XAT.noLlegits(sb); }catch(e){ NL = []; }
    const total = NL.reduce((a, x) => a + Number(x.n), 0);
    const b = document.querySelector('#navPrincipal [data-vista="viatges"]');
    if(b){ b.querySelector(".xat-num")?.remove(); if(total) b.insertAdjacentHTML("beforeend", bombolla(total)); }
    return NL;
  }

  // Perquè el panell es pugui instal·lar al mòbil (cal a l'iPhone per rebre avisos)
  if(!document.querySelector('link[rel="manifest"]')){
    const man = { name: "Anonta · Panell de l'agència", short_name: "Anonta", start_url: new URL("admin.html", location.href).href,
      scope: new URL("./", location.href).href, display: "standalone", background_color: "#FFFFFF", theme_color: "#1F3A5F",
      icons: [{ src: new URL("icona-anonta.svg", location.href).href, sizes: "any", type: "image/svg+xml" }] };
    const l = document.createElement("link"); l.rel = "manifest";
    l.href = "data:application/manifest+json;charset=utf-8," + encodeURIComponent(JSON.stringify(man));
    document.head.appendChild(l);
    const a = document.createElement("link"); a.rel = "apple-touch-icon"; a.href = "icona-anonta.svg"; document.head.appendChild(a);
  }
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

  // ---- Pestanya del viatge ----
  const vistaViatge0 = vistaViatge;
  vistaViatge = async function(id, sub){
    if(A.nomesApps) return vistaViatge0(id, sub);
    if(sub !== "missatges"){
      await vistaViatge0(id, sub);
      await actualitza();
      afegeixPestanya(id, false);
      return;
    }
    const { data: v, error } = await sb.from("an_viatges").select("*").eq("id", id).maybeSingle();
    if(error || !v){ pantalla.innerHTML = `<div class="error">${L("No s'ha trobat el viatge.", "No se ha encontrado el viaje.")}</div>`; return; }
    A.viatge = v;
    pantalla.innerHTML = `
      <button class="tornar" type="button" onclick="ir('#viatges')">← ${L("Tots els viatges", "Todos los viajes")}</button>
      <div class="fila entre"><h2 style="margin:0">${esc(v.titol)}</h2>
        ${v.publicat ? `<span class="xip verd">${L("Visible per al client", "Visible para el cliente")}</span>` : `<span class="xip">${L("No publicat", "No publicado")}</span>`}</div>
      <p class="meta" style="margin-top:2px">${esc([v.desti, v.pais].filter(Boolean).join(", "))}${v.data_inici ? " · " + dataCurta(v.data_inici) + (v.data_fi ? " → " + dataCurta(v.data_fi) : "") : ""}</p>
      <nav class="pestanyes" id="subnav">${SUBS().map(([k, l]) => `<button type="button" data-s="${k}">${l}</button>`).join("")}</nav>
      <div id="sub"></div>`;
    pantalla.querySelectorAll("#subnav button").forEach(b => b.onclick = () => ir(`#viatge/${id}/${b.dataset.s}`));
    await actualitza();
    afegeixPestanya(id, true);
    obreXat($("sub"), v, null);
  };

  function afegeixPestanya(id, actiu){
    const nav = $("subnav"); if(!nav || nav.querySelector('[data-s="missatges"]')) return;
    nav.insertAdjacentHTML("beforeend", `<button type="button" data-s="missatges" class="${actiu ? "actiu" : ""}">💬 ${L("Missatges", "Mensajes")}${bombolla(nViatge(id))}</button>`);
    nav.querySelector('[data-s="missatges"]').onclick = () => ir(`#viatge/${id}/missatges`);
    if(actiu) nav.querySelector(".actiu")?.scrollIntoView({ inline: "center", block: "nearest" });
  }

  async function obreXat(cont, v, fil){
    const { data: vcs } = await sb.from("an_viatge_clients").select("client_id, titular, an_clients(nom, cognoms)").eq("viatge_id", v.id);
    const clients = (vcs || []).map(x => ({ id: x.client_id, nom: [x.an_clients?.nom, x.an_clients?.cognoms].filter(Boolean).join(" ") }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
    cont.innerHTML = `
      ${XAT.notificacions.targeta(LANG, true)}
      ${v.publicat ? "" : `<div class="avis" style="margin-bottom:10px">${L("El viatge encara no està publicat: els viatgers no veuran els missatges fins que el publiquis.",
        "El viaje todavía no está publicado: los viajeros no verán los mensajes hasta que lo publiques.")}</div>`}
      <div class="xat-fils">
        <button type="button" data-fil="" class="${fil ? "" : "actiu"}">👥 ${L("Grup del viatge", "Grupo del viaje")}${bombolla(fil ? nViatge(v.id, null) : 0)}</button>
        ${clients.map(c => `<button type="button" data-fil="${c.id}" class="${fil === c.id ? "actiu" : ""}">🔒 ${esc(c.nom)}${bombolla(fil === c.id ? 0 : nViatge(v.id, c.id))}</button>`).join("")}
      </div>
      <p class="meta" style="margin:0 0 8px">${fil
        ? L("Conversa privada: només la veu aquest viatger.", "Conversación privada: solo la ve este viajero.")
        : L("Grup: ho veuen tots els viatgers d'aquest viatge.", "Grupo: lo ven todos los viajeros de este viaje.")}${clients.length ? "" : " " + L("Encara no hi ha viatgers assignats.", "Todavía no hay viajeros asignados.")}</p>
      <div id="xatCont"></div>`;
    XAT.notificacions.lliga(cont, sb, LANG);
    cont.querySelectorAll("[data-fil]").forEach(b => b.onclick = () => obreXat(cont, v, b.dataset.fil || null));
    await XAT.munta($("xatCont"), { sb, viatgeId: v.id, fil, esAgencia: true, jo: null, idioma: LANG, onLlegit: actualitza });
  }

  // ---- Llista de viatges: missatges nous a dalt ----
  const vistaViatges0 = vistaViatges;
  vistaViatges = async function(){
    await vistaViatges0();
    if(A.nomesApps) return;
    await actualitza();
    const notif = XAT.notificacions.targeta(LANG, true);
    const nous = NL.length ? `<div class="targeta"><h2 style="margin-top:0">💬 ${L("Missatges nous", "Mensajes nuevos")}</h2>
      ${NL.map(x => `<div class="doc" style="cursor:pointer" data-anar="${x.viatge_id}">
        <div class="n"><b>${esc(x.titol)}</b><span class="meta">${x.fil ? "🔒 " + esc(x.fil_nom || "") : "👥 " + L("Grup del viatge", "Grupo del viaje")}</span></div>
        <span class="xat-num">${x.n}</span></div>`).join("")}</div>` : "";
    if(!nous && !notif) return;
    pantalla.insertAdjacentHTML("afterbegin", `<div id="xatResum">${notif}${nous}</div>`);
    XAT.notificacions.lliga($("xatResum"), sb, LANG);
    pantalla.querySelectorAll("[data-anar]").forEach(d => d.onclick = () => ir(`#viatge/${d.dataset.anar}/missatges`));
  };

  // Mantenir la subscripció al dia i refrescar el comptador cada minut
  let refrescat = false;
  const pintaNav0 = pintaNav;
  pintaNav = function(){
    pintaNav0();
    if(A.nomesApps || !A.agencia) return;
    actualitza();
    if(!refrescat){ refrescat = true; XAT.notificacions.refresca(sb, LANG); }
  };
  setInterval(() => { if(A.agencia && !A.nomesApps && !document.hidden) actualitza(); }, 60000);
})();
