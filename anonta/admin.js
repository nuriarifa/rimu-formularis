// Anonta · Panell de l'agència (català / castellà)
const sb = supabase.createClient(RIMU.SUPABASE_URL, RIMU.SUPABASE_KEY);
const $ = id => document.getElementById(id);
const { esc, text, euros, dataCurta, nomComplet } = AN;
const DEMO = new URLSearchParams(location.search).has("demo");
const A = { agencia: null, superadmin: false, clients: [], potCrear: true };
const pantalla = $("pantalla");

// ---------- idioma del panell ----------
let LANG = (() => {
  try{ const l = localStorage.getItem("anonta-idioma-panell"); if(l) return l; }catch{}
  return /^es/i.test(navigator.language || "") ? "es" : "ca";
})();
const L = (ca, es) => LANG === "es" ? es : ca;
const lbl = v => v ? v[LANG] || v.ca : "";
function posarIdioma(l){
  LANG = l === "es" ? "es" : "ca";
  try{ localStorage.setItem("anonta-idioma-panell", LANG); }catch{}
  document.documentElement.lang = LANG;
  document.querySelectorAll("#idiomes button").forEach(b => b.classList.toggle("actiu", b.dataset.l === LANG));
  $("lema").textContent = L("PANELL DE L'AGÈNCIA", "PANEL DE LA AGENCIA");
  document.title = "Anonta · " + L("Panell de l'agència", "Panel de la agencia");
  $("bSortir").textContent = L("Sortir", "Salir");
  $("tLoginTitol").textContent = L("Entra al panell", "Entra en el panel");
  $("tCorreu").textContent = L("Correu", "Correo");
  $("tPass").textContent = L("Contrasenya", "Contraseña");
  $("tEntra").textContent = L("Entra", "Entrar");
  $("lnkCrear").textContent = L("Primer cop? Crear la contrasenya", "¿Primera vez? Crear la contraseña");
  $("tLoginAjuda").textContent = L("El primer cop, escriu el teu correu i la contrasenya que vulguis (mínim 8 caràcters) i prem «Primer cop? Crear la contrasenya».",
    "La primera vez, escribe tu correo y la contraseña que quieras (mínimo 8 caracteres) y pulsa «¿Primera vez? Crear la contraseña».");
  $("tNoPermis").textContent = L("Aquest usuari no té accés al panell d'Anonta.", "Este usuario no tiene acceso al panel de Anonta.");
  $("tSortir2").textContent = L("Sortir", "Salir");
  pintaNav();
}
document.querySelectorAll("#idiomes button").forEach(b => b.onclick = () => { posarIdioma(b.dataset.l); if(!$("vApp").classList.contains("amagat")){ comprovarProva(); route(); } });

// ---------- utilitats ----------
function avis(msg, err){
  const t = document.createElement("div");
  t.className = "toast" + (err ? " err" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), err ? 4500 : 2200);
}
function errMsg(e){
  const m = String(e?.message || e || "");
  if(/row-level security|permission/i.test(m)) return L("No tens permís per fer això.", "No tienes permiso para hacer esto.");
  if(/Failed to fetch|NetworkError/i.test(m)) return L("Sense connexió. Torna-ho a provar.", "Sin conexión. Vuelve a intentarlo.");
  return "Error: " + m;
}
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2); }
function vist(id){ ["vLogin","vNoPermis","vApp"].forEach(v => $(v).classList.toggle("amagat", v !== id)); }
function ir(hash){ if(location.hash === hash) route(); else location.hash = hash; }
function contrasenyaNova(){
  const a = "abcdefghjkmnpqrstuvwxyz", n = "23456789";
  const r = new Uint32Array(8); crypto.getRandomValues(r);
  let s = "";
  for(let i = 0; i < 5; i++) s += a[r[i] % a.length];
  s = s[0].toUpperCase() + s.slice(1);
  for(let i = 5; i < 8; i++) s += n[r[i] % n.length];
  return s;
}
function opcions(map, sel){
  return Object.entries(map).map(([k, v]) => `<option value="${k}"${k === sel ? " selected" : ""}>${v.ico ? v.ico + " " : ""}${esc(lbl(v))}</option>`).join("");
}
const diesFins = iso => AN.diesEntre(AN.avui(), iso);

// ---------- pestanyes principals ----------
function pintaNav(){
  const nav = $("navPrincipal");
  const items = [["viatges", "🧳 " + L("Viatges", "Viajes")], ["clients", "👤 " + L("Clients", "Clientes")]];
  if(A.superadmin) items.push(["agencies", "🏢 " + L("Agències", "Agencias")]);
  nav.innerHTML = items.map(([k, t]) => `<button type="button" data-vista="${k}">${t}</button>`).join("");
  nav.querySelectorAll("button").forEach(b => b.onclick = () => ir("#" + b.dataset.vista));
  marcaNav();
}
function marcaNav(){
  const v = location.hash.replace(/^#/, "").split("/")[0];
  const actiu = v === "client" || v === "clients" ? "clients" : v === "agencies" ? "agencies" : "viatges";
  document.querySelectorAll("#navPrincipal button").forEach(b => b.classList.toggle("actiu", b.dataset.vista === actiu));
}

// ---------- entrada ----------
AN.posarMarca(null);
async function inici(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session){ vist("vLogin"); return; }
  const { data: perfil } = await sb.rpc("an_perfil");
  if(!perfil){ vist("vNoPermis"); return; }
  A.agencia = perfil.agencia;
  A.superadmin = !!perfil.superadmin;
  A.email = perfil.email;
  AN.posarMarca(A.agencia);
  $("menu").classList.remove("amagat");
  vist("vApp");
  pintaNav();
  await comprovarProva();
  route();
  if(A.superadmin && window.comptarSollicituds) comptarSollicituds();
}
$("fLogin").addEventListener("submit", async e => {
  e.preventDefault();
  $("lErr").textContent = ""; $("lOk").classList.add("amagat");
  const { error } = await sb.auth.signInWithPassword({ email: $("lEmail").value.trim(), password: $("lPass").value });
  if(error){
    $("lErr").textContent = /confirm/i.test(error.message)
      ? L("Encara cal confirmar el compte des del correu.", "Falta confirmar la cuenta desde el correo.")
      : L("Correu o contrasenya incorrectes.", "Correo o contraseña incorrectos.");
    return;
  }
  inici();
});
$("lnkCrear").onclick = async e => {
  e.preventDefault();
  $("lErr").textContent = ""; $("lOk").classList.add("amagat");
  const email = $("lEmail").value.trim(), pass = $("lPass").value;
  if(!email || pass.length < 8){
    $("lErr").textContent = L("Escriu el correu i una contrasenya d'almenys 8 caràcters.", "Escribe el correo y una contraseña de al menos 8 caracteres.");
    return;
  }
  const { data, error } = await sb.auth.signUp({ email, password: pass });
  if(error){
    $("lErr").textContent = /registered|exists/i.test(error.message)
      ? L("Aquest correu ja té contrasenya: entra amb «Entra».", "Este correo ya tiene contraseña: entra con «Entrar».")
      : error.message;
    return;
  }
  if(data.session){ inici(); return; }
  $("lOk").textContent = L("Compte creat: confirma'l des del correu que t'arribarà i després entra.", "Cuenta creada: confírmala desde el correo que te llegará y después entra.");
  $("lOk").classList.remove("amagat");
};
async function sortir(){ if(!DEMO) await sb.auth.signOut(); location.hash = ""; location.reload(); }
$("bSortir").onclick = sortir;
window.addEventListener("hashchange", route);

function route(){
  const [v, id, sub] = location.hash.replace(/^#/, "").split("/");
  marcaNav();
  window.scrollTo(0, 0);
  if(v === "clients") return vistaClients();
  if(v === "client") return vistaClient(id);
  if(v === "viatge") return vistaViatge(id, sub || "dades");
  if(v === "agencies" && A.superadmin && window.vistaAgencies) return vistaAgencies();
  return vistaViatges();
}

// ---------- mes de prova ----------
async function comprovarProva(){
  const banda = $("bandaProva"), ag = A.agencia;
  A.potCrear = true;
  if(DEMO){
    banda.classList.remove("amagat");
    banda.style.background = "var(--blau-clar)";
    banda.innerHTML = `<div class="fila entre"><span>${L("🎁 T'agrada? Prova-ho <strong>gratis durant un mes</strong> amb el logo i els colors de la teva agència.",
      "🎁 ¿Te gusta? Pruébalo <strong>gratis durante un mes</strong> con el logo y los colores de tu agencia.")}</span>
      <button class="boto petit" type="button" id="bProvaDemo">${L("Comença el mes de prova", "Empieza tu mes de prueba")}</button></div>`;
    $("bProvaDemo").onclick = () => {
      try{ if(window.parent !== window && window.parent.obrirProva){ window.parent.obrirProva(); return; } }catch{}
      location.href = "demo.html#prova";
    };
    return;
  }
  if(!ag || ag.pla !== "prova" || !ag.prova_fins){ banda.classList.add("amagat"); return; }
  const dies = diesFins(ag.prova_fins), data = dataCurta(ag.prova_fins);
  banda.classList.remove("amagat");
  if(dies >= 0){
    banda.style.background = "var(--blau-clar)";
    banda.innerHTML = L(`🎁 Estàs en el <strong>mes de prova</strong>: et queden <strong>${dies} dies</strong> (fins al ${data}).`,
      `🎁 Estás en tu <strong>mes de prueba</strong>: te quedan <strong>${dies} días</strong> (hasta el ${data}).`);
    return;
  }
  A.potCrear = false;
  banda.style.background = "var(--coral-clar)";
  banda.innerHTML = L(`⏳ <strong>El teu mes de prova ha acabat.</strong> Pots continuar veient i editant els teus viatges, i els teus clients els segueixen veient, però per crear-ne de nous cal contractar el servei. Escriu-nos a <a href="mailto:admin@rimuviatges.com">admin@rimuviatges.com</a>.`,
    `⏳ <strong>Tu mes de prueba ha terminado.</strong> Puedes seguir viendo y editando tus viajes, y tus clientes los siguen viendo, pero para crear nuevos hay que contratar el servicio. Escríbenos a <a href="mailto:admin@rimuviatges.com">admin@rimuviatges.com</a>.`);
  if(DEMO) return;
  const { data: primerCop } = await sb.rpc("an_marcar_avis_prova");
  if(primerCop === true) fetch("https://formsubmit.co/ajax/admin@rimuviatges.com", {
    method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ _subject: "Prova d'Anonta acabada: " + ag.nom, _template: "table", _captcha: "false",
      "Agència": ag.nom, "Correu": A.email, "Prova fins": data, "Gestiona-ho al panell": new URL("admin.html#agencies", location.href).href })
  }).catch(() => {});
}

