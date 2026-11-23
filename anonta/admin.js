// Anonta · Panell de l'agència
const sb = supabase.createClient(RIMU.SUPABASE_URL, RIMU.SUPABASE_KEY);
const $ = id => document.getElementById(id);
const { esc, text, euros, dataCurta, dataMitja, nomComplet } = AN;
const A = { agencia: null, clients: [] };
const pantalla = $("pantalla");

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
  if(/row-level security|permission/i.test(m)) return "No tens permís per fer això.";
  if(/Failed to fetch|NetworkError/i.test(m)) return "Sense connexió. Torna-ho a provar.";
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
  return Object.entries(map).map(([k, v]) => `<option value="${k}"${k === sel ? " selected" : ""}>${v.ico ? v.ico + " " : ""}${esc(v.ca)}</option>`).join("");
}

// ---------- entrada ----------
AN.posarLogo(null);
async function inici(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session){ vist("vLogin"); return; }
  const { data: esAdmin } = await sb.rpc("an_es_admin");
  if(esAdmin !== true){ vist("vNoPermis"); return; }
  const { data: perfil } = await sb.rpc("perfil_actual", { p_app: "itineraris" });
  A.agencia = perfil?.agencia || null;
  if(A.agencia){ AN.aplicarColors(A.agencia); AN.posarLogo(A.agencia); }
  $("menu").classList.remove("amagat");
  vist("vApp");
  route();
}
$("fLogin").addEventListener("submit", async e => {
  e.preventDefault();
  $("lErr").textContent = "";
  const { error } = await sb.auth.signInWithPassword({ email: $("lEmail").value.trim(), password: $("lPass").value });
  if(error){ $("lErr").textContent = "Correu o contrasenya incorrectes."; return; }
  inici();
});
async function sortir(){ await sb.auth.signOut(); location.hash = ""; location.reload(); }
$("bSortir").onclick = sortir;
document.querySelectorAll("#navPrincipal button").forEach(b => b.onclick = () => ir("#" + b.dataset.vista));
window.addEventListener("hashchange", route);

