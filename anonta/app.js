// Anonta · App del client
const sb = supabase.createClient(RIMU.SUPABASE_URL, RIMU.SUPABASE_KEY, { auth: { storageKey: "anonta-client" } });
const { esc, text, euros } = AN;
const main = document.getElementById("main");
const S = { idioma: null, client: null, viatges: [], agencies: {} };

// ---------- textos ----------
const T = {
  ca: {
    lema: "ELS MEUS VIATGES", entra: "Entra", correu: "Correu", contrasenya: "Contrasenya",
    benvinguda: "Hi trobaràs tota la informació dels teus viatges: serveis, documents, itinerari i recomanacions.",
    errLogin: "Correu o contrasenya incorrectes.", oblidada: "Has oblidat la contrasenya? Escriu a la teva agència i te'n posarà una de nova.",
    hola: "Hola", elsMeus: "Els teus viatges", capViatge: "Encara no tens cap viatge disponible. Quan l'agència el publiqui, el veuràs aquí.",
    passats: "Viatges anteriors", tornar: "← Els meus viatges",
    resum: "Resum", serveis: "Serveis", documents: "Documents", pagaments: "Pagaments", itinerari: "Itinerari", desti: "Destí",
    falten: n => n === 1 ? "Falta 1 dia" : `Falten ${n} dies`, avui: "Avui comença el viatge!", enCurs: "Bon viatge! 🌍", acabat: "Viatge finalitzat",
    cancelat: "Viatge cancel·lat", senseDates: "Dates per confirmar",
    destinacio: "Destinació", dates: "Dates", referencia: "Referència", viatgers: "Viatgers", titular: "titular",
    localitzador: "Localitzador", obre: "Obre", total: "Total", pagat: "Pagat", pendent: "Pendent",
    propers: "Propers pagaments", fets: "Pagaments fets", venc: d => `abans del ${d}`, pagatEl: d => `pagat el ${d}`,
    mapa: "Com arribar-hi", web: "Web", compte: "El meu compte", canviaPass: "Canvia la contrasenya", passNova: "Contrasenya nova (mínim 8 caràcters)",
    desa: "Desa", tanca: "Tanca", sortir: "Tanca la sessió", passOk: "Contrasenya canviada ✓", passCurta: "Ha de tenir 8 caràcters o més.",
    instal: "Afegeix l'app a la pantalla d'inici per tenir-la sempre a mà.", instalBoto: "Instal·la", ios: "Toca ⎋ Compartir i després «Afegeix a la pantalla d'inici».",
    err: "No s'ha pogut carregar. Comprova la connexió.", errDoc: "No s'ha pogut obrir el document.", de: "de"
  },
  es: {
    lema: "MIS VIAJES", entra: "Entrar", correu: "Correo", contrasenya: "Contraseña",
    benvinguda: "Aquí encontrarás toda la información de tus viajes: servicios, documentos, itinerario y recomendaciones.",
    errLogin: "Correo o contraseña incorrectos.", oblidada: "¿Has olvidado la contraseña? Escribe a tu agencia y te pondrá una nueva.",
    hola: "Hola", elsMeus: "Tus viajes", capViatge: "Todavía no tienes ningún viaje disponible. Cuando la agencia lo publique, lo verás aquí.",
    passats: "Viajes anteriores", tornar: "← Mis viajes",
    resum: "Resumen", serveis: "Servicios", documents: "Documentos", pagaments: "Pagos", itinerari: "Itinerario", desti: "Destino",
    falten: n => n === 1 ? "Falta 1 día" : `Faltan ${n} días`, avui: "¡Hoy empieza el viaje!", enCurs: "¡Buen viaje! 🌍", acabat: "Viaje finalizado",
    cancelat: "Viaje cancelado", senseDates: "Fechas por confirmar",
    destinacio: "Destino", dates: "Fechas", referencia: "Referencia", viatgers: "Viajeros", titular: "titular",
    localitzador: "Localizador", obre: "Abrir", total: "Total", pagat: "Pagado", pendent: "Pendiente",
    propers: "Próximos pagos", fets: "Pagos realizados", venc: d => `antes del ${d}`, pagatEl: d => `pagado el ${d}`,
    mapa: "Cómo llegar", web: "Web", compte: "Mi cuenta", canviaPass: "Cambiar la contraseña", passNova: "Contraseña nueva (mínimo 8 caracteres)",
    desa: "Guardar", tanca: "Cerrar", sortir: "Cerrar sesión", passOk: "Contraseña cambiada ✓", passCurta: "Debe tener 8 caracteres o más.",
    instal: "Añade la app a la pantalla de inicio para tenerla siempre a mano.", instalBoto: "Instalar", ios: "Toca ⎋ Compartir y después «Añadir a pantalla de inicio».",
    err: "No se ha podido cargar. Comprueba la conexión.", errDoc: "No se ha podido abrir el documento.", de: "de"
  }
};
const t = k => T[S.idioma][k];
const nomCat = (map, k) => map[k]?.[S.idioma] || "";