async function carregarClients(){
  const { data, error } = await sb.from("an_clients").select("*").order("nom");
  if(error) throw error;
  A.clients = data || [];
  return A.clients;
}

// =====================================================================
// VIATGES
// =====================================================================
async function vistaViatges(){
  pantalla.innerHTML = `<p class="meta">${L("Carregant…", "Cargando…")}</p>`;
  const { data, error } = await sb.from("an_viatges")
    .select("id, titol, desti, pais, data_inici, data_fi, estat, publicat, referencia, an_viatge_clients(titular, an_clients(nom, cognoms))")
    .order("data_inici", { ascending: true, nullsFirst: false });
  if(error){ pantalla.innerHTML = `<div class="error">${esc(errMsg(error))}</div>`; return; }
  const avui = AN.avui();
  const propers = (data || []).filter(v => !v.data_fi || v.data_fi >= avui);
  const passats = (data || []).filter(v => v.data_fi && v.data_fi < avui).reverse();
  const fila = v => {
    const cl = (v.an_viatge_clients || []).sort((a, b) => b.titular - a.titular).map(x => nomComplet(x.an_clients)).join(", ");
    return `<button type="button" class="llista-it" data-id="${v.id}">
      <div class="fila entre"><span class="titol">${esc(v.titol)}</span>
        <span class="fila">${v.publicat ? `<span class="xip verd">${L("Visible per al client", "Visible para el cliente")}</span>` : `<span class="xip">${L("No publicat", "No publicado")}</span>`}
        ${v.estat === "cancelat" ? `<span class="xip coral">${lbl(AN.ESTAT.cancelat)}</span>` : v.estat === "confirmat" ? `<span class="xip blau">${lbl(AN.ESTAT.confirmat)}</span>` : ""}</span></div>
      <div class="meta">${esc([v.desti, v.pais].filter(Boolean).join(", "))}${v.data_inici ? " · " + dataCurta(v.data_inici) + (v.data_fi ? " → " + dataCurta(v.data_fi) : "") : ""}${v.referencia ? " · Ref. " + esc(v.referencia) : ""}</div>
      <div class="meta">${cl ? "👤 " + esc(cl) : L("Sense viatgers assignats", "Sin viajeros asignados")}</div>
    </button>`;
  };
  pantalla.innerHTML = `
    <div class="fila entre" style="margin-bottom:14px"><h2 style="margin:0">${L("Viatges", "Viajes")}</h2>
      ${A.potCrear ? `<button class="boto petit" type="button" id="bNouViatge">+ ${L("Nou viatge", "Nuevo viaje")}</button>` : ""}</div>
    ${propers.length ? propers.map(fila).join("") : `<div class="buit">${A.potCrear ? L("Encara no hi ha cap viatge. Crea'n un amb «+ Nou viatge».", "Todavía no hay ningún viaje. Crea uno con «+ Nuevo viaje».") : L("No hi ha viatges actius.", "No hay viajes activos.")}</div>`}
    ${passats.length ? `<h3>${L("Viatges ja fets", "Viajes ya realizados")}</h3>${passats.map(fila).join("")}` : ""}`;
  pantalla.querySelectorAll(".llista-it").forEach(b => b.onclick = () => ir("#viatge/" + b.dataset.id));
  if($("bNouViatge")) $("bNouViatge").onclick = nouViatge;
}

function nouViatge(){
  modal(`<h2>${L("Nou viatge", "Nuevo viaje")}</h2>
    <form id="fNouV">
      <div class="camp"><label>${L("Títol del viatge", "Título del viaje")} *</label><input name="titol" required placeholder="${L("Ex.: Japó en família", "Ej.: Japón en familia")}"></div>
      <div class="graella">
        <div class="camp"><label>${L("Destinació", "Destino")}</label><input name="desti" placeholder="${L("Ex.: Tòquio i Kyoto", "Ej.: Tokio y Kioto")}"></div>
        <div class="camp"><label>${L("País", "País")}</label><input name="pais"></div>
        <div class="camp"><label>${L("Data d'inici", "Fecha de inicio")}</label><input name="data_inici" type="date"></div>
        <div class="camp"><label>${L("Data de tornada", "Fecha de regreso")}</label><input name="data_fi" type="date"></div>
      </div>
      <div class="fila"><button class="boto" type="submit">${L("Crea el viatge", "Crear el viaje")}</button><button class="boto sec" type="button" data-tanca>${L("Cancel·la", "Cancelar")}</button></div>
    </form>`, m => {
    m.querySelector("#fNouV").onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      Object.keys(f).forEach(k => { if(f[k] === "") f[k] = null; });
      if(f.data_inici && f.data_fi && f.data_fi < f.data_inici) return avis(L("La tornada no pot ser abans de la sortida.", "La vuelta no puede ser antes de la salida."), true);
      const { data, error } = await sb.from("an_viatges").insert(f).select("id").single();
      if(error) return avis(errMsg(error), true);
      tancarModal();
      ir("#viatge/" + data.id + "/viatgers");
    };
  });
}

// ---------- fitxa del viatge ----------
const SUBS = () => [
  ["dades", "📝 " + L("Dades", "Datos")], ["viatgers", "👥 " + L("Viatgers", "Viajeros")], ["serveis", "🧾 " + L("Serveis", "Servicios")],
  ["documents", "📎 " + L("Documents", "Documentos")], ["pagaments", "💶 " + L("Pagaments", "Pagos")],
  ["itinerari", "🗺️ " + L("Itinerari", "Itinerario")], ["desti", "📍 " + L("Destí", "Destino")]
];
async function vistaViatge(id, sub){
  const { data: v, error } = await sb.from("an_viatges").select("*").eq("id", id).maybeSingle();
  if(error || !v){ pantalla.innerHTML = `<div class="error">${L("No s'ha trobat el viatge.", "No se ha encontrado el viaje.")}</div>`; return; }
  A.viatge = v;
  pantalla.innerHTML = `
    <button class="tornar" type="button" onclick="ir('#viatges')">← ${L("Tots els viatges", "Todos los viajes")}</button>
    <div class="fila entre"><h2 style="margin:0">${esc(v.titol)}</h2>
      ${v.publicat ? `<span class="xip verd">${L("Visible per al client", "Visible para el cliente")}</span>` : `<span class="xip">${L("No publicat", "No publicado")}</span>`}</div>
    <p class="meta" style="margin-top:2px">${esc([v.desti, v.pais].filter(Boolean).join(", "))}${v.data_inici ? " · " + dataCurta(v.data_inici) + (v.data_fi ? " → " + dataCurta(v.data_fi) : "") : ""}</p>
    <nav class="pestanyes" id="subnav">${SUBS().map(([k, l]) => `<button type="button" data-s="${k}" class="${k === sub ? "actiu" : ""}">${l}</button>`).join("")}</nav>
    <div id="sub"></div>`;
  pantalla.querySelectorAll("#subnav button").forEach(b => b.onclick = () => ir(`#viatge/${id}/${b.dataset.s}`));
  const cont = $("sub");
  ({ dades: subDades, viatgers: subViatgers, serveis: subServeis, documents: subDocuments, pagaments: subPagaments,
     itinerari: subItinerari, desti: subDesti }[sub] || subDades)(cont, v);
}