function route(){
  const [v, id, sub] = location.hash.replace(/^#/, "").split("/");
  document.querySelectorAll("#navPrincipal button").forEach(b =>
    b.classList.toggle("actiu", b.dataset.vista === (v === "client" || v === "clients" ? "clients" : "viatges")));
  window.scrollTo(0, 0);
  if(v === "clients") return vistaClients();
  if(v === "client") return vistaClient(id);
  if(v === "viatge") return vistaViatge(id, sub || "dades");
  return vistaViatges();
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
  pantalla.innerHTML = `<p class="meta">Carregant…</p>`;
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
        <span class="fila">${v.publicat ? `<span class="xip verd">Visible per al client</span>` : `<span class="xip">No publicat</span>`}
        ${v.estat === "cancelat" ? `<span class="xip coral">Cancel·lat</span>` : v.estat === "confirmat" ? `<span class="xip blau">Confirmat</span>` : ""}</span></div>
      <div class="meta">${esc([v.desti, v.pais].filter(Boolean).join(", "))}${v.data_inici ? " · " + dataCurta(v.data_inici) + (v.data_fi ? " → " + dataCurta(v.data_fi) : "") : ""}${v.referencia ? " · Ref. " + esc(v.referencia) : ""}</div>
      <div class="meta">${cl ? "👤 " + esc(cl) : "Sense viatgers assignats"}</div>
    </button>`;
  };
  pantalla.innerHTML = `
    <div class="fila entre" style="margin-bottom:14px"><h2 style="margin:0">Viatges</h2>
      <button class="boto petit" type="button" id="bNouViatge">+ Nou viatge</button></div>
    ${propers.length ? propers.map(fila).join("") : `<div class="buit">Encara no hi ha cap viatge. Crea'n un amb «+ Nou viatge».</div>`}
    ${passats.length ? `<h3>Viatges ja fets</h3>${passats.map(fila).join("")}` : ""}`;
  pantalla.querySelectorAll(".llista-it").forEach(b => b.onclick = () => ir("#viatge/" + b.dataset.id));
  $("bNouViatge").onclick = nouViatge;
}

function nouViatge(){
  modal(`<h2>Nou viatge</h2>
    <form id="fNouV">
      <div class="camp"><label>Títol del viatge *</label><input name="titol" required placeholder="Ex.: Japó en família"></div>
      <div class="graella">
        <div class="camp"><label>Destinació</label><input name="desti" placeholder="Ex.: Tòquio i Kyoto"></div>
        <div class="camp"><label>País</label><input name="pais"></div>
        <div class="camp"><label>Data d'inici</label><input name="data_inici" type="date"></div>
        <div class="camp"><label>Data de tornada</label><input name="data_fi" type="date"></div>
      </div>
      <div class="fila"><button class="boto" type="submit">Crea el viatge</button><button class="boto sec" type="button" data-tanca>Cancel·la</button></div>
    </form>`, m => {
    m.querySelector("#fNouV").onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      Object.keys(f).forEach(k => { if(f[k] === "") f[k] = null; });
      if(f.data_inici && f.data_fi && f.data_fi < f.data_inici) return avis("La tornada no pot ser abans de la sortida.", true);
      const { data, error } = await sb.from("an_viatges").insert(f).select("id").single();
      if(error) return avis(errMsg(error), true);
      tancarModal();
      ir("#viatge/" + data.id + "/viatgers");
    };
  });
}

// ---------- fitxa del viatge ----------
const SUBS = [
  ["dades", "📝 Dades"], ["viatgers", "👥 Viatgers"], ["serveis", "🧾 Serveis"], ["documents", "📎 Documents"],
  ["pagaments", "💶 Pagaments"], ["itinerari", "🗺️ Itinerari"], ["desti", "📍 Destí"]
];
async function vistaViatge(id, sub){
  const { data: v, error } = await sb.from("an_viatges").select("*").eq("id", id).maybeSingle();
  if(error || !v){ pantalla.innerHTML = `<div class="error">No s'ha trobat el viatge.</div>`; return; }
  A.viatge = v;
  pantalla.innerHTML = `
    <button class="tornar" type="button" onclick="ir('#viatges')">← Tots els viatges</button>
    <div class="fila entre"><h2 style="margin:0">${esc(v.titol)}</h2>
      ${v.publicat ? `<span class="xip verd">Visible per al client</span>` : `<span class="xip">No publicat</span>`}</div>
    <p class="meta" style="margin-top:2px">${esc([v.desti, v.pais].filter(Boolean).join(", "))}${v.data_inici ? " · " + dataCurta(v.data_inici) + (v.data_fi ? " → " + dataCurta(v.data_fi) : "") : ""}</p>
    <nav class="pestanyes" id="subnav">${SUBS.map(([k, l]) => `<button type="button" data-s="${k}" class="${k === sub ? "actiu" : ""}">${l}</button>`).join("")}</nav>
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
      <div class="camp"><label>Títol *</label><input name="titol" required value="${esc(v.titol)}"></div>
      <div class="graella">
        <div class="camp"><label>Destinació</label><input name="desti" value="${esc(v.desti)}"></div>
        <div class="camp"><label>País</label><input name="pais" value="${esc(v.pais)}"></div>
        <div class="camp"><label>Data d'inici</label><input name="data_inici" type="date" value="${esc(v.data_inici)}"></div>
        <div class="camp"><label>Data de tornada</label><input name="data_fi" type="date" value="${esc(v.data_fi)}"></div>
        <div class="camp"><label>Referència <span class="opc">(opcional)</span></label><input name="referencia" value="${esc(v.referencia)}"></div>
        <div class="camp"><label>Estat</label><select name="estat">${Object.entries(AN.ESTAT).map(([k, x]) => `<option value="${k}"${k === v.estat ? " selected" : ""}>${x.ca}</option>`).join("")}</select></div>
      </div>
      <div class="camp"><label>Presentació del viatge <span class="opc">(el client la veu al resum)</span></label><textarea name="descripcio">${esc(v.descripcio)}</textarea></div>
      <div class="camp"><label>Foto de portada</label>
        ${v.portada && urls[v.portada] ? `<img class="img-prev" src="${urls[v.portada]}" alt="">` : ""}
        <input type="file" accept="image/*" id="dPortada">
        ${v.portada ? `<button type="button" class="mini perill" id="dTreuPortada" style="margin-top:6px">Treu la portada</button>` : ""}
      </div>
      <div class="camp"><label>Preu total del viatge (€) <span class="opc">(per calcular el que queda pendent)</span></label><input name="import_total" type="number" step="0.01" min="0" value="${v.import_total ?? ""}"></div>
      <label class="check camp"><input type="checkbox" name="mostrar_pagaments"${v.mostrar_pagaments ? " checked" : ""}> Mostrar els pagaments al client titular</label>
      <div class="avis" style="margin-bottom:14px">
        <label class="check"><input type="checkbox" name="publicat"${v.publicat ? " checked" : ""}> <span><b>Publicar el viatge</b><br><span class="meta">Quan està marcat, els viatgers assignats el veuen a la seva app.</span></span></label>
      </div>
      <div class="fila entre"><button class="boto" type="submit">Desa els canvis</button>
        <button class="boto perill petit" type="button" id="bEsborraV">Esborra el viatge</button></div>
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
    if(reg.data_inici && reg.data_fi && reg.data_fi < reg.data_inici) return avis("La tornada no pot ser abans de la sortida.", true);
    const { error } = await sb.from("an_viatges").update(reg).eq("id", v.id);
    if(error) return avis(errMsg(error), true);
    avis("Desat ✓");
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
      avis("Portada desada ✓");
      vistaViatge(v.id, "dades");
    }catch(err){ avis(errMsg(err), true); }
  };
  if($("dTreuPortada")) $("dTreuPortada").onclick = async () => {
    await sb.from("an_viatges").update({ portada: null }).eq("id", v.id);
    await sb.storage.from(AN.BUCKET).remove([v.portada]);
    vistaViatge(v.id, "dades");
  };
  $("bEsborraV").onclick = async () => {
    if(!confirm(`Segur que vols esborrar el viatge «${v.titol}»? S'esborraran també els seus serveis, documents, pagaments, itinerari i recomanacions. No es pot desfer.`)) return;
    await esborrarCarpeta(v.id);
    const { error } = await sb.from("an_viatges").delete().eq("id", v.id);
    if(error) return avis(errMsg(error), true);
    avis("Viatge esborrat");
    ir("#viatges");
  };
}