function posarIdioma(l){
  S.idioma = l === "es" ? "es" : "ca";
  try{ localStorage.setItem("anonta-idioma", S.idioma); }catch{}
  document.documentElement.lang = S.idioma;
  document.getElementById("lema").textContent = t("lema");
  document.querySelectorAll("#idiomes button").forEach(b => b.classList.toggle("actiu", b.dataset.l === S.idioma));
}
document.querySelectorAll("#idiomes button").forEach(b => b.onclick = () => { posarIdioma(b.dataset.l); route(); });
(function(){
  let l = null;
  try{ l = localStorage.getItem("anonta-idioma"); }catch{}
  if(!l) l = /^es/i.test(navigator.language || "") ? "es" : "ca";
  posarIdioma(l);
})();
AN.posarLogo(null);

function avis(msg, err){
  const d = document.createElement("div");
  d.className = "toast" + (err ? " err" : "");
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2600);
}

// ---------- entrada ----------
async function inici(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session) return pantallaLogin();
  try{
    const [{ data: cl }, { data: vs, error }] = await Promise.all([
      sb.from("an_clients").select("nom, cognoms, idioma").eq("user_id", session.user.id).maybeSingle(),
      sb.from("an_viatges").select("*").order("data_inici", { ascending: true, nullsFirst: false })
    ]);
    if(error) throw error;
    S.client = cl;
    S.viatges = vs || [];
    let triat = null;
    try{ triat = localStorage.getItem("anonta-idioma-triat"); }catch{}
    if(cl && !triat) posarIdioma(cl.idioma);
    const ags = [...new Set(S.viatges.map(v => v.agencia_id))];
    if(ags.length){
      const { data: a } = await sb.from("agencies").select("id, nom, color, color_fosc, color_clar, accent, accent_clar, logo_url").in("id", ags);
      (a || []).forEach(x => S.agencies[x.id] = x);
      const ag = S.agencies[ags[0]];
      if(ag){ AN.aplicarColors(ag); AN.posarLogo(ag); }
    }
    const urls = await AN.urlsSignades(sb, S.viatges.map(v => v.portada));
    S.viatges.forEach(v => v._portada = urls[v.portada] || null);
  }catch(e){
    main.innerHTML = `<div class="targeta centre">${esc(t("err"))}<p><button class="boto sec" onclick="inici()">↻</button></p></div>`;
    return;
  }
  document.getElementById("menu").classList.remove("amagat");
  if(!location.hash && S.viatges.length === 1) location.replace("#viatge/" + S.viatges[0].id);
  route();
}
document.querySelectorAll("#idiomes button").forEach(b => b.addEventListener("click", () => { try{ localStorage.setItem("anonta-idioma-triat", "1"); }catch{} }));