// ---- Dades ----
async function subDades(cont, v){
  const urls = await AN.urlsSignades(sb, [v.portada]);
  cont.innerHTML = `
    <form class="targeta" id="fDades">
      <div class="camp"><label>${L("Títol", "Título")} *</label><input name="titol" required value="${esc(v.titol)}"></div>
      <div class="graella">
        <div class="camp"><label>${L("Destinació", "Destino")}</label><input name="desti" value="${esc(v.desti)}"></div>
        <div class="camp"><label>País</label><input name="pais" value="${esc(v.pais)}"></div>
        <div class="camp"><label>${L("Data d'inici", "Fecha de inicio")}</label><input name="data_inici" type="date" value="${esc(v.data_inici)}"></div>
        <div class="camp"><label>${L("Data de tornada", "Fecha de regreso")}</label><input name="data_fi" type="date" value="${esc(v.data_fi)}"></div>
        <div class="camp"><label>${L("Referència", "Referencia")} <span class="opc">(${L("opcional", "opcional")})</span></label><input name="referencia" value="${esc(v.referencia)}"></div>
        <div class="camp"><label>${L("Estat", "Estado")}</label><select name="estat">${Object.entries(AN.ESTAT).map(([k, x]) => `<option value="${k}"${k === v.estat ? " selected" : ""}>${lbl(x)}</option>`).join("")}</select></div>
      </div>
      <div class="camp"><label>${L("Presentació del viatge", "Presentación del viaje")} <span class="opc">(${L("el client la veu al resum", "el cliente la ve en el resumen")})</span></label><textarea name="descripcio">${esc(v.descripcio)}</textarea></div>
      <div class="camp"><label>${L("Foto de portada", "Foto de portada")}</label>
        ${v.portada && urls[v.portada] ? `<img class="img-prev" src="${urls[v.portada]}" alt="">` : ""}
        <input type="file" accept="image/*" id="dPortada">
        ${v.portada ? `<button type="button" class="mini perill" id="dTreuPortada" style="margin-top:6px">${L("Treu la portada", "Quitar la portada")}</button>` : ""}
      </div>
      <div class="camp"><label>${L("Preu total del viatge (€)", "Precio total del viaje (€)")} <span class="opc">(${L("per calcular el que queda pendent", "para calcular lo que queda pendiente")})</span></label><input name="import_total" type="number" step="0.01" min="0" value="${v.import_total ?? ""}"></div>
      <label class="check camp"><input type="checkbox" name="mostrar_pagaments"${v.mostrar_pagaments ? " checked" : ""}> ${L("Mostrar els pagaments als titulars", "Mostrar los pagos a los titulares")}</label>
      <div class="avis" style="margin-bottom:14px">
        <label class="check"><input type="checkbox" name="publicat"${v.publicat ? " checked" : ""}> <span><b>${L("Publicar el viatge", "Publicar el viaje")}</b><br><span class="meta">${L("Quan està marcat, els viatgers assignats el veuen a la seva app.", "Cuando está marcado, los viajeros asignados lo ven en su app.")}</span></span></label>
      </div>
      <div class="fila entre"><button class="boto" type="submit">${L("Desa els canvis", "Guardar los cambios")}</button>
        <button class="boto perill petit" type="button" id="bEsborraV">${L("Esborra el viatge", "Borrar el viaje")}</button></div>
    </form>`;
  const f = $("fDades");
  f.onsubmit = async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const reg = {
      titol: d.titol.trim(), desti: d.desti || null, pais: d.pais || null, data_inici: d.data_inici || null, data_fi: d.data_fi || null,
      referencia: d.referencia || null, estat: d.estat, descripcio: d.descripcio || null,
      import_total: d.import_total === "" ? null : Number(d.import_total),
      mostrar_pagaments: f.mostrar_pagaments.checked, publicat: f.publicat.checked
    };
    if(reg.data_inici && reg.data_fi && reg.data_fi < reg.data_inici) return avis(L("La tornada no pot ser abans de la sortida.", "La vuelta no puede ser antes de la salida."), true);
    const { error } = await sb.from("an_viatges").update(reg).eq("id", v.id);
    if(error) return avis(errMsg(error), true);
    avis(L("Desat ✓", "Guardado ✓"));
    if(reg.publicat && !v.publicat) avisPublicat(v.id);
    vistaViatge(v.id, "dades");
  };
  $("dPortada").onchange = async e => {
    const fit = e.target.files[0]; if(!fit) return;
    try{
      const blob = await AN.reduirFoto(fit, 1800);
      const ruta = `${v.id}/fotos/portada-${uuid()}.jpg`;
      const { error } = await sb.storage.from(AN.BUCKET).upload(ruta, blob, { contentType: "image/jpeg" });
      if(error) throw error;
      const { error: e2 } = await sb.from("an_viatges").update({ portada: ruta }).eq("id", v.id);
      if(e2) throw e2;
      if(v.portada) await sb.storage.from(AN.BUCKET).remove([v.portada]);
      avis(L("Portada desada ✓", "Portada guardada ✓"));
      vistaViatge(v.id, "dades");
    }catch(err){ avis(errMsg(err), true); }
  };
  if($("dTreuPortada")) $("dTreuPortada").onclick = async () => {
    await sb.from("an_viatges").update({ portada: null }).eq("id", v.id);
    await sb.storage.from(AN.BUCKET).remove([v.portada]);
    vistaViatge(v.id, "dades");
  };
  $("bEsborraV").onclick = async () => {
    if(!confirm(L(`Segur que vols esborrar el viatge «${v.titol}»? S'esborraran també els seus serveis, documents, pagaments, itinerari i recomanacions. No es pot desfer.`,
      `¿Seguro que quieres borrar el viaje «${v.titol}»? Se borrarán también sus servicios, documentos, pagos, itinerario y recomendaciones. No se puede deshacer.`))) return;
    await esborrarCarpeta(v.id);
    const { error } = await sb.from("an_viatges").delete().eq("id", v.id);
    if(error) return avis(errMsg(error), true);
    avis(L("Viatge esborrat", "Viaje borrado"));
    ir("#viatges");
  };
}

async function avisPublicat(viatgeId){
  const { data } = await sb.from("an_viatge_clients").select("an_clients(user_id)").eq("viatge_id", viatgeId);
  const sense = (data || []).filter(x => !x.an_clients?.user_id).length;
  if(!(data || []).length) avis(L("Publicat. Recorda assignar-hi viatgers perquè el puguin veure.", "Publicado. Recuerda asignar viajeros para que lo puedan ver."));
  else if(sense) avis(L(`Publicat. Hi ha ${sense} viatger(s) sense accés a l'app: crea-l'hi des de «Viatgers».`, `Publicado. Hay ${sense} viajero(s) sin acceso a la app: créaselo desde «Viajeros».`));
}

async function esborrarCarpeta(viatgeId){
  for(const sub of ["docs", "fotos"]){
    const { data } = await sb.storage.from(AN.BUCKET).list(`${viatgeId}/${sub}`, { limit: 1000 });
    const rutes = (data || []).filter(x => x.id).map(x => `${viatgeId}/${sub}/${x.name}`);
    if(rutes.length) await sb.storage.from(AN.BUCKET).remove(rutes);
  }
}

// ---- Viatgers ----
async function subViatgers(cont, v){
  const [{ data: assignats, error }] = await Promise.all([
    sb.from("an_viatge_clients").select("client_id, titular, an_clients(*)").eq("viatge_id", v.id),
    carregarClients()
  ]);
  if(error){ cont.innerHTML = `<div class="error">${esc(errMsg(error))}</div>`; return; }
  const ids = new Set((assignats || []).map(x => x.client_id));
  const lliures = A.clients.filter(c => !ids.has(c.id));
  const llista = (assignats || []).sort((a, b) => b.titular - a.titular || nomComplet(a.an_clients).localeCompare(nomComplet(b.an_clients)));
  cont.innerHTML = `
    <div class="targeta">
      <h2>${L("Viatgers del viatge", "Viajeros del viaje")}</h2>
      ${llista.length ? llista.map(x => `
        <div class="doc">
          <div class="n"><b>${esc(nomComplet(x.an_clients))}</b>
            <span class="meta">${esc(x.an_clients.email || L("sense correu", "sin correo"))}</span>
            ${x.an_clients.user_id ? `<span class="xip verd">${L("Té accés a l'app", "Tiene acceso a la app")}</span>` : `<span class="xip coral">${L("Sense accés", "Sin acceso")}</span>`}</div>
          <label class="check" style="white-space:nowrap"><input type="checkbox" name="titular" value="${x.client_id}"${x.titular ? " checked" : ""}> ${L("Titular", "Titular")}</label>
          <button class="mini" type="button" data-fitxa="${x.client_id}">${L("Fitxa", "Ficha")}</button>
          <button class="mini perill" type="button" data-treu="${x.client_id}" title="${L("Treure del viatge", "Quitar del viaje")}">✕</button>
        </div>`).join("") : `<p class="meta">${L("Encara no hi ha cap viatger en aquest viatge.", "Todavía no hay ningún viajero en este viaje.")}</p>`}
      <p class="ajuda">${L("Hi pots marcar més d'un <b>titular</b>. Els titulars són els que veuen els pagaments; tots els viatgers veuen la resta del viatge.",
        "Puedes marcar más de un <b>titular</b>. Los titulares son los que ven los pagos; todos los viajeros ven el resto del viaje.")}</p>
    </div>
    <div class="targeta">
      <h2>${L("Afegir un viatger", "Añadir un viajero")}</h2>
      ${lliures.length ? `<div class="fila"><select id="selClient" style="flex:1;min-width:200px"><option value="">— ${L("Tria un client", "Elige un cliente")} —</option>
        ${lliures.map(c => `<option value="${c.id}">${esc(nomComplet(c))}${c.email ? " · " + esc(c.email) : ""}</option>`).join("")}</select>
        <button class="boto petit" type="button" id="bAfegeix">${L("Afegeix", "Añadir")}</button></div>` : `<p class="meta">${L("Tots els clients ja hi són.", "Todos los clientes ya están.")}</p>`}
      <p style="margin:12px 0 0"><button class="boto sec petit" type="button" id="bNouClientV">+ ${L("Crear un client nou i afegir-lo", "Crear un cliente nuevo y añadirlo")}</button></p>
    </div>`;
  cont.querySelectorAll("input[name=titular]").forEach(r => r.onchange = async () => {
    const { error } = await sb.from("an_viatge_clients").update({ titular: r.checked }).eq("viatge_id", v.id).eq("client_id", r.value);
    if(error){ r.checked = !r.checked; return avis(errMsg(error), true); }
    avis(r.checked ? L("Marcat com a titular ✓", "Marcado como titular ✓") : L("Ja no és titular", "Ya no es titular"));
  });
  cont.querySelectorAll("[data-fitxa]").forEach(b => b.onclick = () => ir("#client/" + b.dataset.fitxa));
  cont.querySelectorAll("[data-treu]").forEach(b => b.onclick = async () => {
    if(!confirm(L("Treure aquest viatger del viatge? El client no s'esborra.", "¿Quitar este viajero del viaje? El cliente no se borra."))) return;
    await sb.from("an_viatge_clients").delete().eq("viatge_id", v.id).eq("client_id", b.dataset.treu);
    subViatgers(cont, v);
  });
  const afegir = async clientId => {
    const titular = !llista.some(x => x.titular);
    const { error } = await sb.from("an_viatge_clients").insert({ viatge_id: v.id, client_id: clientId, titular });
    if(error) return avis(errMsg(error), true);
    subViatgers(cont, v);
  };
  if($("bAfegeix")) $("bAfegeix").onclick = () => { const id = $("selClient").value; if(id) afegir(id); };
  $("bNouClientV").onclick = () => formulariClient(null, async nou => { await afegir(nou.id); ir("#client/" + nou.id); });
}