async function avisPublicat(viatgeId){
  const { data } = await sb.from("an_viatge_clients").select("an_clients(user_id)").eq("viatge_id", viatgeId);
  const sense = (data || []).filter(x => !x.an_clients?.user_id).length;
  if(!(data || []).length) avis("Publicat. Recorda assignar-hi viatgers perquè el puguin veure.");
  else if(sense) avis(`Publicat. Hi ha ${sense} viatger(s) sense accés a l'app: crea-l'hi des de «Viatgers».`);
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
      <h2>Viatgers del viatge</h2>
      ${llista.length ? llista.map(x => `
        <div class="doc">
          <div class="n"><b>${esc(nomComplet(x.an_clients))}</b>
            <span class="meta">${esc(x.an_clients.email || "sense correu")}</span>
            ${x.an_clients.user_id ? `<span class="xip verd">Té accés a l'app</span>` : `<span class="xip coral">Sense accés</span>`}</div>
          <label class="check" style="white-space:nowrap"><input type="checkbox" name="titular" value="${x.client_id}"${x.titular ? " checked" : ""}> Titular</label>
          <button class="mini" type="button" data-fitxa="${x.client_id}">Fitxa</button>
          <button class="mini perill" type="button" data-treu="${x.client_id}" title="Treure del viatge">✕</button>
        </div>`).join("") : `<p class="meta">Encara no hi ha cap viatger en aquest viatge.</p>`}
      <p class="ajuda">Hi pots marcar més d'un <b>titular</b>. Els titulars són els que veuen els pagaments; tots els viatgers veuen la resta del viatge.</p>
    </div>
    <div class="targeta">
      <h2>Afegir un viatger</h2>
      ${lliures.length ? `<div class="fila"><select id="selClient" style="flex:1;min-width:200px"><option value="">— Tria un client —</option>
        ${lliures.map(c => `<option value="${c.id}">${esc(nomComplet(c))}${c.email ? " · " + esc(c.email) : ""}</option>`).join("")}</select>
        <button class="boto petit" type="button" id="bAfegeix">Afegeix</button></div>` : `<p class="meta">Tots els clients ja hi són.</p>`}
      <p style="margin:12px 0 0"><button class="boto sec petit" type="button" id="bNouClientV">+ Crear un client nou i afegir-lo</button></p>
    </div>`;
  cont.querySelectorAll("input[name=titular]").forEach(r => r.onchange = async () => {
    const { error } = await sb.from("an_viatge_clients").update({ titular: r.checked }).eq("viatge_id", v.id).eq("client_id", r.value);
    if(error){ r.checked = !r.checked; return avis(errMsg(error), true); }
    avis(r.checked ? "Marcat com a titular ✓" : "Ja no és titular");
  });
  cont.querySelectorAll("[data-fitxa]").forEach(b => b.onclick = () => ir("#client/" + b.dataset.fitxa));
  cont.querySelectorAll("[data-treu]").forEach(b => b.onclick = async () => {
    if(!confirm("Treure aquest viatger del viatge? El client no s'esborra.")) return;
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
    titol: "Serveis contractats", taula: "an_serveis", pare: { viatge_id: v.id }, viatge: v,
    ordenar: [["data_inici", true], ["hora_inici", true], ["created_at", true]],
    nouText: "+ Afegeix un servei",
    buit: "Afegeix-hi vols, hotels, trasllats, assegurança… El client ho veurà amb les dates i els localitzadors.",
    camps: [
      { k: "tipus", l: "Tipus", t: "select", op: AN.TIPUS_SERVEI, def: "vol" },
      { k: "titol", l: "Nom del servei *", req: true, ph: "Ex.: Vol Barcelona → Tòquio" },
      { k: "proveidor", l: "Proveïdor / companyia", ph: "Ex.: Qatar Airways" },
      { k: "localitzador", l: "Localitzador" },
      { k: "data_inici", l: "Data d'inici", t: "date" }, { k: "hora_inici", l: "Hora d'inici", t: "time" },
      { k: "data_fi", l: "Data de fi", t: "date" }, { k: "hora_fi", l: "Hora de fi", t: "time" },
      { k: "descripcio", l: "Detalls per al client", t: "textarea", ample: true, ph: "Ex.: Facturació 3 h abans. Equipatge: 1 maleta de 23 kg." }
    ],
    resum: s => `${AN.TIPUS_SERVEI[s.tipus]?.ico || ""} ${s.titol || "(sense nom)"}`,
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
        <div><dt>Preu total</dt><dd>${total == null ? `<span class="meta">Posa'l a «Dades»</span>` : euros(total)}</dd></div>
        <div><dt>Pagat</dt><dd>${euros(pagat)}</dd></div>
        <div><dt>Pendent</dt><dd>${total == null ? "—" : euros(Math.max(0, total - pagat))}</dd></div>
        <div><dt>El client ho veu?</dt><dd>${v.mostrar_pagaments ? "Sí, només el titular" : "No"}</dd></div>
      </div>
    </div>
    <div id="llistaPag"></div>`;
  seccio($("llistaPag"), {
    titol: "Pagaments i venciments", taula: "an_pagaments", pare: { viatge_id: v.id }, viatge: v,
    ordenar: [["data_venciment", true], ["created_at", true]],
    nouText: "+ Afegeix un pagament",
    buit: "Afegeix-hi la paga i senyal, els terminis… Deixa la data de pagament buida mentre estigui pendent.",
    camps: [
      { k: "concepte", l: "Concepte *", req: true, ph: "Ex.: Paga i senyal" },
      { k: "import", l: "Import (€) *", t: "num", req: true },
      { k: "data_venciment", l: "Data límit", t: "date" },
      { k: "data_pagament", l: "Data en què s'ha pagat", t: "date", ajuda: "Buida = pendent de pagar" }
    ],
    resum: p => `${p.data_pagament ? "✅" : "⏳"} ${p.concepte || "(sense concepte)"}`,
    sub: p => `${euros(p.import)}${p.data_pagament ? " · pagat el " + dataCurta(p.data_pagament) : p.data_venciment ? " · venç el " + dataCurta(p.data_venciment) : ""}`,
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
      p.innerHTML = `<p style="margin-top:0">Vols que et prepari els <b>${n} dies</b> del viatge amb les dates posades? Després només hauràs d'omplir cada dia.</p>
        <button class="boto petit" type="button">Crea els ${n} dies</button>`;
      cont.prepend(p);
      p.querySelector("button").onclick = async () => {
        const files = Array.from({ length: n }, (_, i) => {
          const d = new Date(v.data_inici + "T12:00:00"); d.setDate(d.getDate() + i);
          const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
          return { viatge_id: v.id, data: iso, titol: `Dia ${i + 1}`, ordre: i + 1 };
        });
        const { error } = await sb.from("an_dies").insert(files);
        if(error) return avis(errMsg(error), true);
        subItinerari(cont, v);
      };
    }
  }
  seccio($("itDies"), {
    titol: "Itinerari dia a dia", taula: "an_dies", pare: { viatge_id: v.id }, viatge: v, ambOrdre: true,
    nouText: "+ Afegeix un dia",
    buit: "Afegeix els dies del viatge. A cada dia hi pots posar una foto i les activitats amb hora.",
    camps: [
      { k: "data", l: "Data", t: "date" },
      { k: "titol", l: "Títol del dia *", req: true, ph: "Ex.: Arribada a Tòquio" },
      { k: "descripcio", l: "Descripció", t: "textarea", ample: true },
      { k: "foto", l: "Foto del dia", t: "foto", ample: true }
    ],
    resum: d => d.titol || "(sense títol)",
    sub: d => d.data ? AN.dataLlarga(d.data, "ca") : "",
    dins: (d, el) => {
      const s = document.createElement("div");
      s.className = "subllista";
      el.appendChild(s);
      seccio(s, {
        titol: "Activitats del dia", petit: true, taula: "an_activitats", pare: { dia_id: d.id }, viatge: v, ambOrdre: true,
        nouText: "+ Afegeix una activitat", buit: "Sense activitats.",
        camps: [
          { k: "hora", l: "Hora", t: "time" },
          { k: "nom", l: "Activitat *", req: true, ph: "Ex.: Visita guiada al temple Senso-ji" },
          { k: "lloc", l: "Lloc / punt de trobada" },
          { k: "descripcio", l: "Detalls", t: "textarea", ample: true }
        ],
        resum: a => `${a.hora ? a.hora + " · " : ""}${a.nom || "(sense nom)"}`
      });
    }
  });
}

// ---- Destí ----
function subDesti(cont, v){
  seccio(cont, {
    titol: "Destí i recomanacions", taula: "an_desti", pare: { viatge_id: v.id }, viatge: v, ambOrdre: true,
    nouText: "+ Afegeix una recomanació",
    buit: "Afegeix-hi informació pràctica del destí, consells, llocs per visitar, restaurants…",
    camps: [
      { k: "categoria", l: "Tipus", t: "select", op: AN.CATEGORIA_DESTI, def: "consell" },
      { k: "titol", l: "Títol *", req: true, ph: "Ex.: Moneda i propines" },
      { k: "descripcio", l: "Text", t: "textarea", ample: true },
      { k: "adreca", l: "Adreça", ajuda: "El client la podrà obrir a Google Maps" },
      { k: "enllac", l: "Enllaç web", t: "url", ph: "https://…" },
      { k: "foto", l: "Foto", t: "foto", ample: true }
    ],
    resum: r => `${AN.CATEGORIA_DESTI[r.categoria]?.ico || ""} ${r.titol || "(sense títol)"}`,
    sub: r => AN.CATEGORIA_DESTI[r.categoria]?.ca || ""
  });
}

// ---- Documents ----
async function subDocuments(cont, v){
  const { data: docs, error } = await sb.from("an_documents").select("*").eq("viatge_id", v.id).order("created_at");
  if(error){ cont.innerHTML = `<div class="error">${esc(errMsg(error))}</div>`; return; }
  cont.innerHTML = `
    <div class="targeta">
      <h2>Pujar documents</h2>
      <div class="graella">
        <div class="camp"><label>Tipus</label><select id="docCat">${opcions(AN.CATEGORIA_DOC, "bitllet")}</select></div>
        <div class="camp"><label>Fitxers</label><input type="file" id="docFit" multiple></div>
      </div>
      <p class="ajuda">Pots triar-ne diversos alhora (PDF, fotos…). Màxim 25 MB per fitxer. No hi pugis passaports ni DNI.</p>
      <button class="boto petit" type="button" id="bPuja">Puja</button> <span class="meta" id="docEstat"></span>
    </div>
    <div class="targeta">
      <h2>Documents del viatge</h2>
      ${(docs || []).length ? docs.map(d => `
        <div class="doc">
          <span style="font-size:22px">${AN.CATEGORIA_DOC[d.categoria]?.ico || "📎"}</span>
          <div class="n"><b>${esc(d.nom)}</b><span class="meta">${AN.CATEGORIA_DOC[d.categoria]?.ca || ""} · ${AN.mida(d.mida)}</span></div>
          <label class="check" style="white-space:nowrap"><input type="checkbox" data-vis="${d.id}"${d.visible ? " checked" : ""}> Visible</label>
          <button class="mini" type="button" data-obre="${esc(d.path)}">Obre</button>
          <button class="mini" type="button" data-nom="${d.id}">✎</button>
          <button class="mini perill" type="button" data-esb="${d.id}">✕</button>
        </div>`).join("") : `<p class="meta">Encara no hi ha documents.</p>`}
      <p class="ajuda">Si treus «Visible», el document queda guardat però el client no el veu.</p>
    </div>`;
  $("bPuja").onclick = async () => {
    const fits = [...$("docFit").files];
    if(!fits.length) return avis("Tria algun fitxer.", true);
    const cat = $("docCat").value;
    $("bPuja").disabled = true;
    let ok = 0;
    for(const f of fits){
      $("docEstat").textContent = `Pujant ${ok + 1} de ${fits.length}…`;
      if(f.size > 25 * 1024 * 1024){ avis(`«${f.name}» fa més de 25 MB.`, true); continue; }
      const ruta = `${v.id}/docs/${uuid()}-${AN.nomFitxerSegur(f.name)}`;
      const { error } = await sb.storage.from(AN.BUCKET).upload(ruta, f, { contentType: f.type || "application/octet-stream" });
      if(error){ avis(errMsg(error), true); continue; }
      const nom = f.name.replace(/\.[^.]+$/, "");
      const { error: e2 } = await sb.from("an_documents").insert({ viatge_id: v.id, nom, categoria: cat, path: ruta, mida: f.size });
      if(e2){ await sb.storage.from(AN.BUCKET).remove([ruta]); avis(errMsg(e2), true); continue; }
      ok++;
    }
    avis(`${ok} document(s) pujat(s) ✓`);
    subDocuments(cont, v);
  };
  cont.querySelectorAll("[data-vis]").forEach(c => c.onchange = async () => {
    const { error } = await sb.from("an_documents").update({ visible: c.checked }).eq("id", c.dataset.vis);
    if(error) avis(errMsg(error), true);
  });
  cont.querySelectorAll("[data-obre]").forEach(b => b.onclick = async () => {
    const w = window.open("", "_blank");
    const { data, error } = await sb.storage.from(AN.BUCKET).createSignedUrl(b.dataset.obre, 300);
    if(error || !data){ w && w.close(); return avis("No s'ha pogut obrir.", true); }
    if(w) w.location = data.signedUrl; else location.href = data.signedUrl;
  });
  cont.querySelectorAll("[data-nom]").forEach(b => b.onclick = () => {
    const d = docs.find(x => x.id === b.dataset.nom);
    modal(`<h2>Canviar el document</h2>
      <div class="camp"><label>Nom que veu el client</label><input id="mNom" value="${esc(d.nom)}"></div>
      <div class="camp"><label>Tipus</label><select id="mCat">${opcions(AN.CATEGORIA_DOC, d.categoria)}</select></div>
      <div class="fila"><button class="boto" type="button" id="mDesa">Desa</button><button class="boto sec" type="button" data-tanca>Cancel·la</button></div>`, m => {
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
    if(!confirm(`Esborrar «${d.nom}»?`)) return;
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
      <button class="boto ${cfg.petit ? "sec" : ""} petit" type="button" data-nou>${esc(cfg.nouText || "+ Afegeix")}</button>
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
      <summary><span class="n">${esc(r.id ? cfg.resum(r) : "Nou")}</span>
        ${r.id && cfg.sub ? `<span class="meta">${esc(cfg.sub(r))}</span>` : ""}</summary>
      <div class="el-cos">
        <form>
          <div class="graella">${cfg.camps.map(c => camp(c, r, urls)).join("")}</div>
          <div class="fila entre" style="margin-top:4px">
            <span class="fila"><button class="boto petit" type="submit">Desa</button>
              ${r.id ? "" : `<button class="boto sec petit" type="button" data-cancela>Cancel·la</button>`}</span>
            <span class="fila">
              ${r.id && cfg.ambOrdre ? `<button class="mini" type="button" data-amunt ${i <= 0 ? "disabled" : ""}>↑</button><button class="mini" type="button" data-avall ${i >= files.length - 1 ? "disabled" : ""}>↓</button>` : ""}
              ${r.id ? `<button class="mini perill" type="button" data-esb>Esborra</button>` : ""}</span>
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
        avis("Foto pujada. Recorda clicar «Desa».");
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
      for(const c of cfg.camps) if(c.req && (reg[c.k] == null)) return avis(`Falta «${c.l.replace(" *", "")}».`, true);
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
      avis("Desat ✓");
      recarrega();
    };
    const canc = form.querySelector("[data-cancela]");
    if(canc) canc.onclick = () => { el.remove(); bNou.disabled = false; };
    const esb = form.querySelector("[data-esb]");
    if(esb) esb.onclick = async () => {
      if(!confirm("Segur que ho vols esborrar?")) return;
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
        <button class="mini" type="button" data-treufoto="${c.k}">Treu la foto</button></div>`;
      break;
    default: inp = `<input name="${c.k}" value="${esc(v)}"${ph}>`;
  }
  return `<div class="camp${ample}"><label>${esc(c.l)}</label>${inp}${ajuda}</div>`;
}

// =====================================================================
// CLIENTS
// =====================================================================
async function vistaClients(){
  pantalla.innerHTML = `<p class="meta">Carregant…</p>`;
  try{ await carregarClients(); }catch(e){ pantalla.innerHTML = `<div class="error">${esc(errMsg(e))}</div>`; return; }
  pantalla.innerHTML = `
    <div class="fila entre" style="margin-bottom:14px"><h2 style="margin:0">Clients</h2>
      <button class="boto petit" type="button" id="bNouClient">+ Nou client</button></div>
    <input id="cerca" type="search" placeholder="Cerca per nom, correu o telèfon" style="margin-bottom:12px">
    <div id="llistaC"></div>`;
  const pinta = () => {
    const q = $("cerca").value.trim().toLowerCase();
    const fil = A.clients.filter(c => !q || [c.nom, c.cognoms, c.email, c.telefon].join(" ").toLowerCase().includes(q));
    $("llistaC").innerHTML = fil.length ? fil.map(c => `
      <button type="button" class="llista-it" data-id="${c.id}">
        <div class="fila entre"><span class="titol">${esc(nomComplet(c))}</span>
          ${c.user_id ? `<span class="xip verd">Té accés</span>` : `<span class="xip">Sense accés</span>`}</div>
        <div class="meta">${esc([c.email, c.telefon].filter(Boolean).join(" · "))}</div>
      </button>`).join("") : `<div class="buit">${A.clients.length ? "Cap client coincideix amb la cerca." : "Encara no hi ha clients."}</div>`;
    $("llistaC").querySelectorAll(".llista-it").forEach(b => b.onclick = () => ir("#client/" + b.dataset.id));
  };
  $("cerca").oninput = pinta;
  $("bNouClient").onclick = () => formulariClient(null, nou => ir("#client/" + nou.id));
  pinta();
}

function formulariClient(c, enDesar){
  const x = c || { idioma: "ca" };
  modal(`<h2>${c ? "Dades del client" : "Nou client"}</h2>
    <form id="fClient">
      <div class="graella">
        <div class="camp"><label>Nom *</label><input name="nom" required value="${esc(x.nom)}"></div>
        <div class="camp"><label>Cognoms</label><input name="cognoms" value="${esc(x.cognoms)}"></div>
        <div class="camp"><label>Correu</label><input name="email" type="email" value="${esc(x.email)}"><div class="ajuda">Serà el seu usuari per entrar a l'app</div></div>
        <div class="camp"><label>Telèfon (WhatsApp)</label><input name="telefon" type="tel" value="${esc(x.telefon)}" placeholder="+34 600 000 000"></div>
        <div class="camp"><label>Idioma de l'app</label><select name="idioma"><option value="ca"${x.idioma === "ca" ? " selected" : ""}>Català</option><option value="es"${x.idioma === "es" ? " selected" : ""}>Castellano</option></select></div>
      </div>
      <div class="camp"><label>Notes internes <span class="opc">(el client no les veu)</span></label><textarea name="notes">${esc(x.notes)}</textarea></div>
      <div class="fila"><button class="boto" type="submit">Desa</button><button class="boto sec" type="button" data-tanca>Cancel·la</button></div>
    </form>`, m => {
    m.querySelector("#fClient").onsubmit = async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const reg = { nom: d.nom.trim(), cognoms: d.cognoms.trim() || null, email: d.email.trim().toLowerCase() || null,
                    telefon: d.telefon.trim() || null, idioma: d.idioma, notes: d.notes.trim() || null };
      if(c && c.user_id && !reg.email) return avis("Aquest client té accés a l'app: el correu no pot quedar buit.", true);
      if(reg.email){
        const dup = A.clients.find(o => o.id !== c?.id && (o.email || "").toLowerCase() === reg.email);
        if(dup && !confirm(`Ja hi ha un client amb aquest correu (${nomComplet(dup)}). Vols continuar igualment?`)) return;
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
        avis("El nou correu ja és el seu usuari per entrar.");
      }
      tancarModal();
      await carregarClients();
      enDesar && enDesar(res.data);
    };
  });
}

async function vistaClient(id){
  pantalla.innerHTML = `<p class="meta">Carregant…</p>`;
  const [{ data: c, error }, { data: viatges }] = await Promise.all([
    sb.from("an_clients").select("*").eq("id", id).maybeSingle(),
    sb.from("an_viatge_clients").select("titular, an_viatges(id, titol, data_inici, data_fi, publicat)").eq("client_id", id)
  ]);
  if(error || !c){ pantalla.innerHTML = `<div class="error">No s'ha trobat el client.</div>`; return; }
  await carregarClients();
  pantalla.innerHTML = `
    <button class="tornar" type="button" onclick="ir('#clients')">← Tots els clients</button>
    <div class="targeta">
      <div class="fila entre"><h2 style="margin:0">${esc(nomComplet(c))}</h2><button class="mini" type="button" id="bEdita">✎ Edita</button></div>
      <dl class="kv" style="margin-top:12px">
        <div><dt>Correu</dt><dd>${esc(c.email || "—")}</dd></div>
        <div><dt>Telèfon</dt><dd>${esc(c.telefon || "—")}</dd></div>
        <div><dt>Idioma</dt><dd>${c.idioma === "es" ? "Castellano" : "Català"}</dd></div>
      </dl>
      ${c.notes ? `<p class="meta" style="margin-bottom:0">📝 ${text(c.notes)}</p>` : ""}
    </div>
    <div class="targeta" id="acces"></div>
    <div class="targeta">
      <h2>Viatges</h2>
      ${(viatges || []).length ? viatges.map(x => `<button type="button" class="llista-it" data-v="${x.an_viatges.id}">
          <span class="titol">${esc(x.an_viatges.titol)}</span>
          <div class="meta">${x.an_viatges.data_inici ? dataCurta(x.an_viatges.data_inici) : "Sense dates"}${x.titular ? " · Titular" : ""}${x.an_viatges.publicat ? "" : " · No publicat"}</div>
        </button>`).join("") : `<p class="meta">Aquest client encara no és a cap viatge. Afegeix-l'hi des de la pestanya «Viatgers» del viatge.</p>`}
    </div>
    <p class="centre"><button class="boto perill petit" type="button" id="bEsborraC">Esborra el client</button></p>`;
  $("bEdita").onclick = () => formulariClient(c, () => vistaClient(c.id));
  pantalla.querySelectorAll("[data-v]").forEach(b => b.onclick = () => ir("#viatge/" + b.dataset.v));
  pintaAcces(c);
  $("bEsborraC").onclick = async () => {
    if(!confirm(`Esborrar ${nomComplet(c)}? Es treurà dels seus viatges i perdrà l'accés a l'app. No es pot desfer.`)) return;
    if(c.user_id){ const r = await compte("treure", c.id); if(!r.ok) return avis(r.msg, true); }
    const { error } = await sb.from("an_clients").delete().eq("id", c.id);
    if(error) return avis(errMsg(error), true);
    avis("Client esborrat");
    ir("#clients");
  };
}

function pintaAcces(c){
  const box = $("acces");
  if(!c.user_id){
    box.innerHTML = `
      <h2>Accés a l'app</h2>
      ${c.email ? `
        <p class="meta" style="margin-top:0">Crea-li l'accés: el seu usuari serà <b>${esc(c.email)}</b>. Després li envies les dades per WhatsApp.</p>
        <div class="camp"><label>Contrasenya inicial</label><input id="aPass" value="${contrasenyaNova()}" autocomplete="off"><div class="ajuda">Mínim 8 caràcters. Ell la podrà canviar des de l'app.</div></div>
        <button class="boto" type="button" id="bCrea">Crea l'accés</button>`
      : `<p class="avis">Per donar-li accés cal que tingui un correu. Clica «✎ Edita» i posa-l'hi.</p>`}`;
    if($("bCrea")) $("bCrea").onclick = async () => {
      const pass = $("aPass").value.trim();
      if(pass.length < 8) return avis("La contrasenya ha de tenir 8 caràcters o més.", true);
      $("bCrea").disabled = true;
      const r = await compte("crear", c.id, pass);
      $("bCrea").disabled = false;
      if(!r.ok) return avis(r.msg, true);
      avis("Accés creat ✓");
      c.user_id = "fet";
      pintaAcces(c);
      enviarDades(c, pass);
    };
    return;
  }
  box.innerHTML = `
    <h2>Accés a l'app</h2>
    <p style="margin-top:0"><span class="xip verd">Té accés</span> Usuari: <b>${esc(c.email)}</b></p>
    <div class="fila">
      <button class="boto sec petit" type="button" id="bNovaPass">Posar una contrasenya nova</button>
      <button class="boto sec petit" type="button" id="bEnviaLink">Enviar l'enllaç de l'app</button>
      <button class="boto perill petit" type="button" id="bTreu">Treure l'accés</button>
    </div>`;
  $("bNovaPass").onclick = () => {
    modal(`<h2>Contrasenya nova</h2>
      <div class="camp"><label>Contrasenya</label><input id="mPass" value="${contrasenyaNova()}" autocomplete="off"></div>
      <div class="fila"><button class="boto" type="button" id="mDesa">Canvia-la</button><button class="boto sec" type="button" data-tanca>Cancel·la</button></div>`, m => {
      m.querySelector("#mDesa").onclick = async () => {
        const pass = m.querySelector("#mPass").value.trim();
        if(pass.length < 8) return avis("Mínim 8 caràcters.", true);
        const r = await compte("contrasenya", c.id, pass);
        if(!r.ok) return avis(r.msg, true);
        tancarModal();
        avis("Contrasenya canviada ✓");
        enviarDades(c, pass);
      };
    });
  };
  $("bEnviaLink").onclick = () => enviarDades(c, null);
  $("bTreu").onclick = async () => {
    if(!confirm(`${nomComplet(c)} ja no podrà entrar a l'app. Les dades del client i dels viatges es mantenen. Continuar?`)) return;
    const r = await compte("treure", c.id);
    if(!r.ok) return avis(r.msg, true);
    avis("Accés tret");
    vistaClient(c.id);
  };
}

function urlApp(){ return new URL("./", location.href).href; }

function enviarDades(c, pass){
  const es = c.idioma === "es";
  const ag = A.agencia?.nom || "Rimu Viatges";
  const msg = es
    ? `¡Hola ${c.nom}! 👋\nYa tienes tu viaje disponible en la app de ${ag} 📲\n\nEntra en: ${urlApp()}\nUsuario: ${c.email}${pass ? `\nContraseña: ${pass}` : ""}\n\nTe aconsejamos añadirla a la pantalla de inicio del móvil para tenerla siempre a mano.`
    : `Hola ${c.nom}! 👋\nJa tens el teu viatge disponible a l'app de ${ag} 📲\n\nEntra a: ${urlApp()}\nUsuari: ${c.email}${pass ? `\nContrasenya: ${pass}` : ""}\n\nT'aconsellem afegir-la a la pantalla d'inici del mòbil per tenir-la sempre a mà.`;
  const tel = (c.telefon || "").replace(/[^\d+]/g, "").replace(/^\+/, "").replace(/^00/, "");
  const telWa = tel && tel.length === 9 ? "34" + tel : tel;
  modal(`<h2>Envia-li les dades</h2>
    <div class="missatge">${esc(msg)}</div>
    <div class="fila" style="margin-top:14px">
      <a class="boto wa" target="_blank" rel="noopener" href="https://wa.me/${telWa}?text=${encodeURIComponent(msg)}">WhatsApp</a>
      <button class="boto sec" type="button" id="mCopia">Copia el text</button>
      <button class="boto sec" type="button" data-tanca>Tanca</button>
    </div>
    ${pass ? `<p class="ajuda">Apunta't la contrasenya ara: per seguretat, després no es torna a mostrar.</p>` : ""}`, m => {
    m.querySelector("#mCopia").onclick = async () => {
      try{ await navigator.clipboard.writeText(msg); avis("Copiat ✓"); }catch{ avis("No s'ha pogut copiar.", true); }
    };
  });
}

// Crida a la funció del servidor que gestiona els comptes dels clients
async function compte(accio, client_id, contrasenya){
  const MSG = {
    EMAIL_JA_EXISTEIX: "Aquest correu ja té un compte (potser és d'una agència o d'un altre client). Fes servir un altre correu.",
    EMAIL_INVALID: "El correu no és vàlid.",
    CONTRASENYA_CURTA: "La contrasenya ha de tenir 8 caràcters o més.",
    JA_TE_ACCES: "Aquest client ja té accés.",
    NO_PERMIS: "No tens permís. Torna a entrar al panell.",
    NO_A_TU_MATEIX: "No pots treure el teu propi accés."
  };
  try{
    const { data, error } = await sb.functions.invoke("anonta-comptes", { body: { accio, client_id, contrasenya } });
    if(error){
      let codi = "";
      try{ codi = (await error.context.json()).error; }catch{}
      return { ok: false, msg: MSG[codi] || "No s'ha pogut fer. Torna-ho a provar." };
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

inici();