function pantallaLogin(){
  document.getElementById("menu").classList.add("amagat");
  main.innerHTML = `
    <form class="targeta" id="fLogin">
      <p style="margin-top:0">${esc(t("benvinguda"))}</p>
      <div class="camp"><label for="lEmail">${esc(t("correu"))}</label><input id="lEmail" type="email" autocomplete="username" required></div>
      <div class="camp"><label for="lPass">${esc(t("contrasenya"))}</label><input id="lPass" type="password" autocomplete="current-password" required></div>
      <button class="boto ample" type="submit">${esc(t("entra"))}</button>
      <div class="error" id="lErr"></div>
      <p class="ajuda">${esc(t("oblidada"))}</p>
    </form>`;
  document.getElementById("fLogin").onsubmit = async e => {
    e.preventDefault();
    const b = e.target.querySelector("button"); b.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: document.getElementById("lEmail").value.trim(), password: document.getElementById("lPass").value });
    b.disabled = false;
    if(error){ document.getElementById("lErr").textContent = t("errLogin"); return; }
    inici();
  };
}

window.addEventListener("hashchange", route);
function route(){
  if(document.getElementById("menu").classList.contains("amagat")){
    if(document.getElementById("fLogin")) pantallaLogin();
    return;
  }
  const [v, id, tab] = location.hash.replace(/^#/, "").split("/");
  window.scrollTo(0, 0);
  if(v === "viatge" && S.viatges.find(x => x.id === id)) return pantallaViatge(id, tab || "resum");
  pantallaLlista();
}

// ---------- fase del viatge ----------
function fase(v){
  const avui = AN.avui();
  if(v.estat === "cancelat") return { txt: t("cancelat"), cls: "coral" };
  if(!v.data_inici) return { txt: t("senseDates"), cls: "" };
  if(avui < v.data_inici){ const n = AN.diesEntre(avui, v.data_inici); return { txt: t("falten")(n), cls: "blau" }; }
  if(avui === v.data_inici) return { txt: t("avui"), cls: "verd" };
  if(!v.data_fi || avui <= v.data_fi) return { txt: t("enCurs"), cls: "verd" };
  return { txt: t("acabat"), cls: "" };
}
const datesViatge = v => v.data_inici ? AN.dataMitja(v.data_inici, S.idioma) + (v.data_fi ? " – " + AN.dataMitja(v.data_fi, S.idioma) : "") : t("senseDates");

// ---------- llista ----------
function pantallaLlista(){
  const avui = AN.avui();
  const actius = S.viatges.filter(v => !v.data_fi || v.data_fi >= avui);
  const passats = S.viatges.filter(v => v.data_fi && v.data_fi < avui).reverse();
  const targeta = v => {
    const f = fase(v);
    return `<div class="targeta targeta-viatge" data-id="${v.id}" role="button" tabindex="0">
      <div class="img" ${v._portada ? `style="background-image:url('${v._portada}')"` : ""}>${v._portada ? "" : "🧳"}</div>
      <div class="cos"><div class="viatge-titol" style="font-size:20px">${esc(v.titol)}</div>
        <div class="viatge-dates">${esc([v.desti, v.pais].filter(Boolean).join(", "))}</div>
        <div class="viatge-dates">${esc(datesViatge(v))}</div>
        <div style="margin-top:8px"><span class="xip ${f.cls}">${esc(f.txt)}</span></div></div>
    </div>`;
  };
  main.innerHTML = `
    ${bannerInstal()}
    <h2 style="margin-bottom:4px">${esc(t("hola"))}${S.client?.nom ? " " + esc(S.client.nom) : ""}! 👋</h2>
    <p class="meta" style="margin-top:0">${esc(t("elsMeus"))}</p>
    ${actius.length ? actius.map(targeta).join("") : (passats.length ? "" : `<div class="buit">${esc(t("capViatge"))}</div>`)}
    ${passats.length ? `<h3>${esc(t("passats"))}</h3>${passats.map(targeta).join("")}` : ""}`;
  main.querySelectorAll(".targeta-viatge").forEach(el => {
    const obre = () => location.hash = "#viatge/" + el.dataset.id;
    el.onclick = obre; el.onkeydown = e => { if(e.key === "Enter") obre(); };
  });
  activarBanner();
}

// ---------- fitxa del viatge ----------
async function pantallaViatge(id, tab){
  const v = S.viatges.find(x => x.id === id);
  main.innerHTML = `<p class="meta centre">…</p>`;
  let d;
  try{ d = await carregarViatge(v); }catch(e){ main.innerHTML = `<div class="targeta centre">${esc(t("err"))}</div>`; return; }
  const tabs = [
    ["resum", true], ["serveis", d.serveis.length], ["documents", d.docs.length], ["pagaments", d.pagaments !== null],
    ["itinerari", d.dies.length], ["desti", d.desti.length]
  ].filter(x => x[1]).map(x => x[0]);
  if(!tabs.includes(tab)) tab = "resum";
  main.innerHTML = `
    ${S.viatges.length > 1 ? `<button class="tornar" type="button" onclick="location.hash=''">${esc(t("tornar"))}</button>` : ""}
    <div class="viatge-titol">${esc(v.titol)}</div>
    <div class="viatge-dates">${esc([v.desti, v.pais].filter(Boolean).join(", "))} · ${esc(datesViatge(v))}</div>
    <div class="ratlla"></div>
    <nav class="pestanyes">${tabs.map(k => `<button type="button" data-t="${k}" class="${k === tab ? "actiu" : ""}">${esc(t(k))}</button>`).join("")}</nav>
    <div id="cos"></div>`;
  main.querySelectorAll(".pestanyes button").forEach(b => b.onclick = () => location.hash = `#viatge/${id}/${b.dataset.t}`);
  const cos = document.getElementById("cos");
  ({ resum: tabResum, serveis: tabServeis, documents: tabDocuments, pagaments: tabPagaments, itinerari: tabItinerari, desti: tabDesti })[tab](cos, v, d);
  main.querySelector(".pestanyes .actiu")?.scrollIntoView({ inline: "center", block: "nearest" });
}

const cache = {};
async function carregarViatge(v){
  if(cache[v.id] && Date.now() - cache[v.id].t < 60000) return cache[v.id].d;
  const [serveis, docs, pags, dies, desti, companys] = await Promise.all([
    sb.from("an_serveis").select("*").eq("viatge_id", v.id).order("data_inici", { nullsFirst: false }).order("hora_inici", { nullsFirst: false }).order("created_at"),
    sb.from("an_documents").select("id, nom, categoria, path, mida").eq("viatge_id", v.id).order("created_at"),
    sb.from("an_pagaments").select("*").eq("viatge_id", v.id).order("data_venciment", { nullsFirst: false }),
    sb.from("an_dies").select("*, an_activitats(*)").eq("viatge_id", v.id).order("ordre"),
    sb.from("an_desti").select("*").eq("viatge_id", v.id).order("ordre"),
    sb.rpc("an_companys", { p_viatge: v.id })
  ]);
  for(const r of [serveis, docs, pags, dies, desti]) if(r.error) throw r.error;
  const dd = {
    serveis: serveis.data || [], docs: docs.data || [],
    // si no és titular (o el viatge no mostra pagaments) no rep cap fila; amb total i sense files tampoc es mostra
    pagaments: (pags.data || []).length || (v.mostrar_pagaments && v.import_total != null && await esTitular(v.id)) ? (pags.data || []) : null,
    dies: (dies.data || []).map(x => ({ ...x, an_activitats: (x.an_activitats || []).sort((a, b) => a.ordre - b.ordre) })),
    desti: desti.data || [], companys: companys.data || []
  };
  dd.fotos = await AN.urlsSignades(sb, [...dd.dies.map(x => x.foto), ...dd.desti.map(x => x.foto)]);
  cache[v.id] = { t: Date.now(), d: dd };
  return dd;
}
async function esTitular(viatgeId){
  const { data } = await sb.rpc("an_veu_pagaments", { p_viatge: viatgeId });
  return data === true;
}

function tabResum(cos, v, d){
  const f = fase(v);
  cos.innerHTML = `
    <div class="targeta">
      ${v._portada ? `<div class="portada" style="background-image:url('${v._portada}')"></div>` : ""}
      <div class="compte">${esc(f.txt)}</div>
      ${v.descripcio ? `<p>${text(v.descripcio)}</p>` : ""}
      <dl class="kv" style="margin-top:14px">
        ${v.desti || v.pais ? `<div><dt>${esc(t("destinacio"))}</dt><dd>${esc([v.desti, v.pais].filter(Boolean).join(", "))}</dd></div>` : ""}
        <div><dt>${esc(t("dates"))}</dt><dd>${esc(datesViatge(v))}</dd></div>
        ${v.referencia ? `<div><dt>${esc(t("referencia"))}</dt><dd>${esc(v.referencia)}</dd></div>` : ""}
        ${d.companys.length ? `<div><dt>${esc(t("viatgers"))}</dt><dd>${d.companys.map(c => esc(AN.nomComplet(c)) + (c.titular && d.companys.length > 1 ? ` <span class="meta">(${t("titular")})</span>` : "")).join("<br>")}</dd></div>` : ""}
      </dl>
    </div>`;
}

function tabServeis(cos, v, d){
  cos.innerHTML = `<div class="targeta">${d.serveis.map(s => {
    const ti = AN.TIPUS_SERVEI[s.tipus] || AN.TIPUS_SERVEI.altre;
    const ini = s.data_inici ? AN.dataMitja(s.data_inici, S.idioma) + (s.hora_inici ? " · " + s.hora_inici : "") : "";
    const fi = s.data_fi && (s.data_fi !== s.data_inici || s.hora_fi) ? AN.dataMitja(s.data_fi, S.idioma) + (s.hora_fi ? " · " + s.hora_fi : "") : (s.hora_fi ? s.hora_fi : "");
    return `<div class="servei"><div class="ico">${ti.ico}</div><div style="flex:1;min-width:0">
      <div class="meta">${esc(ti[S.idioma])}${s.proveidor ? " · " + esc(s.proveidor) : ""}</div>
      <div class="nom">${esc(s.titol)}</div>
      ${ini ? `<div class="meta">📅 ${esc(ini)}${fi ? " → " + esc(fi) : ""}</div>` : ""}
      ${s.localitzador ? `<div style="margin-top:4px">${esc(t("localitzador"))}: <span class="loc">${esc(s.localitzador)}</span></div>` : ""}
      ${s.descripcio ? `<div style="margin-top:6px;font-size:15px">${text(s.descripcio)}</div>` : ""}
    </div></div>`;
  }).join("")}</div>`;
}

function tabDocuments(cos, v, d){
  const grups = {};
  d.docs.forEach(x => (grups[x.categoria] = grups[x.categoria] || []).push(x));
  cos.innerHTML = Object.keys(AN.CATEGORIA_DOC).filter(k => grups[k]).map(k => `
    <div class="targeta"><h2>${AN.CATEGORIA_DOC[k].ico} ${esc(nomCat(AN.CATEGORIA_DOC, k))}</h2>
      ${grups[k].map(x => `<div class="doc"><div class="n"><b>${esc(x.nom)}</b><span class="meta">${AN.mida(x.mida)}</span></div>
        <button class="boto petit sec" type="button" data-p="${esc(x.path)}">${esc(t("obre"))}</button></div>`).join("")}
    </div>`).join("");
  cos.querySelectorAll("[data-p]").forEach(b => b.onclick = async () => {
    const w = window.open("", "_blank");
    const { data, error } = await sb.storage.from(AN.BUCKET).createSignedUrl(b.dataset.p, 600);
    if(error || !data){ w && w.close(); return avis(t("errDoc"), true); }
    if(w) w.location = data.signedUrl; else location.href = data.signedUrl;
  });
}

function tabPagaments(cos, v, d){
  const fets = d.pagaments.filter(p => p.data_pagament);
  const pend = d.pagaments.filter(p => !p.data_pagament);
  const pagat = fets.reduce((a, p) => a + Number(p.import || 0), 0);
  const total = v.import_total != null ? Number(v.import_total) : null;
  const pct = total ? Math.min(100, Math.round(pagat / total * 100)) : 0;
  const dc = iso => AN.dataMitja(iso, S.idioma);
  cos.innerHTML = `
    <div class="targeta">
      <dl class="kv">
        ${total != null ? `<div><dt>${esc(t("total"))}</dt><dd class="compte">${euros(total, S.idioma)}</dd></div>` : ""}
        <div><dt>${esc(t("pagat"))}</dt><dd class="compte" style="color:var(--verd)">${euros(pagat, S.idioma)}</dd></div>
        ${total != null ? `<div><dt>${esc(t("pendent"))}</dt><dd class="compte" style="color:#A4504A">${euros(Math.max(0, total - pagat), S.idioma)}</dd></div>` : ""}
      </dl>
      ${total ? `<div class="barra"><div style="width:${pct}%"></div></div><div class="meta">${pct}%</div>` : ""}
    </div>
    ${pend.length ? `<div class="targeta"><h2>⏳ ${esc(t("propers"))}</h2>${pend.map(p => `<div class="pag"><span>${esc(p.concepte)}${p.data_venciment ? `<br><span class="meta">${esc(t("venc")(dc(p.data_venciment)))}</span>` : ""}</span><b>${euros(p.import, S.idioma)}</b></div>`).join("")}</div>` : ""}
    ${fets.length ? `<div class="targeta"><h2>✅ ${esc(t("fets"))}</h2>${fets.map(p => `<div class="pag"><span>${esc(p.concepte)}<br><span class="meta">${esc(t("pagatEl")(dc(p.data_pagament)))}</span></span><b>${euros(p.import, S.idioma)}</b></div>`).join("")}</div>` : ""}`;
}

function tabItinerari(cos, v, d){
  cos.innerHTML = d.dies.map((x, i) => `
    <div class="targeta dia">
      <div class="meta" style="text-transform:capitalize">${x.data ? esc(AN.dataLlarga(x.data, S.idioma)) : (S.idioma === "es" ? "Día " : "Dia ") + (i + 1)}</div>
      <h2>${esc(x.titol)}</h2>
      ${x.foto && d.fotos[x.foto] ? `<img class="foto" src="${d.fotos[x.foto]}" alt="" loading="lazy">` : ""}
      ${x.descripcio ? `<p style="margin:6px 0 10px">${text(x.descripcio)}</p>` : ""}
      ${x.an_activitats.map(a => `<div class="act">${a.hora ? `<span class="hora">${esc(a.hora)}</span>` : ""}<b>${esc(a.nom)}</b>
        ${a.lloc ? `<div class="meta">📍 ${esc(a.lloc)}</div>` : ""}${a.descripcio ? `<div style="font-size:15px">${text(a.descripcio)}</div>` : ""}</div>`).join("")}
    </div>`).join("");
}

function tabDesti(cos, v, d){
  const grups = {};
  d.desti.forEach(x => (grups[x.categoria] = grups[x.categoria] || []).push(x));
  cos.innerHTML = Object.keys(AN.CATEGORIA_DESTI).filter(k => grups[k]).map(k => `
    <div class="targeta"><h2>${AN.CATEGORIA_DESTI[k].ico} ${esc(nomCat(AN.CATEGORIA_DESTI, k))}</h2>
      ${grups[k].map(r => `<div class="rec">
        ${r.foto && d.fotos[r.foto] ? `<img src="${d.fotos[r.foto]}" alt="" loading="lazy">` : ""}
        <div style="flex:1;min-width:0"><b>${esc(r.titol)}</b>
          ${r.descripcio ? `<div style="font-size:15px;margin-top:2px">${text(r.descripcio)}</div>` : ""}
          ${r.adreca ? `<div class="meta" style="margin-top:4px">📍 ${esc(r.adreca)}</div>` : ""}
          <div class="fila" style="margin-top:6px">
            ${r.adreca ? `<a class="mini" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.adreca)}">🗺️ ${esc(t("mapa"))}</a>` : ""}
            ${r.enllac && /^https?:\/\//i.test(r.enllac) ? `<a class="mini" target="_blank" rel="noopener" href="${esc(r.enllac)}">🔗 ${esc(t("web"))}</a>` : ""}
          </div></div></div>`).join("")}
    </div>`).join("");
}

// ---------- compte ----------
document.getElementById("bCompte").onclick = () => {
  const f = document.createElement("div");
  f.className = "modal-fons";
  f.innerHTML = `<div class="modal">
    <h2>${esc(t("compte"))}</h2>
    <form id="fPass"><div class="camp"><label>${esc(t("passNova"))}</label><input type="password" id="pNova" autocomplete="new-password" minlength="8" required></div>
    <button class="boto" type="submit">${esc(t("canviaPass"))}</button></form>
    <hr style="border:0;border-top:1px solid var(--linia);margin:18px 0">
    <div class="fila entre"><button class="boto sec" type="button" id="bSortir">${esc(t("sortir"))}</button>
      <button class="boto sec" type="button" data-tanca>${esc(t("tanca"))}</button></div></div>`;
  f.addEventListener("click", e => { if(e.target === f || e.target.hasAttribute("data-tanca")) f.remove(); });
  document.body.appendChild(f);
  f.querySelector("#fPass").onsubmit = async e => {
    e.preventDefault();
    const p = f.querySelector("#pNova").value;
    if(p.length < 8) return avis(t("passCurta"), true);
    const { error } = await sb.auth.updateUser({ password: p });
    if(error) return avis(error.message, true);
    f.remove(); avis(t("passOk"));
  };
  f.querySelector("#bSortir").onclick = async () => {
    await sb.auth.signOut();
    location.hash = ""; location.reload();
  };
};

// ---------- instal·lar com a app ----------
let promptInstal = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); promptInstal = e; if(!location.hash) pantallaLlista(); });
const esStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
function bannerInstal(){
  let tancat = false; try{ tancat = localStorage.getItem("anonta-instal-tancat") === "1"; }catch{}
  if(esStandalone() || tancat) return "";
  if(promptInstal) return `<div class="instal" id="instal"><span>📲 ${esc(t("instal"))}</span><span class="fila"><button class="boto petit" type="button" id="bInstal">${esc(t("instalBoto"))}</button><button class="mini" type="button" id="bInstalNo">✕</button></span></div>`;
  if(esIOS()) return `<div class="instal" id="instal"><span>📲 ${esc(t("instal"))}<br><span class="meta">${esc(t("ios"))}</span></span><button class="mini" type="button" id="bInstalNo">✕</button></div>`;
  return "";
}
function activarBanner(){
  const b = document.getElementById("bInstal");
  if(b) b.onclick = async () => { promptInstal.prompt(); await promptInstal.userChoice; promptInstal = null; document.getElementById("instal")?.remove(); };
  const n = document.getElementById("bInstalNo");
  if(n) n.onclick = () => { try{ localStorage.setItem("anonta-instal-tancat", "1"); }catch{} document.getElementById("instal")?.remove(); };
}
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

inici();