// ---- Serveis ----
function subServeis(cont, v){
  seccio(cont, {
    titol: L("Serveis contractats", "Servicios contratados"), taula: "an_serveis", pare: { viatge_id: v.id }, viatge: v,
    ordenar: [["data_inici", true], ["hora_inici", true], ["created_at", true]],
    nouText: "+ " + L("Afegeix un servei", "Añadir un servicio"),
    buit: L("Afegeix-hi vols, hotels, trasllats, assegurança… El client ho veurà amb les dates i els localitzadors.",
      "Añade vuelos, hoteles, traslados, seguro… El cliente lo verá con las fechas y los localizadores."),
    camps: [
      { k: "tipus", l: L("Tipus", "Tipo"), t: "select", op: AN.TIPUS_SERVEI, def: "vol" },
      { k: "titol", l: L("Nom del servei", "Nombre del servicio") + " *", req: true, ph: L("Ex.: Vol Barcelona → Tòquio", "Ej.: Vuelo Barcelona → Tokio") },
      { k: "proveidor", l: L("Proveïdor / companyia", "Proveedor / compañía"), ph: L("Ex.: Qatar Airways", "Ej.: Qatar Airways") },
      { k: "localitzador", l: L("Localitzador", "Localizador") },
      { k: "data_inici", l: L("Data d'inici", "Fecha de inicio"), t: "date" }, { k: "hora_inici", l: L("Hora d'inici", "Hora de inicio"), t: "time" },
      { k: "data_fi", l: L("Data de fi", "Fecha de fin"), t: "date" }, { k: "hora_fi", l: L("Hora de fi", "Hora de fin"), t: "time" },
      { k: "descripcio", l: L("Detalls per al client", "Detalles para el cliente"), t: "textarea", ample: true,
        ph: L("Ex.: Facturació 3 h abans. Equipatge: 1 maleta de 23 kg.", "Ej.: Facturación 3 h antes. Equipaje: 1 maleta de 23 kg.") }
    ],
    resum: s => `${AN.TIPUS_SERVEI[s.tipus]?.ico || ""} ${s.titol || L("(sense nom)", "(sin nombre)")}`,
    sub: s => [s.data_inici ? dataCurta(s.data_inici) + (s.hora_inici ? " " + s.hora_inici : "") : "", s.localitzador].filter(Boolean).join(" · ")
  });
}

// ---- Pagaments ----
async function subPagaments(cont, v){
  const { data: pags } = await sb.from("an_pagaments").select("import, data_pagament").eq("viatge_id", v.id);
  const pagat = (pags || []).filter(p => p.data_pagament).reduce((a, p) => a + Number(p.import || 0), 0);
  const total = v.import_total == null ? null : Number(v.import_total);
  cont.innerHTML = `
    <div class="targeta">
      <div class="kv">
        <div><dt>${L("Preu total", "Precio total")}</dt><dd>${total == null ? `<span class="meta">${L("Posa'l a «Dades»", "Ponlo en «Datos»")}</span>` : euros(total, LANG)}</dd></div>
        <div><dt>${L("Pagat", "Pagado")}</dt><dd>${euros(pagat, LANG)}</dd></div>
        <div><dt>${L("Pendent", "Pendiente")}</dt><dd>${total == null ? "—" : euros(Math.max(0, total - pagat), LANG)}</dd></div>
        <div><dt>${L("El client ho veu?", "¿Lo ve el cliente?")}</dt><dd>${v.mostrar_pagaments ? L("Sí, només els titulars", "Sí, solo los titulares") : "No"}</dd></div>
      </div>
    </div>
    <div id="llistaPag"></div>`;
  seccio($("llistaPag"), {
    titol: L("Pagaments i venciments", "Pagos y vencimientos"), taula: "an_pagaments", pare: { viatge_id: v.id }, viatge: v,
    ordenar: [["data_venciment", true], ["created_at", true]],
    nouText: "+ " + L("Afegeix un pagament", "Añadir un pago"),
    buit: L("Afegeix-hi la paga i senyal, els terminis… Deixa la data de pagament buida mentre estigui pendent.",
      "Añade la paga y señal, los plazos… Deja la fecha de pago vacía mientras esté pendiente."),
    camps: [
      { k: "concepte", l: L("Concepte", "Concepto") + " *", req: true, ph: L("Ex.: Paga i senyal", "Ej.: Paga y señal") },
      { k: "import", l: L("Import (€)", "Importe (€)") + " *", t: "num", req: true },
      { k: "data_venciment", l: L("Data límit", "Fecha límite"), t: "date" },
      { k: "data_pagament", l: L("Data en què s'ha pagat", "Fecha en que se ha pagado"), t: "date", ajuda: L("Buida = pendent de pagar", "Vacía = pendiente de pagar") }
    ],
    resum: p => `${p.data_pagament ? "✅" : "⏳"} ${p.concepte || L("(sense concepte)", "(sin concepto)")}`,
    sub: p => `${euros(p.import, LANG)}${p.data_pagament ? " · " + L("pagat el ", "pagado el ") + dataCurta(p.data_pagament) : p.data_venciment ? " · " + L("venç el ", "vence el ") + dataCurta(p.data_venciment) : ""}`,
    desat: () => subPagaments(cont, v)
  });
}

// ---- Itinerari ----
async function subItinerari(cont, v){
  cont.innerHTML = `<div id="itDies"></div>`;
  const { count } = await sb.from("an_dies").select("id", { count: "exact", head: true }).eq("viatge_id", v.id);
  if(!count && v.data_inici && v.data_fi){
    const n = AN.diesEntre(v.data_inici, v.data_fi) + 1;
    if(n > 0 && n <= 60){
      const p = document.createElement("div");
      p.className = "targeta";
      p.innerHTML = `<p style="margin-top:0">${L(`Vols que et prepari els <b>${n} dies</b> del viatge amb les dates posades? Després només hauràs d'omplir cada dia.`,
        `¿Quieres que te prepare los <b>${n} días</b> del viaje con las fechas puestas? Después solo tendrás que rellenar cada día.`)}</p>
        <button class="boto petit" type="button">${L(`Crea els ${n} dies`, `Crear los ${n} días`)}</button>`;
      cont.prepend(p);
      p.querySelector("button").onclick = async () => {
        const files = Array.from({ length: n }, (_, i) => {
          const d = new Date(v.data_inici + "T12:00:00"); d.setDate(d.getDate() + i);
          const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
          return { viatge_id: v.id, data: iso, titol: L(`Dia ${i + 1}`, `Día ${i + 1}`), ordre: i + 1 };
        });
        const { error } = await sb.from("an_dies").insert(files);
        if(error) return avis(errMsg(error), true);
        subItinerari(cont, v);
      };
    }
  }
  seccio($("itDies"), {
    titol: L("Itinerari dia a dia", "Itinerario día a día"), taula: "an_dies", pare: { viatge_id: v.id }, viatge: v, ambOrdre: true,
    nouText: "+ " + L("Afegeix un dia", "Añadir un día"),
    buit: L("Afegeix els dies del viatge. A cada dia hi pots posar una foto i les activitats amb hora.",
      "Añade los días del viaje. En cada día puedes poner una foto y las actividades con hora."),
    camps: [
      { k: "data", l: L("Data", "Fecha"), t: "date" },
      { k: "titol", l: L("Títol del dia", "Título del día") + " *", req: true, ph: L("Ex.: Arribada a Tòquio", "Ej.: Llegada a Tokio") },
      { k: "descripcio", l: L("Descripció", "Descripción"), t: "textarea", ample: true },
      { k: "foto", l: L("Foto del dia", "Foto del día"), t: "foto", ample: true }
    ],
    resum: d => d.titol || L("(sense títol)", "(sin título)"),
    sub: d => d.data ? AN.dataLlarga(d.data, LANG) : "",
    dins: (d, el) => {
      const s = document.createElement("div");
      s.className = "subllista";
      el.appendChild(s);
      seccio(s, {
        titol: L("Activitats del dia", "Actividades del día"), petit: true, taula: "an_activitats", pare: { dia_id: d.id }, viatge: v, ambOrdre: true,
        nouText: "+ " + L("Afegeix una activitat", "Añadir una actividad"), buit: L("Sense activitats.", "Sin actividades."),
        camps: [
          { k: "hora", l: L("Hora", "Hora"), t: "time" },
          { k: "nom", l: L("Activitat", "Actividad") + " *", req: true, ph: L("Ex.: Visita guiada al temple Senso-ji", "Ej.: Visita guiada al templo Senso-ji") },
          { k: "lloc", l: L("Lloc / punt de trobada", "Lugar / punto de encuentro") },
          { k: "descripcio", l: L("Detalls", "Detalles"), t: "textarea", ample: true }
        ],
        resum: a => `${a.hora ? a.hora + " · " : ""}${a.nom || L("(sense nom)", "(sin nombre)")}`
      });
    }
  });
}

// ---- Destí ----
function subDesti(cont, v){
  seccio(cont, {
    titol: L("Destí i recomanacions", "Destino y recomendaciones"), taula: "an_desti", pare: { viatge_id: v.id }, viatge: v, ambOrdre: true,
    nouText: "+ " + L("Afegeix una recomanació", "Añadir una recomendación"),
    buit: L("Afegeix-hi informació pràctica del destí, consells, llocs per visitar, restaurants…",
      "Añade información práctica del destino, consejos, lugares para visitar, restaurantes…"),
    camps: [
      { k: "categoria", l: L("Tipus", "Tipo"), t: "select", op: AN.CATEGORIA_DESTI, def: "consell" },
      { k: "titol", l: L("Títol", "Título") + " *", req: true, ph: L("Ex.: Moneda i propines", "Ej.: Moneda y propinas") },
      { k: "descripcio", l: L("Text", "Texto"), t: "textarea", ample: true },
      { k: "adreca", l: L("Adreça", "Dirección"), ajuda: L("El client la podrà obrir a Google Maps", "El cliente la podrá abrir en Google Maps") },
      { k: "enllac", l: L("Enllaç web", "Enlace web"), t: "url", ph: "https://…" },
      { k: "foto", l: L("Foto", "Foto"), t: "foto", ample: true }
    ],
    resum: r => `${AN.CATEGORIA_DESTI[r.categoria]?.ico || ""} ${r.titol || L("(sense títol)", "(sin título)")}`,
    sub: r => lbl(AN.CATEGORIA_DESTI[r.categoria])
  });
}

// ---- Documents ----
async function subDocuments(cont, v){
  const { data: docs, error } = await sb.from("an_documents").select("*").eq("viatge_id", v.id).order("created_at");
  if(error){ cont.innerHTML = `<div class="error">${esc(errMsg(error))}</div>`; return; }
  cont.innerHTML = `
    <div class="targeta">
      <h2>${L("Pujar documents", "Subir documentos")}</h2>
      <div class="graella">
        <div class="camp"><label>${L("Tipus", "Tipo")}</label><select id="docCat">${opcions(AN.CATEGORIA_DOC, "bitllet")}</select></div>
        <div class="camp"><label>${L("Fitxers", "Archivos")}</label><input type="file" id="docFit" multiple></div>
      </div>
      <p class="ajuda">${L("Pots triar-ne diversos alhora (PDF, fotos…). Màxim 25 MB per fitxer. No hi pugis passaports ni DNI.",
        "Puedes elegir varios a la vez (PDF, fotos…). Máximo 25 MB por archivo. No subas pasaportes ni DNI.")}</p>
      <button class="boto petit" type="button" id="bPuja">${L("Puja", "Subir")}</button> <span class="meta" id="docEstat"></span>
    </div>
    <div class="targeta">
      <h2>${L("Documents del viatge", "Documentos del viaje")}</h2>
      ${(docs || []).length ? docs.map(d => `
        <div class="doc">
          <span style="font-size:22px">${AN.CATEGORIA_DOC[d.categoria]?.ico || "📎"}</span>
          <div class="n"><b>${esc(d.nom)}</b><span class="meta">${lbl(AN.CATEGORIA_DOC[d.categoria])} · ${AN.mida(d.mida)}</span></div>
          <label class="check" style="white-space:nowrap"><input type="checkbox" data-vis="${d.id}"${d.visible ? " checked" : ""}> ${L("Visible", "Visible")}</label>
          <button class="mini" type="button" data-obre="${esc(d.path)}">${L("Obre", "Abrir")}</button>
          <button class="mini" type="button" data-nom="${d.id}">✎</button>
          <button class="mini perill" type="button" data-esb="${d.id}">✕</button>
        </div>`).join("") : `<p class="meta">${L("Encara no hi ha documents.", "Todavía no hay documentos.")}</p>`}
      <p class="ajuda">${L("Si treus «Visible», el document queda guardat però el client no el veu.", "Si quitas «Visible», el documento queda guardado pero el cliente no lo ve.")}</p>
    </div>`;
  $("bPuja").onclick = async () => {
    const fits = [...$("docFit").files];
    if(!fits.length) return avis(L("Tria algun fitxer.", "Elige algún archivo."), true);
    const cat = $("docCat").value;
    $("bPuja").disabled = true;
    let ok = 0;
    for(const f of fits){
      $("docEstat").textContent = L(`Pujant ${ok + 1} de ${fits.length}…`, `Subiendo ${ok + 1} de ${fits.length}…`);
      if(f.size > 25 * 1024 * 1024){ avis(L(`«${f.name}» fa més de 25 MB.`, `«${f.name}» ocupa más de 25 MB.`), true); continue; }
      const ruta = `${v.id}/docs/${uuid()}-${AN.nomFitxerSegur(f.name)}`;
      const { error } = await sb.storage.from(AN.BUCKET).upload(ruta, f, { contentType: f.type || "application/octet-stream" });
      if(error){ avis(errMsg(error), true); continue; }
      const nom = f.name.replace(/\.[^.]+$/, "");
      const { error: e2 } = await sb.from("an_documents").insert({ viatge_id: v.id, nom, categoria: cat, path: ruta, mida: f.size });
      if(e2){ await sb.storage.from(AN.BUCKET).remove([ruta]); avis(errMsg(e2), true); continue; }
      ok++;
    }
    avis(L(`${ok} document(s) pujat(s) ✓`, `${ok} documento(s) subido(s) ✓`));
    subDocuments(cont, v);
  };
  cont.querySelectorAll("[data-vis]").forEach(c => c.onchange = async () => {
    const { error } = await sb.from("an_documents").update({ visible: c.checked }).eq("id", c.dataset.vis);
    if(error) avis(errMsg(error), true);
  });
  cont.querySelectorAll("[data-obre]").forEach(b => b.onclick = async () => {
    const w = window.open("", "_blank");
    const { data, error } = await sb.storage.from(AN.BUCKET).createSignedUrl(b.dataset.obre, 300);
    if(error || !data){ w && w.close(); return avis(L("No s'ha pogut obrir.", "No se ha podido abrir."), true); }
    if(w) w.location = data.signedUrl; else location.href = data.signedUrl;
  });
  cont.querySelectorAll("[data-nom]").forEach(b => b.onclick = () => {
    const d = docs.find(x => x.id === b.dataset.nom);
    modal(`<h2>${L("Canviar el document", "Cambiar el documento")}</h2>
      <div class="camp"><label>${L("Nom que veu el client", "Nombre que ve el cliente")}</label><input id="mNom" value="${esc(d.nom)}"></div>
      <div class="camp"><label>${L("Tipus", "Tipo")}</label><select id="mCat">${opcions(AN.CATEGORIA_DOC, d.categoria)}</select></div>
      <div class="fila"><button class="boto" type="button" id="mDesa">${L("Desa", "Guardar")}</button><button class="boto sec" type="button" data-tanca>${L("Cancel·la", "Cancelar")}</button></div>`, m => {
      m.querySelector("#mDesa").onclick = async () => {
        const nom = m.querySelector("#mNom").value.trim();
        if(!nom) return;
        const { error } = await sb.from("an_documents").update({ nom, categoria: m.querySelector("#mCat").value }).eq("id", d.id);
        if(error) return avis(errMsg(error), true);
        tancarModal(); subDocuments(cont, v);
      };
    });
  });
  cont.querySelectorAll("[data-esb]").forEach(b => b.onclick = async () => {
    const d = docs.find(x => x.id === b.dataset.esb);
    if(!confirm(L(`Esborrar «${d.nom}»?`, `¿Borrar «${d.nom}»?`))) return;
    const { error } = await sb.from("an_documents").delete().eq("id", d.id);
    if(error) return avis(errMsg(error), true);
    await sb.storage.from(AN.BUCKET).remove([d.path]);
    subDocuments(cont, v);
  });
}

// =====================================================================
// Llista editable genèrica (serveis, pagaments, dies, activitats, destí)
// =====================================================================
async function seccio(cont, cfg){
  let q = sb.from(cfg.taula).select("*");
  Object.entries(cfg.pare).forEach(([k, val]) => { q = q.eq(k, val); });
  const ordre = cfg.ambOrdre ? [["ordre", true]] : (cfg.ordenar || [["created_at", true]]);
  ordre.forEach(([k, asc]) => { q = q.order(k, { ascending: asc, nullsFirst: false }); });
  const { data, error } = await q;
  if(error){ cont.innerHTML = `<div class="error">${esc(errMsg(error))}</div>`; return; }
  const files = data || [];
  const urls = await AN.urlsSignades(sb, files.flatMap(r => cfg.camps.filter(c => c.t === "foto").map(c => r[c.k])));
  const H = cfg.petit ? "h3" : "h2";
  cont.innerHTML = `
    <div class="${cfg.petit ? "" : "targeta"}">
      <${H}>${esc(cfg.titol)}</${H}>
      <div class="llista"></div>
      ${files.length ? "" : `<p class="meta">${esc(cfg.buit || "")}</p>`}
      <button class="boto ${cfg.petit ? "sec" : ""} petit" type="button" data-nou>${esc(cfg.nouText || "+")}</button>
    </div>`;
  const llista = cont.querySelector(".llista");
  const bNou = cont.querySelector("[data-nou]");
  const recarrega = () => { if(cfg.desat) cfg.desat(); else seccio(cont, cfg); };

  const pinta = (r, obert) => {
    const el = document.createElement("details");
    el.className = "el";
    if(obert) el.open = true;
    const i = files.indexOf(r);
    el.innerHTML = `
      <summary><span class="n">${esc(r.id ? cfg.resum(r) : L("Nou", "Nuevo"))}</span>
        ${r.id && cfg.sub ? `<span class="meta">${esc(cfg.sub(r))}</span>` : ""}</summary>
      <div class="el-cos">
        <form>
          <div class="graella">${cfg.camps.map(c => camp(c, r, urls)).join("")}</div>
          <div class="fila entre" style="margin-top:4px">
            <span class="fila"><button class="boto petit" type="submit">${L("Desa", "Guardar")}</button>
              ${r.id ? "" : `<button class="boto sec petit" type="button" data-cancela>${L("Cancel·la", "Cancelar")}</button>`}</span>
            <span class="fila">
              ${r.id && cfg.ambOrdre ? `<button class="mini" type="button" data-amunt ${i <= 0 ? "disabled" : ""}>↑</button><button class="mini" type="button" data-avall ${i >= files.length - 1 ? "disabled" : ""}>↓</button>` : ""}
              ${r.id ? `<button class="mini perill" type="button" data-esb>${L("Esborra", "Borrar")}</button>` : ""}</span>
          </div>
        </form>
      </div>`;
    const form = el.querySelector("form");
    // fotos: es pugen de seguida i es desen amb el formulari
    form.querySelectorAll("input[data-foto]").forEach(inp => inp.onchange = async () => {
      const f = inp.files[0]; if(!f) return;
      const hidden = form.querySelector(`input[name="${inp.dataset.foto}"]`);
      inp.disabled = true;
      try{
        const blob = await AN.reduirFoto(f);
        const ruta = `${cfg.viatge.id}/fotos/${uuid()}.jpg`;
        const { error } = await sb.storage.from(AN.BUCKET).upload(ruta, blob, { contentType: "image/jpeg" });
        if(error) throw error;
        hidden.value = ruta;
        const prev = form.querySelector(`img[data-prev="${inp.dataset.foto}"]`);
        prev.src = URL.createObjectURL(blob); prev.classList.remove("amagat");
        avis(L("Foto pujada. Recorda clicar «Desa».", "Foto subida. Recuerda pulsar «Guardar»."));
      }catch(e){ avis(errMsg(e), true); }
      inp.disabled = false;
    });
    form.querySelectorAll("[data-treufoto]").forEach(b => b.onclick = () => {
      form.querySelector(`input[name="${b.dataset.treufoto}"]`).value = "";
      form.querySelector(`img[data-prev="${b.dataset.treufoto}"]`).classList.add("amagat");
    });
    form.onsubmit = async e => {
      e.preventDefault();
      const reg = {};
      cfg.camps.forEach(c => {
        const inp = form.elements[c.k];
        let val = c.t === "check" ? inp.checked : inp.value.trim();
        if(c.t === "num") val = val === "" ? null : Number(val);
        if(val === "") val = null;
        reg[c.k] = val;
      });
      for(const c of cfg.camps) if(c.req && (reg[c.k] == null)) return avis(L(`Falta «${c.l.replace(" *", "")}».`, `Falta «${c.l.replace(" *", "")}».`), true);
      if(reg.enllac && !/^https?:\/\//i.test(reg.enllac)) reg.enllac = "https://" + reg.enllac;
      let error;
      if(r.id){
        ({ error } = await sb.from(cfg.taula).update(reg).eq("id", r.id));
      }else{
        Object.assign(reg, cfg.pare);
        if(cfg.ambOrdre) reg.ordre = (files.reduce((m, x) => Math.max(m, x.ordre || 0), 0)) + 1;
        ({ error } = await sb.from(cfg.taula).insert(reg));
      }
      if(error) return avis(errMsg(error), true);
      // fotos substituïdes: s'esborren les velles
      const velles = cfg.camps.filter(c => c.t === "foto" && r[c.k] && r[c.k] !== reg[c.k]).map(c => r[c.k]);
      if(velles.length) await sb.storage.from(AN.BUCKET).remove(velles);
      avis(L("Desat ✓", "Guardado ✓"));
      recarrega();
    };
    const canc = form.querySelector("[data-cancela]");
    if(canc) canc.onclick = () => { el.remove(); bNou.disabled = false; };
    const esb = form.querySelector("[data-esb]");
    if(esb) esb.onclick = async () => {
      if(!confirm(L("Segur que ho vols esborrar?", "¿Seguro que lo quieres borrar?"))) return;
      const fotos = cfg.camps.filter(c => c.t === "foto" && r[c.k]).map(c => r[c.k]);
      const { error } = await sb.from(cfg.taula).delete().eq("id", r.id);
      if(error) return avis(errMsg(error), true);
      if(fotos.length) await sb.storage.from(AN.BUCKET).remove(fotos);
      recarrega();
    };
    const mou = async dir => {
      const altre = files[i + dir]; if(!altre) return;
      await sb.from(cfg.taula).update({ ordre: altre.ordre }).eq("id", r.id);
      await sb.from(cfg.taula).update({ ordre: r.ordre === altre.ordre ? r.ordre + dir : r.ordre }).eq("id", altre.id);
      recarrega();
    };
    const am = form.querySelector("[data-amunt]"); if(am) am.onclick = () => mou(-1);
    const av = form.querySelector("[data-avall]"); if(av) av.onclick = () => mou(1);
    if(r.id && cfg.dins) cfg.dins(r, el.querySelector(".el-cos"));
    return el;
  };

  files.forEach(r => llista.appendChild(pinta(r, false)));
  bNou.onclick = e => {
    const nou = {};
    cfg.camps.forEach(c => { if(c.def) nou[c.k] = c.def; });
    llista.appendChild(pinta(nou, true));
    e.target.disabled = true;
    llista.lastChild.querySelector("input,select,textarea")?.focus();
  };
}

function camp(c, r, urls){
  const v = r[c.k];
  const ample = c.ample || c.t === "textarea" ? " ample" : "";
  const ajuda = c.ajuda ? `<div class="ajuda">${esc(c.ajuda)}</div>` : "";
  const ph = c.ph ? ` placeholder="${esc(c.ph)}"` : "";
  let inp;
  switch(c.t){
    case "textarea": inp = `<textarea name="${c.k}"${ph}>${esc(v)}</textarea>`; break;
    case "select": inp = `<select name="${c.k}">${opcions(c.op, v || c.def)}</select>`; break;
    case "date": inp = `<input name="${c.k}" type="date" value="${esc(v)}">`; break;
    case "time": inp = `<input name="${c.k}" type="time" value="${esc(v)}">`; break;
    case "num": inp = `<input name="${c.k}" type="number" step="0.01" value="${v ?? ""}">`; break;
    case "url": inp = `<input name="${c.k}" type="url" value="${esc(v)}"${ph}>`; break;
    case "foto":
      inp = `<input type="hidden" name="${c.k}" value="${esc(v)}">
        <img class="img-prev ${v && urls[v] ? "" : "amagat"}" data-prev="${c.k}" src="${v && urls[v] ? urls[v] : ""}" alt="">
        <div class="fila"><input type="file" accept="image/*" data-foto="${c.k}" style="flex:1">
        <button class="mini" type="button" data-treufoto="${c.k}">${L("Treu la foto", "Quitar la foto")}</button></div>`;
      break;
    default: inp = `<input name="${c.k}" value="${esc(v)}"${ph}>`;
  }
  return `<div class="camp${ample}"><label>${esc(c.l)}</label>${inp}${ajuda}</div>`;
}

// =====================================================================
// CLIENTS
// =====================================================================
async function vistaClients(){
  pantalla.innerHTML = `<p class="meta">${L("Carregant…", "Cargando…")}</p>`;
  try{ await carregarClients(); }catch(e){ pantalla.innerHTML = `<div class="error">${esc(errMsg(e))}</div>`; return; }
  pantalla.innerHTML = `
    <div class="fila entre" style="margin-bottom:14px"><h2 style="margin:0">${L("Clients", "Clientes")}</h2>
      <button class="boto petit" type="button" id="bNouClient">+ ${L("Nou client", "Nuevo cliente")}</button></div>
    <input id="cerca" type="search" placeholder="${L("Cerca per nom, correu o telèfon", "Buscar por nombre, correo o teléfono")}" style="margin-bottom:12px">
    <div id="llistaC"></div>`;
  const pinta = () => {
    const q = $("cerca").value.trim().toLowerCase();
    const fil = A.clients.filter(c => !q || [c.nom, c.cognoms, c.email, c.telefon].join(" ").toLowerCase().includes(q));
    $("llistaC").innerHTML = fil.length ? fil.map(c => `
      <button type="button" class="llista-it" data-id="${c.id}">
        <div class="fila entre"><span class="titol">${esc(nomComplet(c))}</span>
          ${c.user_id ? `<span class="xip verd">${L("Té accés", "Tiene acceso")}</span>` : `<span class="xip">${L("Sense accés", "Sin acceso")}</span>`}</div>
        <div class="meta">${esc([c.email, c.telefon].filter(Boolean).join(" · "))}</div>
      </button>`).join("") : `<div class="buit">${A.clients.length ? L("Cap client coincideix amb la cerca.", "Ningún cliente coincide con la búsqueda.") : L("Encara no hi ha clients.", "Todavía no hay clientes.")}</div>`;
    $("llistaC").querySelectorAll(".llista-it").forEach(b => b.onclick = () => ir("#client/" + b.dataset.id));
  };
  $("cerca").oninput = pinta;
  $("bNouClient").onclick = () => formulariClient(null, nou => ir("#client/" + nou.id));
  pinta();
}

function formulariClient(c, enDesar){
  const x = c || { idioma: LANG };
  modal(`<h2>${c ? L("Dades del client", "Datos del cliente") : L("Nou client", "Nuevo cliente")}</h2>
    <form id="fClient">
      <div class="graella">
        <div class="camp"><label>${L("Nom", "Nombre")} *</label><input name="nom" required value="${esc(x.nom)}"></div>
        <div class="camp"><label>${L("Cognoms", "Apellidos")}</label><input name="cognoms" value="${esc(x.cognoms)}"></div>
        <div class="camp"><label>${L("Correu", "Correo")}</label><input name="email" type="email" value="${esc(x.email)}"><div class="ajuda">${L("Serà el seu usuari per entrar a l'app", "Será su usuario para entrar en la app")}</div></div>
        <div class="camp"><label>${L("Telèfon (WhatsApp)", "Teléfono (WhatsApp)")}</label><input name="telefon" type="tel" value="${esc(x.telefon)}" placeholder="+34 600 000 000"></div>
        <div class="camp"><label>${L("Idioma de l'app", "Idioma de la app")}</label><select name="idioma"><option value="ca"${x.idioma === "ca" ? " selected" : ""}>Català</option><option value="es"${x.idioma === "es" ? " selected" : ""}>Castellano</option></select></div>
      </div>
      <div class="camp"><label>${L("Notes internes", "Notas internas")} <span class="opc">(${L("el client no les veu", "el cliente no las ve")})</span></label><textarea name="notes">${esc(x.notes)}</textarea></div>
      <div class="fila"><button class="boto" type="submit">${L("Desa", "Guardar")}</button><button class="boto sec" type="button" data-tanca>${L("Cancel·la", "Cancelar")}</button></div>
    </form>`, m => {
    m.querySelector("#fClient").onsubmit = async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const reg = { nom: d.nom.trim(), cognoms: d.cognoms.trim() || null, email: d.email.trim().toLowerCase() || null,
                    telefon: d.telefon.trim() || null, idioma: d.idioma, notes: d.notes.trim() || null };
      if(c && c.user_id && !reg.email) return avis(L("Aquest client té accés a l'app: el correu no pot quedar buit.", "Este cliente tiene acceso a la app: el correo no puede quedar vacío."), true);
      if(reg.email){
        const dup = A.clients.find(o => o.id !== c?.id && (o.email || "").toLowerCase() === reg.email);
        if(dup && !confirm(L(`Ja hi ha un client amb aquest correu (${nomComplet(dup)}). Vols continuar igualment?`, `Ya hay un cliente con este correo (${nomComplet(dup)}). ¿Quieres continuar igualmente?`))) return;
      }
      let res;
      if(c) res = await sb.from("an_clients").update(reg).eq("id", c.id).select().single();
      else res = await sb.from("an_clients").insert(reg).select().single();
      if(res.error) return avis(errMsg(res.error), true);
      if(c && c.user_id && reg.email !== (c.email || "").toLowerCase()){
        const r = await compte("email", c.id);
        if(!r.ok){
          await sb.from("an_clients").update({ email: c.email }).eq("id", c.id);
          return avis(r.msg, true);
        }
        avis(L("El nou correu ja és el seu usuari per entrar.", "El nuevo correo ya es su usuario para entrar."));
      }
      tancarModal();
      await carregarClients();
      enDesar && enDesar(res.data);
    };
  });
}

async function vistaClient(id){
  pantalla.innerHTML = `<p class="meta">${L("Carregant…", "Cargando…")}</p>`;
  const [{ data: c, error }, { data: viatges }] = await Promise.all([
    sb.from("an_clients").select("*").eq("id", id).maybeSingle(),
    sb.from("an_viatge_clients").select("titular, an_viatges(id, titol, data_inici, data_fi, publicat)").eq("client_id", id)
  ]);
  if(error || !c){ pantalla.innerHTML = `<div class="error">${L("No s'ha trobat el client.", "No se ha encontrado el cliente.")}</div>`; return; }
  await carregarClients();
  pantalla.innerHTML = `
    <button class="tornar" type="button" onclick="ir('#clients')">← ${L("Tots els clients", "Todos los clientes")}</button>
    <div class="targeta">
      <div class="fila entre"><h2 style="margin:0">${esc(nomComplet(c))}</h2><button class="mini" type="button" id="bEdita">✎ ${L("Edita", "Editar")}</button></div>
      <dl class="kv" style="margin-top:12px">
        <div><dt>${L("Correu", "Correo")}</dt><dd>${esc(c.email || "—")}</dd></div>
        <div><dt>${L("Telèfon", "Teléfono")}</dt><dd>${esc(c.telefon || "—")}</dd></div>
        <div><dt>${L("Idioma", "Idioma")}</dt><dd>${c.idioma === "es" ? "Castellano" : "Català"}</dd></div>
      </dl>
      ${c.notes ? `<p class="meta" style="margin-bottom:0">📝 ${text(c.notes)}</p>` : ""}
    </div>
    <div class="targeta" id="acces"></div>
    <div class="targeta">
      <h2>${L("Viatges", "Viajes")}</h2>
      ${(viatges || []).length ? viatges.map(x => `<button type="button" class="llista-it" data-v="${x.an_viatges.id}">
          <span class="titol">${esc(x.an_viatges.titol)}</span>
          <div class="meta">${x.an_viatges.data_inici ? dataCurta(x.an_viatges.data_inici) : L("Sense dates", "Sin fechas")}${x.titular ? " · Titular" : ""}${x.an_viatges.publicat ? "" : " · " + L("No publicat", "No publicado")}</div>
        </button>`).join("") : `<p class="meta">${L("Aquest client encara no és a cap viatge. Afegeix-l'hi des de la pestanya «Viatgers» del viatge.", "Este cliente todavía no está en ningún viaje. Añádelo desde la pestaña «Viajeros» del viaje.")}</p>`}
    </div>
    <p class="centre"><button class="boto perill petit" type="button" id="bEsborraC">${L("Esborra el client", "Borrar el cliente")}</button></p>`;
  $("bEdita").onclick = () => formulariClient(c, () => vistaClient(c.id));
  pantalla.querySelectorAll("[data-v]").forEach(b => b.onclick = () => ir("#viatge/" + b.dataset.v));
  pintaAcces(c);
  $("bEsborraC").onclick = async () => {
    if(!confirm(L(`Esborrar ${nomComplet(c)}? Es treurà dels seus viatges i perdrà l'accés a l'app. No es pot desfer.`, `¿Borrar a ${nomComplet(c)}? Se quitará de sus viajes y perderá el acceso a la app. No se puede deshacer.`))) return;
    if(c.user_id){ const r = await compte("treure", c.id); if(!r.ok) return avis(r.msg, true); }
    const { error } = await sb.from("an_clients").delete().eq("id", c.id);
    if(error) return avis(errMsg(error), true);
    avis(L("Client esborrat", "Cliente borrado"));
    ir("#clients");
  };
}

function pintaAcces(c){
  const box = $("acces");
  if(!c.user_id){
    box.innerHTML = `
      <h2>${L("Accés a l'app", "Acceso a la app")}</h2>
      ${c.email ? `
        <p class="meta" style="margin-top:0">${L(`Crea-li l'accés: el seu usuari serà <b>${esc(c.email)}</b>. Després li envies les dades per WhatsApp.`, `Créale el acceso: su usuario será <b>${esc(c.email)}</b>. Después le envías los datos por WhatsApp.`)}</p>
        <div class="camp"><label>${L("Contrasenya inicial", "Contraseña inicial")}</label><input id="aPass" value="${contrasenyaNova()}" autocomplete="off"><div class="ajuda">${L("Mínim 8 caràcters. Ell la podrà canviar des de l'app.", "Mínimo 8 caracteres. La podrá cambiar desde la app.")}</div></div>
        <button class="boto" type="button" id="bCrea">${L("Crea l'accés", "Crear el acceso")}</button>`
      : `<p class="avis">${L("Per donar-li accés cal que tingui un correu. Clica «✎ Edita» i posa-l'hi.", "Para darle acceso hace falta que tenga un correo. Pulsa «✎ Editar» y pónselo.")}</p>`}`;
    if($("bCrea")) $("bCrea").onclick = async () => {
      const pass = $("aPass").value.trim();
      if(pass.length < 8) return avis(L("La contrasenya ha de tenir 8 caràcters o més.", "La contraseña debe tener 8 caracteres o más."), true);
      $("bCrea").disabled = true;
      const r = await compte("crear", c.id, pass);
      $("bCrea").disabled = false;
      if(!r.ok) return avis(r.msg, true);
      avis(L("Accés creat ✓", "Acceso creado ✓"));
      c.user_id = "fet";
      pintaAcces(c);
      enviarDades(c, pass);
    };
    return;
  }
  box.innerHTML = `
    <h2>${L("Accés a l'app", "Acceso a la app")}</h2>
    <p style="margin-top:0"><span class="xip verd">${L("Té accés", "Tiene acceso")}</span> ${L("Usuari", "Usuario")}: <b>${esc(c.email)}</b></p>
    <div class="fila">
      <button class="boto sec petit" type="button" id="bNovaPass">${L("Posar una contrasenya nova", "Poner una contraseña nueva")}</button>
      <button class="boto sec petit" type="button" id="bEnviaLink">${L("Enviar l'enllaç de l'app", "Enviar el enlace de la app")}</button>
      <button class="boto perill petit" type="button" id="bTreu">${L("Treure l'accés", "Quitar el acceso")}</button>
    </div>`;
  $("bNovaPass").onclick = () => {
    modal(`<h2>${L("Contrasenya nova", "Contraseña nueva")}</h2>
      <div class="camp"><label>${L("Contrasenya", "Contraseña")}</label><input id="mPass" value="${contrasenyaNova()}" autocomplete="off"></div>
      <div class="fila"><button class="boto" type="button" id="mDesa">${L("Canvia-la", "Cambiarla")}</button><button class="boto sec" type="button" data-tanca>${L("Cancel·la", "Cancelar")}</button></div>`, m => {
      m.querySelector("#mDesa").onclick = async () => {
        const pass = m.querySelector("#mPass").value.trim();
        if(pass.length < 8) return avis(L("Mínim 8 caràcters.", "Mínimo 8 caracteres."), true);
        const r = await compte("contrasenya", c.id, pass);
        if(!r.ok) return avis(r.msg, true);
        tancarModal();
        avis(L("Contrasenya canviada ✓", "Contraseña cambiada ✓"));
        enviarDades(c, pass);
      };
    });
  };
  $("bEnviaLink").onclick = () => enviarDades(c, null);
  $("bTreu").onclick = async () => {
    if(!confirm(L(`${nomComplet(c)} ja no podrà entrar a l'app. Les dades del client i dels viatges es mantenen. Continuar?`, `${nomComplet(c)} ya no podrá entrar en la app. Los datos del cliente y de los viajes se mantienen. ¿Continuar?`))) return;
    const r = await compte("treure", c.id);
    if(!r.ok) return avis(r.msg, true);
    avis(L("Accés tret", "Acceso quitado"));
    vistaClient(c.id);
  };
}

// L'enllaç porta l'agència perquè l'app surti amb la seva marca des del primer moment
function urlApp(){ return new URL("./", location.href).href + (A.agencia?.id ? "?a=" + encodeURIComponent(A.agencia.id) : ""); }

function enviarDades(c, pass){
  const es = c.idioma === "es";
  const ag = A.agencia?.nom || "Anonta";
  const msg = es
    ? `¡Hola ${c.nom}! 👋\nYa tienes tu viaje disponible en la app de ${ag} 📲\n\nEntra en: ${urlApp()}\nUsuario: ${c.email}${pass ? `\nContraseña: ${pass}` : ""}\n\nTe aconsejamos añadirla a la pantalla de inicio del móvil para tenerla siempre a mano.`
    : `Hola ${c.nom}! 👋\nJa tens el teu viatge disponible a l'app de ${ag} 📲\n\nEntra a: ${urlApp()}\nUsuari: ${c.email}${pass ? `\nContrasenya: ${pass}` : ""}\n\nT'aconsellem afegir-la a la pantalla d'inici del mòbil per tenir-la sempre a mà.`;
  const tel = (c.telefon || "").replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "");
  const telWa = tel && tel.length === 9 ? "34" + tel : tel;
  modal(`<h2>${L("Envia-li les dades", "Envíale los datos")}</h2>
    <div class="missatge">${esc(msg)}</div>
    <div class="fila" style="margin-top:14px">
      <a class="boto wa" target="_blank" rel="noopener" href="https://wa.me/${telWa}?text=${encodeURIComponent(msg)}">WhatsApp</a>
      <button class="boto sec" type="button" id="mCopia">${L("Copia el text", "Copiar el texto")}</button>
      <button class="boto sec" type="button" data-tanca>${L("Tanca", "Cerrar")}</button>
    </div>
    ${pass ? `<p class="ajuda">${L("Apunta't la contrasenya ara: per seguretat, després no es torna a mostrar.", "Apúntate la contraseña ahora: por seguridad, después no se vuelve a mostrar.")}</p>` : ""}`, m => {
    m.querySelector("#mCopia").onclick = async () => {
      try{ await navigator.clipboard.writeText(msg); avis(L("Copiat ✓", "Copiado ✓")); }catch{ avis(L("No s'ha pogut copiar.", "No se ha podido copiar."), true); }
    };
  });
}

// Crida a la funció del servidor que gestiona els comptes dels clients
async function compte(accio, client_id, contrasenya){
  const MSG = {
    EMAIL_JA_EXISTEIX: L("Aquest correu ja té un compte (potser és d'una agència o d'un altre client). Fes servir un altre correu.", "Este correo ya tiene una cuenta (quizá es de una agencia o de otro cliente). Usa otro correo."),
    EMAIL_INVALID: L("El correu no és vàlid.", "El correo no es válido."),
    CONTRASENYA_CURTA: L("La contrasenya ha de tenir 8 caràcters o més.", "La contraseña debe tener 8 caracteres o más."),
    JA_TE_ACCES: L("Aquest client ja té accés.", "Este cliente ya tiene acceso."),
    NO_PERMIS: L("No tens permís. Torna a entrar al panell.", "No tienes permiso. Vuelve a entrar en el panel."),
    NO_A_TU_MATEIX: L("No pots treure el teu propi accés.", "No puedes quitar tu propio acceso.")
  };
  try{
    const { data, error } = await sb.functions.invoke("anonta-comptes", { body: { accio, client_id, contrasenya } });
    if(error){
      let codi = "";
      try{ codi = (await error.context.json()).error; }catch{}
      return { ok: false, msg: MSG[codi] || L("No s'ha pogut fer. Torna-ho a provar.", "No se ha podido hacer. Vuelve a intentarlo.") };
    }
    return { ok: !!data?.ok };
  }catch(e){ return { ok: false, msg: errMsg(e) }; }
}

// ---------- finestra modal ----------
function modal(html, enObrir){
  tancarModal();
  const f = document.createElement("div");
  f.className = "modal-fons"; f.id = "modal";
  f.innerHTML = `<div class="modal">${html}</div>`;
  f.addEventListener("click", e => { if(e.target === f || e.target.hasAttribute("data-tanca")) tancarModal(); });
  document.body.appendChild(f);
  enObrir && enObrir(f);
  f.querySelector("input,select,textarea")?.focus();
}
function tancarModal(){ $("modal")?.remove(); }

posarIdioma(LANG);
// s'espera que es carreguin també admin-ia.js i admin-agencies.js
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", inici); else inici();
