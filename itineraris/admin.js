// Panell d'itineraris (Rimu Viatges i agències associades)
const sb = supabase.createClient(RIMU.SUPABASE_URL, RIMU.SUPABASE_KEY);
const $ = id => document.getElementById(id);
const { esc, euros } = IT;
const BASE = location.href.replace(/admin\.html.*$/, "").replace(/[?#].*$/, "");
const urlClient = tok => BASE + "index.html?i=" + tok;
const uuid = () => crypto.randomUUID();

let LANG = "ca";
try { LANG = localStorage.getItem("it_lang") || "ca"; } catch(e) {}
const L = (ca, es) => LANG === "es" ? es : ca;
const LOC = () => LANG === "es" ? "es-ES" : "ca-ES";
const tipusOpc = () => Object.entries(IT.TIPUS).map(([k, v]) => `<option value="${k}">${v.ico} ${v[LANG] || v.ca}</option>`).join("");

let USER = null, P = null, LLISTA = [], BIB = [];
let E = null;            // itinerari obert: { it, dies, serveis, docs, nou }
let BRUT = false;        // hi ha canvis sense desar
let destiBib = null;     // a quin dia s'afegeix el servei de la biblioteca (null = tot el viatge)

function toast(x){ const e = $("toast"); e.textContent = x; e.classList.add("vist"); setTimeout(() => e.classList.remove("vist"), 2200); }
async function copiar(x){ try{ await navigator.clipboard.writeText(x); toast(L("Copiat!", "¡Copiado!")); }catch(e){ prompt(L("Copia:", "Copia:"), x); } }
function brut(){ BRUT = true; $("edCanvis").classList.remove("amagat"); actualitzarTotal(); }
function net(){ BRUT = false; $("edCanvis").classList.add("amagat"); }
const quan = iso => new Date(iso).toLocaleString(LOC(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const nomAgencia = () => (P && P.agencia && P.agencia.nom) || "Rimu Viatges";

/* ================= IDIOMA DEL PANELL ================= */
function traduirEstatic(){
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-es]").forEach(el => {
    if(el.dataset.ca === undefined) el.dataset.ca = el.innerHTML;
    el.innerHTML = LANG === "es" ? el.dataset.es : el.dataset.ca;
  });
  document.querySelectorAll("[data-es-ph]").forEach(el => {
    if(el.dataset.caPh === undefined) el.dataset.caPh = el.placeholder;
    el.placeholder = LANG === "es" ? el.dataset.esPh : el.dataset.caPh;
  });
  document.querySelectorAll("#idiomes button").forEach(b => b.classList.toggle("actiu", b.dataset.lang === LANG));
  document.title = L("Itineraris", "Itinerarios") + " · " + nomAgencia();
}
function canviarIdioma(nou){
  if(nou === LANG) return;
  LANG = nou;
  try { localStorage.setItem("it_lang", LANG); } catch(e) {}
  traduirEstatic();
  // Torna a pintar el que hi hagi a la pantalla
  if(E){ pintarInfo(); pintarDies(); pintarGenerals(); pintarDocs(); actualitzarTotal(); if(!E.nou) carregarActivitat(); }
  else if(!$("panLlista").classList.contains("amagat") && USER) carregarLlista();
  else if(!$("panBib").classList.contains("amagat")) pintarBib();
}
document.querySelectorAll("#idiomes button").forEach(b => b.onclick = () => canviarIdioma(b.dataset.lang));

/* ================= SESSIÓ ================= */
async function iniciar(){
  traduirEstatic();
  const { data: { session } } = await sb.auth.getSession();
  if(session) await entrar(); else mostrarLogin();
}
function mostrarLogin(){
  $("vistaLogin").classList.remove("amagat"); $("vistaApp").classList.add("amagat");
  IT.carregarLogo(null);
}
async function entrar(){
  const { data: { user } } = await sb.auth.getUser();
  const { data: perfil } = await sb.rpc("perfil_actual");
  if(!user || !perfil){
    await sb.auth.signOut(); mostrarLogin();
    $("lErr").textContent = L("Aquest compte no té accés als itineraris.", "Esta cuenta no tiene acceso a los itinerarios.");
    $("lErr").classList.remove("amagat"); return;
  }
  USER = user; P = perfil;
  IT.aplicarColors(P.agencia); IT.carregarLogo(P.agencia);
  // Si l'usuari no ha triat mai idioma, fem servir el de l'agència
  let triat = null; try { triat = localStorage.getItem("it_lang"); } catch(e) {}
  if(!triat && P.agencia.idioma_fix && P.agencia.idioma_fix !== LANG){ LANG = P.agencia.idioma_fix; }
  traduirEstatic();
  $("blocIdioma").classList.toggle("amagat", !!P.agencia.idioma_fix);
  $("vistaLogin").classList.add("amagat"); $("vistaApp").classList.remove("amagat");
  const obrir = new URLSearchParams(location.search).get("e");
  if(obrir) obrirEditor(obrir); else carregarLlista();
}
$("btnEntrar").onclick = async () => {
  $("lErr").classList.add("amagat"); $("lOk").classList.add("amagat");
  const { error } = await sb.auth.signInWithPassword({ email: $("lEmail").value.trim(), password: $("lPass").value });
  if(error){
    $("lErr").textContent = /confirm/i.test(error.message)
      ? L("Encara cal confirmar el compte des del correu.", "Falta confirmar la cuenta desde el correo.")
      : L("Correu o contrasenya incorrectes.", "Correo o contraseña incorrectos.");
    $("lErr").classList.remove("amagat"); return;
  }
  await entrar();
};
$("lPass").addEventListener("keydown", e => { if(e.key === "Enter") $("btnEntrar").click(); });
$("lnkCrear").onclick = async e => {
  e.preventDefault();
  $("lErr").classList.add("amagat"); $("lOk").classList.add("amagat");
  const pass = $("lPass").value;
  if(!$("lEmail").value.trim() || pass.length < 8){
    $("lErr").textContent = L("Escriu el correu i una contrasenya d'almenys 8 caràcters.", "Escribe el correo y una contraseña de al menos 8 caracteres.");
    $("lErr").classList.remove("amagat"); return;
  }
  const { data, error } = await sb.auth.signUp({ email: $("lEmail").value.trim(), password: pass });
  if(error){ $("lErr").textContent = error.message; $("lErr").classList.remove("amagat"); return; }
  if(data.session){ await entrar(); return; }
  $("lOk").textContent = L("Compte creat: confirma'l des del correu i després entra.", "Cuenta creada: confírmala desde el correo y después entra.");
  $("lOk").classList.remove("amagat");
};
$("lnkSortir").onclick = async e => { e.preventDefault(); await sb.auth.signOut(); location.href = "admin.html"; };

/* ================= PESTANYES ================= */
function pestanya(p){
  if(!$("panEditor").classList.contains("amagat") && BRUT && !confirm(L("Tens canvis sense desar. Vols sortir igualment?", "Tienes cambios sin guardar. ¿Quieres salir igualmente?"))) return false;
  document.querySelectorAll("#pestanyes button").forEach(b => b.classList.toggle("actiu", b.dataset.p === p));
  $("pestanyes").classList.remove("amagat");
  $("panLlista").classList.toggle("amagat", p !== "llista");
  $("panBib").classList.toggle("amagat", p !== "bib");
  $("panEditor").classList.add("amagat"); $("barraEd").classList.add("amagat");
  E = null; net();
  history.replaceState(null, "", "admin.html");
  if(p === "llista") carregarLlista();
  if(p === "bib") carregarBib().then(pintarBib);
  return true;
}
document.querySelectorAll("#pestanyes button").forEach(b => b.onclick = () => pestanya(b.dataset.p));
window.addEventListener("beforeunload", e => { if(BRUT){ e.preventDefault(); e.returnValue = ""; } });

/* ================= LLISTA ================= */
async function carregarLlista(){
  $("llista").innerHTML = `<div class="targeta centre meta">${L("Carregant…", "Cargando…")}</div>`;
  const [{ data: its, error }, { data: evs }] = await Promise.all([
    sb.from("it_itineraris").select("id,token,titol,client_nom,destinacio,data_inici,data_fi,num_persones,idioma,seleccio_at,updated_at").order("updated_at", { ascending: false }),
    sb.from("it_events").select("itinerari_id,tipus,created_at").eq("tipus", "obert").order("created_at", { ascending: false }).limit(5000)
  ]);
  if(error){ $("llista").innerHTML = `<div class="targeta error">Error: ${esc(error.message)}</div>`; return; }
  const vistes = {};
  (evs || []).forEach(e => { const v = vistes[e.itinerari_id] ||= { n: 0, ultim: e.created_at }; v.n++; });
  LLISTA = its.map(i => ({ ...i, vistes: vistes[i.id] || { n: 0 } }));
  if(!LLISTA.length){
    $("llista").innerHTML = `<div class="buit">${L("Encara no tens cap itinerari. Prem «➕ Nou itinerari» per començar.", "Todavía no tienes ningún itinerario. Pulsa «➕ Nuevo itinerario» para empezar.")}</div>`; return;
  }
  $("llista").innerHTML = LLISTA.map(i => {
    const dates = i.data_inici ? IT.dataCurta(i.data_inici) + (i.data_fi ? " – " + IT.dataCurta(i.data_fi) : "") : "";
    const idi = P.agencia.idioma_fix ? "" : (i.idioma === "es" ? L("Castellà", "Castellano") : L("Català", "Catalán"));
    const cops = n => n === 1 ? L("cop", "vez") : L("cops", "veces");
    return `<div class="it-fila">
      <div class="titol">${esc(i.titol || L("(sense títol)", "(sin título)"))}</div>
      <div class="meta">${[i.client_nom, i.destinacio, dates, i.num_persones + " pers.", idi].filter(Boolean).map(esc).join(" · ")}</div>
      <div class="stats">
        ${i.vistes.n ? `<span class="xip verd">👁 ${L("Vist", "Visto")} ${i.vistes.n} ${cops(i.vistes.n)} · ${L("últim", "último")} ${esc(quan(i.vistes.ultim))}</span>` : `<span class="xip">👁 ${L("Encara no l'ha obert", "Todavía no lo ha abierto")}</span>`}
        ${i.seleccio_at ? `<span class="xip coral">✋ ${L("Ha tocat opcionals", "Ha tocado opcionales")} · ${esc(quan(i.seleccio_at))}</span>` : ""}
      </div>
      <div class="fila-botons">
        <button class="boto petit" data-ed="${i.id}">✏️ ${L("Editar", "Editar")}</button>
        <a class="boto wa petit" target="_blank" rel="noopener" href="${waLink(i)}">WhatsApp</a>
        <button class="boto sec petit" data-cp="${esc(urlClient(i.token))}">${L("Copiar enllaç", "Copiar enlace")}</button>
        <a class="boto sec petit" target="_blank" rel="noopener" href="${esc(urlClient(i.token))}">👁 ${L("Veure", "Ver")}</a>
        <button class="boto sec petit" data-dup="${i.id}">⧉ ${L("Duplicar", "Duplicar")}</button>
      </div></div>`;
  }).join("");
  $("llista").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => obrirEditor(b.dataset.ed));
  $("llista").querySelectorAll("[data-cp]").forEach(b => b.onclick = () => copiar(b.dataset.cp));
  $("llista").querySelectorAll("[data-dup]").forEach(b => b.onclick = () => duplicar(b.dataset.dup, b));
}
$("btnRefresca").onclick = carregarLlista;

function missatgeWA(i){
  const nom = i.client_nom ? " " + i.client_nom : "";
  if(i.idioma === "es")
    return `¡Hola${nom}! Te paso la propuesta de viaje «${i.titol}». Puedes ver el itinerario día a día, quitar los servicios opcionales que no te interesen y descargarlo en PDF:\n${urlClient(i.token)}\n\nCualquier duda, me dices. ¡Gracias!\n${nomAgencia()}`;
  return `Hola${nom}! Et passo la proposta de viatge «${i.titol}». Hi pots veure l'itinerari dia a dia, treure els serveis opcionals que no t'interessin i descarregar-lo en PDF:\n${urlClient(i.token)}\n\nQualsevol dubte, em dius. Gràcies!\n${nomAgencia()}`;
}
const waLink = i => "https://wa.me/?text=" + encodeURIComponent(missatgeWA(i));

/* ================= EDITOR: obrir ================= */
$("btnNou").onclick = () => {
  E = { nou: true, it: { id: uuid(), titol: "", client_nom: "", destinacio: "", data_inici: null, data_fi: null, num_persones: 2,
        idioma: P.agencia.idioma_fix || LANG, mostrar_preus: true, introduccio: "", notes: "", info: {}, imatge_portada: null, seleccio: {} },
        dies: [], serveis: [], docs: [] };
  mostrarEditor();
};

async function obrirEditor(id){
  const [a, b, c, d] = await Promise.all([
    sb.from("it_itineraris").select("*").eq("id", id).single(),
    sb.from("it_dies").select("*").eq("itinerari_id", id).order("ordre"),
    sb.from("it_serveis").select("*").eq("itinerari_id", id).order("ordre"),
    sb.from("it_documents").select("*").eq("itinerari_id", id).order("created_at")
  ]);
  if(a.error){ toast(L("No s'ha pogut obrir", "No se ha podido abrir")); carregarLlista(); return; }
  E = { nou: false, it: a.data, dies: b.data || [], serveis: c.data || [], docs: d.data || [] };
  E.serveis.forEach(s => s.preu = Number(s.preu));
  mostrarEditor();
}

function mostrarEditor(){
  $("pestanyes").classList.add("amagat");
  $("panLlista").classList.add("amagat"); $("panBib").classList.add("amagat");
  $("panEditor").classList.remove("amagat"); $("barraEd").classList.remove("amagat");
  history.replaceState(null, "", E.nou ? "admin.html" : "admin.html?e=" + E.it.id);
  const it = E.it;
  if(P.agencia.idioma_fix) it.idioma = P.agencia.idioma_fix;
  $("eTitol").value = it.titol; $("eClient").value = it.client_nom; $("eDesti").value = it.destinacio;
  $("eInici").value = it.data_inici || ""; $("eFi").value = it.data_fi || ""; $("ePers").value = it.num_persones;
  document.querySelector(`input[name=eIdioma][value=${it.idioma}]`).checked = true;
  $("eMostrar").checked = it.mostrar_preus; $("eIntro").value = it.introduccio;
  it.info = it.info || {};
  pintarInfo(); pintarPortada(); pintarDies(); pintarGenerals(); pintarDocs(); pintarEnllacos();
  $("activitat").classList.toggle("amagat", E.nou);
  $("btnEsborrar").classList.toggle("amagat", E.nou);
  if(!E.nou) carregarActivitat();
  net(); actualitzarTotal();
  window.scrollTo(0, 0);
}
$("btnTornar").onclick = () => pestanya("llista");

function pintarEnllacos(){
  const ok = !E.nou && E.it.token;
  ["lnkVeure", "lnkWA", "btnCopiar"].forEach(x => $(x).classList.toggle("amagat", !ok));
  if(!ok) return;
  $("lnkVeure").href = urlClient(E.it.token);
  $("lnkWA").href = waLink(E.it);
  $("btnCopiar").onclick = () => copiar(urlClient(E.it.token));
}

/* ---------- camps generals ---------- */
const lligams = { eTitol: "titol", eClient: "client_nom", eDesti: "destinacio", eIntro: "introduccio" };
Object.entries(lligams).forEach(([id, k]) => $(id).addEventListener("input", () => { E.it[k] = $(id).value; brut(); }));
$("eInici").addEventListener("change", () => {
  E.it.data_inici = $("eInici").value || null;
  if(E.it.data_inici && (!E.it.data_fi || E.it.data_fi < E.it.data_inici)){ $("eFi").value = E.it.data_inici; E.it.data_fi = E.it.data_inici; }
  brut(); pintarDies();
});
$("eFi").addEventListener("change", () => { E.it.data_fi = $("eFi").value || null; brut(); pintarDies(); });
$("ePers").addEventListener("input", () => { E.it.num_persones = Math.max(1, Math.min(99, parseInt($("ePers").value) || 1)); brut(); });
document.querySelectorAll("input[name=eIdioma]").forEach(r => r.onchange = () => { E.it.idioma = r.value; brut(); pintarAvisos(); });
$("eMostrar").onchange = () => { E.it.mostrar_preus = $("eMostrar").checked; brut(); };

/* ---------- informació important ---------- */
const PH_INFO = {
  inclou: ["Un concepte per línia. Ex.:\nVols d'anada i tornada\n7 nits d'hotel amb esmorzar", "Un concepto por línea. Ej.:\nVuelos de ida y vuelta\n7 noches de hotel con desayuno"],
  no_inclou: ["Un concepte per línia. Ex.:\nTaxes turístiques locals\nÀpats no especificats", "Un concepto por línea. Ej.:\nTasas turísticas locales\nComidas no especificadas"],
  documentacio: ["Ex.: Passaport amb una validesa mínima de 6 mesos. Visat electrònic…", "Ej.: Pasaporte con una validez mínima de 6 meses. Visado electrónico…"],
  pagament: ["Ex.: 30% a la reserva i la resta 30 dies abans de la sortida. Transferència o targeta.", "Ej.: 30% en la reserva y el resto 30 días antes de la salida. Transferencia o tarjeta."],
  cancelacio: ["Ex.: Fins a 45 dies abans: 10%. De 44 a 15 dies: 50%…", "Ej.: Hasta 45 días antes: 10%. De 44 a 15 días: 50%…"],
  altres: ["Qualsevol altra informació útil", "Cualquier otra información útil"]
};
function pintarInfo(){
  $("infoEd").innerHTML = IT.INFO.map(a => `<div class="camp">
    <div class="cap-camp"><label>${a.ico} ${esc(a[LANG] || a.ca)}</label>${a.k === "inclou" ? `<button type="button" class="ia" id="btnOmplirInclou">↧ ${L("Omplir amb els serveis", "Rellenar con los servicios")}</button>` : ""}</div>
    <textarea data-info="${a.k}" placeholder="${esc(L(...PH_INFO[a.k]))}">${esc(IT.valorInfo(E.it, a.k))}</textarea></div>`).join("");
  $("infoEd").querySelectorAll("[data-info]").forEach(ta => ta.addEventListener("input", () => {
    if(ta.dataset.info === "altres") E.it.notes = ta.value; else E.it.info[ta.dataset.info] = ta.value;
    brut();
  }));
  $("btnOmplirInclou").onclick = () => {
    const ta = $("infoEd").querySelector('[data-info="inclou"]');
    const ordre = [null, ...E.dies.map(d => d.id)];
    const opc = E.it.idioma === "es" ? " (opcional)" : " (opcional)";
    const l = ordre.flatMap(did => serveisDe(did)).filter(s => IT.nomServei(s).trim()).map(s => IT.nomServei(s).trim() + (s.opcional ? opc : ""));
    if(!l.length){ toast(L("Encara no hi ha serveis", "Todavía no hay servicios")); return; }
    if(ta.value.trim() && !confirm(L("Substituir el que ja hi ha escrit?", "¿Sustituir lo que ya hay escrito?"))) return;
    ta.value = [...new Set(l)].join("\n"); E.it.info.inclou = ta.value; brut();
  };
  pintarAvisos();
}
function pintarAvisos(){
  $("avisosEd").innerHTML = `<strong style="font-size:12px">${L("Surt sempre al final (no cal escriure-ho):", "Sale siempre al final (no hace falta escribirlo):")}</strong>` +
    (IT.AVISOS[E.it.idioma] || IT.AVISOS.ca).map(x => `<p>${esc(x)}</p>`).join("");
}

/* ---------- imatges ---------- */
let destiImg = null;
function triarImatge(callback){ destiImg = callback; $("fImg").value = ""; $("fImg").click(); }
$("fImg").onchange = async () => {
  const f = $("fImg").files[0]; if(!f || !destiImg) return;
  toast(L("Pujant la foto…", "Subiendo la foto…"));
  try{
    const blob = await reduirImatge(f);
    const ruta = `${USER.id}/${uuid()}.jpg`;
    const { error } = await sb.storage.from("it-imatges").upload(ruta, blob, { contentType: "image/jpeg" });
    if(error) throw error;
    destiImg(sb.storage.from("it-imatges").getPublicUrl(ruta).data.publicUrl);
    brut(); toast(L("Foto afegida", "Foto añadida"));
  }catch(e){ toast(L("No s'ha pogut pujar la foto", "No se ha podido subir la foto")); }
};
function reduirImatge(f){
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => {
      const max = 1600, r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => b ? ok(b) : ko(), "image/jpeg", 0.82);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = ko;
    img.src = URL.createObjectURL(f);
  });
}
function pintarPortada(){
  const u = E.it.imatge_portada;
  $("imgPortada").classList.toggle("amagat", !u); if(u) $("imgPortada").src = u;
  $("btnTreurePortada").classList.toggle("amagat", !u);
}
$("btnPortada").onclick = () => triarImatge(u => { E.it.imatge_portada = u; pintarPortada(); });
$("btnTreurePortada").onclick = () => { E.it.imatge_portada = null; pintarPortada(); brut(); };

/* ---------- dies ---------- */
function numDiesDates(){
  if(!E.it.data_inici || !E.it.data_fi) return 0;
  return Math.round((new Date(E.it.data_fi + "T12:00:00") - new Date(E.it.data_inici + "T12:00:00")) / 86400000) + 1;
}
function pintarDies(){
  E.dies.sort((a, b) => a.ordre - b.ordre);
  const n = numDiesDates();
  $("btnDiesDates").classList.toggle("amagat", !(n > 0 && n <= 60 && E.dies.length < n));
  $("btnDiesDates").textContent = E.dies.length ? `📅 ${L(`Completar fins a ${n} dies (segons les dates)`, `Completar hasta ${n} días (según las fechas)`)}`
    : `📅 ${L(`Crear els ${n} dies segons les dates`, `Crear los ${n} días según las fechas`)}`;
  if(!E.dies.length){ $("dies").innerHTML = `<div class="buit" style="margin-bottom:12px">${L("Encara no hi ha dies.", "Todavía no hay días.")}</div>`; return; }
  $("dies").innerHTML = E.dies.map((d, i) => `
    <div class="dia-ed" data-dia="${d.id}">
      <div class="dia-ed-cap">
        <div><b>${L("Dia", "Día")} ${i + 1}</b> ${E.it.data_inici ? `<span class="meta">· ${esc(IT.dataDia(E.it.data_inici, i, LANG))}</span>` : ""}</div>
        <div class="fila-botons" style="gap:4px">
          <button class="mini" type="button" data-dpuja="${d.id}" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="mini" type="button" data-dbaixa="${d.id}" ${i === E.dies.length - 1 ? "disabled" : ""}>↓</button>
          <button class="mini perill" type="button" data-desb="${d.id}">🗑</button>
        </div>
      </div>
      <div class="dia-ed-cos">
        <div class="camp"><label>${L("Títol del dia", "Título del día")}</label><input data-dc="titol" value="${esc(d.titol)}" placeholder="${L("Ex.: Arribada a Tòquio", "Ej.: Llegada a Tokio")}"></div>
        <div data-llista-abans="${d.id}" style="margin-bottom:10px">${serveisDe(d.id).filter(esAbans).map(htmlSrvEd).join("")}</div>
        <div class="camp"><div class="cap-camp"><label>${L("Què faran", "Qué harán")}</label><button type="button" class="ia" data-ia-dia="${d.id}">✨ ${L("Redactar amb IA", "Redactar con IA")}</button></div>
          <textarea data-dc="descripcio" placeholder="${L("Explicació del dia (pots escriure quatre notes i prémer «Redactar amb IA»)", "Explicación del día (puedes escribir cuatro notas y pulsar «Redactar con IA»)")}">${esc(d.descripcio)}</textarea></div>
        <div data-llista-srv="${d.id}">${serveisDe(d.id).filter(s => !esAbans(s)).map(htmlSrvEd).join("")}</div>
        <div class="fila-botons" style="margin-top:10px">
          <button class="boto sec petit" type="button" data-nou-srv="${d.id}">➕ ${L("Servei", "Servicio")}</button>
          <button class="boto sec petit" type="button" data-bib-srv="${d.id}">📚 ${L("De la biblioteca", "De la biblioteca")}</button>
        </div>
      </div>
    </div>`).join("");
  lligarDies();
}
function pintarGenerals(){
  $("generals").innerHTML = serveisDe(null).map(htmlSrvEd).join("");
  lligarServeis($("generals"));
}
function lligarDies(){
  const c = $("dies");
  c.querySelectorAll("[data-dia]").forEach(box => {
    const d = E.dies.find(x => x.id === box.dataset.dia);
    box.querySelectorAll(":scope > .dia-ed-cos > .camp [data-dc]").forEach(inp => inp.addEventListener("input", () => { d[inp.dataset.dc] = inp.value; brut(); }));
  });
  c.querySelectorAll("[data-dpuja]").forEach(b => b.onclick = () => moureDia(b.dataset.dpuja, -1));
  c.querySelectorAll("[data-dbaixa]").forEach(b => b.onclick = () => moureDia(b.dataset.dbaixa, 1));
  c.querySelectorAll("[data-desb]").forEach(b => b.onclick = () => {
    const n = serveisDe(b.dataset.desb).length;
    if(!confirm(n ? L(`S'esborrarà el dia i els seus ${n} serveis. Continuar?`, `Se borrará el día y sus ${n} servicios. ¿Continuar?`) : L("Esborrar aquest dia?", "¿Borrar este día?"))) return;
    E.dies = E.dies.filter(x => x.id !== b.dataset.desb);
    E.serveis = E.serveis.filter(s => s.dia_id !== b.dataset.desb);
    renumerar(E.dies); pintarDies(); brut();
  });
  c.querySelectorAll("[data-ia-dia]").forEach(b => b.onclick = () => iaDia(b));
  lligarServeis(c);
}
function renumerar(arr){ arr.forEach((x, i) => x.ordre = i + 1); }
function moureDia(id, dir){
  const i = E.dies.findIndex(x => x.id === id), j = i + dir;
  if(j < 0 || j >= E.dies.length) return;
  [E.dies[i], E.dies[j]] = [E.dies[j], E.dies[i]];
  renumerar(E.dies); pintarDies(); brut();
}
function nouDia(titol = ""){ E.dies.push({ id: uuid(), itinerari_id: E.it.id, ordre: E.dies.length + 1, titol, descripcio: "" }); }
$("btnDia").onclick = () => {
  nouDia(); pintarDies(); brut();
  const ult = $("dies").lastElementChild; if(ult){ ult.scrollIntoView({ behavior: "smooth", block: "center" }); ult.querySelector("input").focus(); }
};
$("btnDiesDates").onclick = () => { const n = numDiesDates(); while(E.dies.length < n) nouDia(); pintarDies(); brut(); };

/* ---------- serveis ---------- */
const serveisDe = diaId => E.serveis.filter(s => (s.dia_id || null) === (diaId || null)).sort((a, b) => a.ordre - b.ordre);
function resumPreu(s){
  if(!s.preu) return L("sense preu", "sin precio");
  return euros(s.preu, LANG) + (s.preu_unitat === "grup" ? " total" : " /pers.");
}
function htmlSrvEd(s){
  const tp = IT.TIPUS[s.tipus] || IT.TIPUS.altre;
  const germans = serveisDe(s.dia_id).filter(x => esAbans(x) === esAbans(s)), i = germans.findIndex(x => x.id === s.id);
  const nomPh = s.tipus === "vol" ? L("Si el deixes buit, surt la ruta", "Si lo dejas vacío, sale la ruta")
    : s.tipus === "hotel" ? L("Ex.: Hotel Gracery Shinjuku", "Ej.: Hotel Gracery Shinjuku") : L("Ex.: Excursió a Nara", "Ej.: Excursión a Nara");
  return `<details class="srv" data-srv="${s.id}" ${s._obert ? "open" : ""}>
    <summary><span>${tp.ico}</span><span class="n">${esc(IT.nomServei(s) || L("(servei nou)", "(servicio nuevo)"))}</span>
      ${s.opcional ? `<span class="etiq opc">${L("Opcional", "Opcional")}</span>` : ""}<span class="p">${esc(resumPreu(s))}</span></summary>
    <div class="srv-cos">
      <div class="graella">
        <div><label>${L("Tipus", "Tipo")}</label><select data-sc="tipus">${tipusOpc().replace(`value="${s.tipus}"`, `value="${s.tipus}" selected`)}</select></div>
        <div><label>${L("Nom", "Nombre")}${s.tipus === "vol" ? ` <span class="opc">${L("(opcional, ex.: Vol d'anada)", "(opcional, ej.: Vuelo de ida)")}</span>` : ""}</label><input data-sc="nom" value="${esc(s.nom)}" placeholder="${esc(nomPh)}"></div>
        ${s.tipus === "vol" ? htmlVolEd(s) : ""}
        ${s.tipus === "hotel" ? htmlHotelEd(s) : ""}
        ${s.tipus === "excursio" || s.tipus === "trasllat" ? `<div><label>${s.tipus === "trasllat" ? L("Hora de recollida", "Hora de recogida") : L("Hora d'inici", "Hora de inicio")}</label><input data-ex="hora" type="time" value="${esc((s.extra || {}).hora || "")}"></div><div></div>` : ""}
        ${IT.TOT_VIATGE.includes(s.tipus) ? htmlTotViatgeEd(s) : ""}
        <div class="ample"><label>${s.tipus === "vol" ? L("Notes", "Notas") : L("Detalls", "Detalles")} <span class="opc">(${s.tipus === "vol" ? L("opcional, ex.: escala a Doha", "opcional, ej.: escala en Doha") : L("horaris, habitació… surten en petit", "horarios, habitación… salen en pequeño")})</span></label><input data-sc="detalls" value="${esc(s.detalls)}" placeholder="${s.tipus === "hotel" ? L("Ex.: 3 nits · Habitació doble", "Ej.: 3 noches · Habitación doble") : ""}"></div>
        ${s.tipus === "vol" ? "" : `<div class="ample"><div class="cap-camp"><label>${L("Descripció", "Descripción")}</label><button type="button" class="ia" data-ia-srv="${s.id}">✨ ${L("Redactar amb IA", "Redactar con IA")}</button></div>
          <textarea data-sc="descripcio" placeholder="${L("Opcional", "Opcional")}">${esc(s.descripcio)}</textarea></div>`}
        <div><label>${L("Preu (€)", "Precio (€)")}</label><input data-sc="preu" type="number" min="0" step="0.01" inputmode="decimal" value="${s.preu || ""}" placeholder="0,00"></div>
        <div><label>${L("El preu és…", "El precio es…")}</label><select data-sc="preu_unitat">
          <option value="persona" ${s.preu_unitat !== "grup" ? "selected" : ""}>${L("Per persona", "Por persona")}</option>
          <option value="grup" ${s.preu_unitat === "grup" ? "selected" : ""}>${L("Total per a tot el grup", "Total para todo el grupo")}</option></select></div>
        <div class="ample"><label class="check"><input type="checkbox" data-sc="opcional" ${s.opcional ? "checked" : ""}> <span>${L("És <strong>opcional</strong> <span class=\"opc\">(el client el pot treure; per defecte surt inclòs)</span>", "Es <strong>opcional</strong> <span class=\"opc\">(el cliente lo puede quitar; por defecto sale incluido)</span>")}</span></label></div>
        <div class="ample ${s.opcional ? "" : "amagat"}" data-mode-opc>
          <div class="opcions">
            <label><input type="radio" name="m_${s.id}" value="grup" ${!s.opcional_per_persones ? "checked" : ""}> ${L("Es treu per a tot el grup", "Se quita para todo el grupo")}</label>
            <label><input type="radio" name="m_${s.id}" value="persones" ${s.opcional_per_persones ? "checked" : ""}> ${L("El client tria per a quantes persones", "El cliente elige para cuántas personas")}</label>
          </div></div>
        <div class="ample"><label>${L("Foto", "Foto")} <span class="opc">(${L("opcional", "opcional")})</span></label>
          <div class="fila-botons"><button class="boto sec petit" type="button" data-sfoto>📷 ${s.imatge_url ? L("Canviar foto", "Cambiar foto") : L("Pujar foto", "Subir foto")}</button>
          ${s.imatge_url ? `<button class="boto perill petit" type="button" data-streufoto>${L("Treure", "Quitar")}</button>` : ""}</div>
          ${s.imatge_url ? `<img class="img-prev" src="${esc(s.imatge_url)}" alt="">` : ""}</div>
      </div>
      <div class="graella" style="margin-top:10px">
        ${s.dia_id ? `<div><label>${L("On surt dins del dia", "Dónde sale dentro del día")}</label><select data-pos>
          <option value="despres" ${esAbans(s) ? "" : "selected"}>${L("Després del text del dia", "Después del texto del día")}</option>
          <option value="abans" ${esAbans(s) ? "selected" : ""}>${L("Abans del text del dia", "Antes del texto del día")}</option></select></div>` : ""}
        <div class="${s.dia_id ? "" : "ample"}"><label>${L("Moure a", "Mover a")}</label><select data-mou>
          <option value="" ${s.dia_id ? "" : "selected"}>${L("Tot el viatge", "Todo el viaje")}</option>
          ${E.dies.map((d, n) => `<option value="${d.id}" ${s.dia_id === d.id ? "selected" : ""}>${L("Dia", "Día")} ${n + 1}${d.titol ? " · " + esc(d.titol.slice(0, 30)) : ""}</option>`).join("")}
        </select></div>
      </div>
      <div class="fila-botons" style="margin-top:12px;justify-content:space-between">
        <div class="fila-botons" style="gap:4px">
          <button class="mini" type="button" data-spuja ${i <= 0 && (!s.dia_id || esAbans(s)) ? "disabled" : ""} title="${L("Pujar", "Subir")}">↑</button>
          <button class="mini" type="button" data-sbaixa ${i >= germans.length - 1 && (!s.dia_id || !esAbans(s)) ? "disabled" : ""} title="${L("Baixar", "Bajar")}">↓</button>
          <button class="mini" type="button" data-sdup title="${L("Duplicar", "Duplicar")}">⧉</button>
          <button class="mini perill" type="button" data-sesb>🗑 ${L("Esborrar", "Borrar")}</button>
        </div>
        <button class="boto sec petit" type="button" data-sbib>📚 ${L("Desar a la biblioteca", "Guardar en la biblioteca")}</button>
      </div>
    </div></details>`;
}
const esAbans = s => !!(s.extra && s.extra.abans);
function repintarLlistaSrv(diaId){
  if(!diaId){ pintarGenerals(); return; }
  const a = document.querySelector(`[data-llista-abans="${diaId}"]`), c = document.querySelector(`[data-llista-srv="${diaId}"]`);
  if(!a || !c) return;
  a.innerHTML = serveisDe(diaId).filter(esAbans).map(htmlSrvEd).join("");
  c.innerHTML = serveisDe(diaId).filter(s => !esAbans(s)).map(htmlSrvEd).join("");
  lligarServeis(a); lligarServeis(c);
}
// Mou un servei a un altre dia (o a "tot el viatge" si diaId és null)
function moureADia(s, diaId){
  const abans = s.dia_id || null;
  if(abans === (diaId || null)) return;
  s.extra = s.extra || {};
  if(!diaId){
    if(IT.TOT_VIATGE.includes(s.tipus)){ s.extra.tot_viatge = true; s.extra.dia_original = abans; }
    delete s.extra.abans;
  } else {
    delete s.extra.tot_viatge; delete s.extra.dia_original;
    if(s.tipus === "vol"){ const i = E.dies.findIndex(d => d.id === diaId); if(i === 0) s.extra.abans = true; else if(i === E.dies.length - 1) delete s.extra.abans; }
  }
  s.dia_id = diaId || null; s.ordre = 999; s._obert = true;
  renumerar(serveisDe(abans)); renumerar(serveisDe(s.dia_id));
  repintarLlistaSrv(abans); repintarLlistaSrv(s.dia_id);
  brut(); toast(L("Servei mogut", "Servicio movido"));
}
function lligarServeis(cont){
  cont.querySelectorAll("details.srv").forEach(det => {
    if(det.dataset.lligat) return; det.dataset.lligat = 1;
    const s = E.serveis.find(x => x.id === det.dataset.srv);
    det.addEventListener("toggle", () => { s._obert = det.open; });
    const resum = () => {
      det.querySelector("summary .n").textContent = IT.nomServei(s) || L("(servei nou)", "(servicio nuevo)");
      det.querySelector("summary .p").textContent = resumPreu(s);
      det.querySelector("summary span").textContent = (IT.TIPUS[s.tipus] || IT.TIPUS.altre).ico;
    };
    det.querySelectorAll("[data-sc]").forEach(inp => {
      const k = inp.dataset.sc;
      const ev = inp.type === "checkbox" || inp.tagName === "SELECT" ? "change" : "input";
      inp.addEventListener(ev, () => {
        if(k === "opcional"){ s.opcional = inp.checked; det.querySelector("[data-mode-opc]").classList.toggle("amagat", !s.opcional); repintarLlistaSrv(s.dia_id); }
        else if(k === "preu") s.preu = Math.max(0, parseFloat(String(inp.value).replace(",", ".")) || 0);
        else s[k] = inp.value;
        if(k === "tipus"){
          s.extra = s.extra || {};
          if(s.tipus === "vol" && !s.extra.data) s.extra.data = isoDia(s.dia_id);
          if(s.tipus === "vol" && s.dia_id && E.dies.length && E.dies[0].id === s.dia_id && s.extra.abans === undefined) s.extra.abans = true;
          if(!IT.TOT_VIATGE.includes(s.tipus) && s.extra.tot_viatge){ treureTotViatge(s); pintarGenerals(); }
          s._obert = true; repintarLlistaSrv(s.dia_id); brut(); return;
        }
        if(k !== "opcional") resum();
        brut();
      });
    });
    det.querySelectorAll(`input[name="m_${s.id}"]`).forEach(r => r.onchange = () => { s.opcional_per_persones = r.value === "persones"; brut(); });
    det.querySelector("[data-sfoto]").onclick = () => triarImatge(u => { s.imatge_url = u; repintarLlistaSrv(s.dia_id); });
    const tf = det.querySelector("[data-streufoto]"); if(tf) tf.onclick = () => { s.imatge_url = null; repintarLlistaSrv(s.dia_id); brut(); };
    det.querySelector("[data-spuja]").onclick = () => moureSrv(s, -1);
    det.querySelector("[data-sbaixa]").onclick = () => moureSrv(s, 1);
    det.querySelector("[data-sdup]").onclick = () => {
      const c = { ...s, extra: { ...(s.extra || {}) }, id: uuid(), _obert: true, nom: s.nom ? s.nom + L(" (còpia)", " (copia)") : "", ordre: s.ordre + 0.5 };
      E.serveis.push(c); renumerar(serveisDe(s.dia_id)); repintarLlistaSrv(s.dia_id); brut();
    };
    det.querySelector("[data-sesb]").onclick = () => {
      if(!confirm(L(`Esborrar «${s.nom || "servei"}»?`, `¿Borrar «${s.nom || "servicio"}»?`))) return;
      E.serveis = E.serveis.filter(x => x.id !== s.id); renumerar(serveisDe(s.dia_id)); repintarLlistaSrv(s.dia_id); brut();
    };
    det.querySelector("[data-sbib]").onclick = () => desarABib(s);
    const bia = det.querySelector("[data-ia-srv]"); if(bia) bia.onclick = e => iaServei(e.currentTarget, s, det);
    const sp = det.querySelector("[data-pos]");
    if(sp) sp.onchange = () => { s.extra = s.extra || {}; if(sp.value === "abans") s.extra.abans = true; else delete s.extra.abans; s._obert = true; repintarLlistaSrv(s.dia_id); brut(); };
    det.querySelector("[data-mou]").onchange = e => moureADia(s, e.target.value || null);
    lligarExtra(det, s, resum);
  });
  cont.querySelectorAll("[data-nou-srv]").forEach(b => { if(b.dataset.lligat) return; b.dataset.lligat = 1; b.onclick = () => nouServei(b.dataset.nouSrv || null); });
  cont.querySelectorAll("[data-bib-srv]").forEach(b => { if(b.dataset.lligat) return; b.dataset.lligat = 1; b.onclick = () => obrirDlgBib(b.dataset.bibSrv || null); });
}
// botons de la secció "tot el viatge" (fora de #generals)
document.querySelectorAll("#panEditor > .targeta > .fila-botons [data-nou-srv], #panEditor > .targeta > .fila-botons [data-bib-srv]").forEach(b => {
  b.dataset.lligat = 1;
  if(b.hasAttribute("data-nou-srv")) b.onclick = () => nouServei(null); else b.onclick = () => obrirDlgBib(null);
});

/* ---------- camps de vol i allotjament ---------- */
function isoDia(diaId){
  if(!diaId || !E.it.data_inici) return "";
  const i = E.dies.findIndex(d => d.id === diaId); if(i < 0) return "";
  const d = new Date(E.it.data_inici + "T12:00:00"); d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
}
function htmlVolEd(s){
  const e = s.extra || {};
  return `<div class="ample bloc-tipus">
    <div class="graella">
      <div><label>${L("Número de vol", "Número de vuelo")}</label><div style="display:flex;gap:6px"><input data-ex="numero" value="${esc(e.numero || "")}" placeholder="${L("Ex.: VY1234", "Ej.: VY1234")}" style="text-transform:uppercase">
        <button type="button" class="boto sec petit" data-buscavol title="${L("Buscar horari i companyia", "Buscar horario y compañía")}">🔎</button></div></div>
      <div><label>${L("Companyia", "Compañía")}</label><input data-ex="companyia" value="${esc(e.companyia || "")}" placeholder="${L("Ex.: Vueling", "Ej.: Vueling")}"></div>
      <div><label>${L("Data del vol", "Fecha del vuelo")}</label><input data-ex="data" type="date" value="${esc(e.data || "")}"></div>
      <div></div>
      <div><label>${L("Origen", "Origen")}</label><input data-ex="origen" value="${esc(e.origen || "")}" placeholder="${L("Ex.: Barcelona (BCN)", "Ej.: Barcelona (BCN)")}"></div>
      <div><label>${L("Destí", "Destino")}</label><input data-ex="desti" value="${esc(e.desti || "")}" placeholder="${L("Ex.: Roma (FCO)", "Ej.: Roma (FCO)")}"></div>
      <div><label>${L("Hora de sortida", "Hora de salida")}</label><input data-ex="sortida" type="time" value="${esc(e.sortida || "")}"></div>
      <div><label>${L("Hora d'arribada", "Hora de llegada")}</label><input data-ex="arribada" type="time" value="${esc(e.arribada || "")}"></div>
      <div class="ample"><label class="check"><input type="checkbox" data-ex="data_arribada" ${e.data_arribada ? "checked" : ""}> <span>${L("Arriba l'endemà (+1)", "Llega al día siguiente (+1)")}</span></label></div>
      <div><label class="check"><input type="checkbox" data-ex="cabina" ${e.cabina ? "checked" : ""}> <span>🎒 ${L("Inclou maleta de cabina", "Incluye maleta de cabina")}</span></label>
        <div class="kg ${e.cabina ? "" : "amagat"}"><input data-ex="cabina_kg" type="number" min="0" max="50" inputmode="numeric" value="${esc(e.cabina_kg || "")}" placeholder="kg"> kg</div></div>
      <div><label class="check"><input type="checkbox" data-ex="facturada" ${e.facturada ? "checked" : ""}> <span>🧳 ${L("Inclou maleta facturada", "Incluye maleta facturada")}</span></label>
        <div class="kg ${e.facturada ? "" : "amagat"}"><input data-ex="facturada_kg" type="number" min="0" max="50" inputmode="numeric" value="${esc(e.facturada_kg || "")}" placeholder="kg"> kg</div></div>
    </div></div>`;
}
function htmlHotelEd(s){
  const e = s.extra || {};
  const opc = (obj, val) => `<option value="">—</option>` + Object.entries(obj).map(([k, v]) => `<option value="${k}" ${val === k ? "selected" : ""}>${esc(v[LANG] || v.ca)}</option>`).join("");
  return `<div class="ample bloc-tipus"><div class="graella">
      <div><label>${L("Tipus d'allotjament", "Tipo de alojamiento")}</label><select data-ex="allotjament">${opc(IT.ALLOTJAMENTS, e.allotjament || "")}</select></div>
      <div><label>${L("Categoria", "Categoría")}</label><select data-ex="estrelles"><option value="">—</option>${[1,2,3,4,5].map(n => `<option value="${n}" ${Number(e.estrelles) === n ? "selected" : ""}>${"★".repeat(n)}</option>`).join("")}</select></div>
      <div class="ample"><label>${L("Règim", "Régimen")}</label><select data-ex="regim">${opc(IT.REGIMS, e.regim || "")}</select></div>
    </div></div>`;
}
function htmlTotViatgeEd(s){
  const e = s.extra || {};
  const txt = s.tipus === "hotel"
    ? L(`Mateix allotjament per a tot l'itinerari <span class="opc">(surt a tots els dies)</span>`, `Mismo alojamiento para todo el itinerario <span class="opc">(sale en todos los días)</span>`)
    : L(`És per a tot el viatge <span class="opc">(no és d'un dia concret; surt a «Serveis del viatge»)</span>`, `Es para todo el viaje <span class="opc">(no es de un día concreto; sale en «Servicios del viaje»)</span>`);
  return `<div class="ample"><label class="check"><input type="checkbox" data-ex="tot_viatge" ${e.tot_viatge ? "checked" : ""}> <span>${txt}</span></label></div>`;
}
function treureTotViatge(s){
  const e = s.extra || {};
  const tornar = E.dies.find(d => d.id === e.dia_original) || E.dies[0];
  delete e.tot_viatge; delete e.dia_original;
  s.dia_id = tornar ? tornar.id : null; s.ordre = 999;
  renumerar(serveisDe(s.dia_id));
}
function lligarExtra(det, s, resum){
  s.extra = s.extra || {};
  det.querySelectorAll("[data-ex]").forEach(inp => {
    const k = inp.dataset.ex;
    inp.addEventListener(inp.type === "checkbox" || inp.tagName === "SELECT" ? "change" : "input", () => {
      if(k === "tot_viatge"){
        const abans = s.dia_id;
        if(inp.checked){ s.extra.tot_viatge = true; s.extra.dia_original = s.dia_id; s.dia_id = null; s.ordre = 999; renumerar(serveisDe(null)); }
        else treureTotViatge(s);
        s._obert = true; if(abans) repintarLlistaSrv(abans); repintarLlistaSrv(s.dia_id); if(s.dia_id) pintarGenerals();
        brut(); toast(inp.checked ? L("Mogut a «Serveis de tot el viatge»", "Movido a «Servicios de todo el viaje»") : L("Tornat al dia", "Devuelto al día")); return;
      }
      let v = inp.type === "checkbox" ? inp.checked : inp.value;
      if(k === "numero") v = String(v).toUpperCase().replace(/\s+/g, "");
      if(k === "estrelles") v = v ? Number(v) : null;
      if(v === "" || v === null || v === false) delete s.extra[k]; else s.extra[k] = v;
      if(k === "cabina" || k === "facturada") det.querySelector(`[data-ex="${k}_kg"]`).closest(".kg").classList.toggle("amagat", !inp.checked);
      resum(); brut();
    });
  });
  const bv = det.querySelector("[data-buscavol]");
  if(bv) bv.onclick = () => buscarVol(s, bv);
}
async function buscarVol(s, boto){
  const e = s.extra;
  if(!e.numero){ toast(L("Escriu el número de vol", "Escribe el número de vuelo")); return; }
  const data = e.data || isoDia(s.dia_id);
  if(!data){ toast(L("Posa la data del vol", "Pon la fecha del vuelo")); return; }
  boto.disabled = true; boto.textContent = "…";
  try{
    const { data: r, error } = await sb.functions.invoke("it-vol", { body: { numero: e.numero, data } });
    if(error) throw error;
    if(r.error === "FALTA_CLAU"){ alert(L("La cerca de vols encara no està activada. Omple les dades a mà.", "La búsqueda de vuelos todavía no está activada. Rellena los datos a mano.")); return; }
    if(r.error === "NO_TROBAT"){ toast(L("No s'ha trobat aquest vol en aquesta data. Omple-ho a mà.", "No se ha encontrado este vuelo en esta fecha. Rellénalo a mano.")); return; }
    if(r.error) throw new Error(r.error);
    Object.assign(e, { data, numero: r.numero || e.numero, companyia: r.companyia || e.companyia,
      origen: r.origen ? (r.origen_nom ? `${r.origen_nom} (${r.origen})` : r.origen) : e.origen,
      desti: r.desti ? (r.desti_nom ? `${r.desti_nom} (${r.desti})` : r.desti) : e.desti,
      sortida: r.sortida || e.sortida, arribada: r.arribada || e.arribada });
    if(r.data_arribada) e.data_arribada = true; else delete e.data_arribada;
    s._obert = true; repintarLlistaSrv(s.dia_id); brut(); toast(L("Dades del vol omplertes ✈️", "Datos del vuelo rellenados ✈️"));
  }catch(err){ toast(L("No s'ha pogut buscar el vol", "No se ha podido buscar el vuelo")); }
  finally{ boto.disabled = false; boto.textContent = "🔎"; }
}
function moureSrv(s, dir){
  const g = serveisDe(s.dia_id).filter(x => esAbans(x) === esAbans(s)), i = g.findIndex(x => x.id === s.id), j = i + dir;
  // Dins d'un dia, les fletxes poden passar el servei per sobre o per sota del text del dia
  if(s.dia_id && j < 0 && !esAbans(s)){
    s.extra = s.extra || {}; s.extra.abans = true; s.ordre = 9999; s._obert = true;
    renumerar(serveisDe(s.dia_id).filter(esAbans)); renumerar(serveisDe(s.dia_id).filter(x => !esAbans(x)));
    repintarLlistaSrv(s.dia_id); brut(); toast(L("Ara surt abans del text del dia", "Ahora sale antes del texto del día")); return;
  }
  if(s.dia_id && j >= g.length && esAbans(s)){
    delete s.extra.abans; s.ordre = -1; s._obert = true;
    renumerar(serveisDe(s.dia_id).filter(esAbans)); renumerar(serveisDe(s.dia_id).filter(x => !esAbans(x)));
    repintarLlistaSrv(s.dia_id); brut(); toast(L("Ara surt després del text del dia", "Ahora sale después del texto del día")); return;
  }
  if(j < 0 || j >= g.length) return;
  [g[i], g[j]] = [g[j], g[i]]; renumerar(g); repintarLlistaSrv(s.dia_id); brut();
}
function nouServei(diaId, base = {}){
  const s = { id: uuid(), itinerari_id: E.it.id, dia_id: diaId, ordre: serveisDe(diaId).length + 1, tipus: "altre", nom: "", descripcio: "", detalls: "",
    preu: 0, preu_unitat: "persona", opcional: false, opcional_per_persones: false, imatge_url: null, extra: {}, _obert: true, ...base };
  E.serveis.push(s); repintarLlistaSrv(diaId); brut();
  const el = document.querySelector(`[data-srv="${s.id}"]`);
  if(el){ el.scrollIntoView({ behavior: "smooth", block: "center" }); const n = el.querySelector('[data-sc="nom"]'); if(n && !s.nom) n.focus(); }
}

/* ---------- total ---------- */
function actualitzarTotal(){
  if(!E) return;
  const n = E.it.num_persones || 1;
  const { total, perPersona } = IT.totals(E.serveis, {}, n);
  $("edTotal").textContent = euros(total, LANG);
  $("edPP").textContent = `${euros(perPersona, LANG)} ${L("per persona", "por persona")} · ${n} pers.${E.it.mostrar_preus ? "" : L(" · preu ocult al client", " · precio oculto al cliente")}`;
}

/* ---------- desar ---------- */
async function desar(){
  if(!E.it.titol.trim()){ toast(L("Posa el títol del viatge", "Pon el título del viaje")); $("eTitol").focus(); return false; }
  const b = $("btnDesar"); b.disabled = true; b.textContent = L("Desant…", "Guardando…");
  try{
    const it = E.it;
    const fila = { id: it.id, titol: it.titol.trim(), client_nom: it.client_nom.trim(), destinacio: it.destinacio.trim(), data_inici: it.data_inici || null,
      data_fi: it.data_fi || null, num_persones: it.num_persones, idioma: it.idioma, mostrar_preus: it.mostrar_preus,
      introduccio: it.introduccio, notes: it.notes, info: it.info || {}, imatge_portada: it.imatge_portada };
    const r1 = await sb.from("it_itineraris").upsert(fila).select().single();
    if(r1.error) throw r1.error;
    E.it = r1.data;

    renumerar(E.dies);
    const idsDies = E.dies.map(d => d.id), idsSrv = E.serveis.map(s => s.id);
    let q = sb.from("it_serveis").delete().eq("itinerari_id", it.id);
    if(idsSrv.length) q = q.not("id", "in", `(${idsSrv.join(",")})`);
    let r = await q; if(r.error) throw r.error;
    q = sb.from("it_dies").delete().eq("itinerari_id", it.id);
    if(idsDies.length) q = q.not("id", "in", `(${idsDies.join(",")})`);
    r = await q; if(r.error) throw r.error;

    if(E.dies.length){
      r = await sb.from("it_dies").upsert(E.dies.map(d => ({ id: d.id, itinerari_id: it.id, ordre: d.ordre, titol: d.titol, descripcio: d.descripcio })));
      if(r.error) throw r.error;
    }
    if(E.serveis.length){
      [null, ...E.dies.map(d => d.id)].forEach(did => renumerar(serveisDe(did)));
      r = await sb.from("it_serveis").upsert(E.serveis.map(s => ({ id: s.id, itinerari_id: it.id, dia_id: s.dia_id || null, ordre: s.ordre,
        tipus: s.tipus, nom: s.nom, descripcio: s.descripcio, detalls: s.detalls, preu: s.preu || 0, preu_unitat: s.preu_unitat,
        opcional: !!s.opcional, opcional_per_persones: !!s.opcional && !!s.opcional_per_persones, imatge_url: s.imatge_url || null, extra: s.extra || {} })));
      if(r.error) throw r.error;
    }
    const eraNou = E.nou; E.nou = false;
    net(); pintarEnllacos();
    $("activitat").classList.remove("amagat"); $("btnEsborrar").classList.remove("amagat");
    history.replaceState(null, "", "admin.html?e=" + E.it.id);
    toast(eraNou ? L("Desat! Ja pots enviar l'enllaç al client", "¡Guardado! Ya puedes enviar el enlace al cliente") : L("Desat", "Guardado"));
    if(eraNou) carregarActivitat();
    return true;
  }catch(e){
    toast(L("No s'ha pogut desar: ", "No se ha podido guardar: ") + (e.message || e)); return false;
  }finally{ b.disabled = false; b.textContent = L("💾 Desar", "💾 Guardar"); }
}
$("btnDesar").onclick = desar;

/* ---------- documents ---------- */
function pintarDocs(){
  $("docs").innerHTML = E.docs.length ? E.docs.map(d => `<div class="doc-fila"><span>📄 ${esc(d.nom)}</span>
    <span class="fila-botons" style="gap:4px"><button class="mini" type="button" data-dveure="${d.id}">${L("Obrir", "Abrir")}</button>
    <button class="mini perill" type="button" data-desbdoc="${d.id}">🗑</button></span></div>`).join("")
    : `<div class="meta">${L("Cap document.", "Ningún documento.")}</div>`;
  $("docs").querySelectorAll("[data-dveure]").forEach(b => b.onclick = async () => {
    const d = E.docs.find(x => x.id === b.dataset.dveure);
    const w = window.open("", "_blank");
    const { data } = await sb.storage.from("it-documents").createSignedUrl(d.path, 300);
    if(data && w) w.location = data.signedUrl; else if(w) w.close();
  });
  $("docs").querySelectorAll("[data-desbdoc]").forEach(b => b.onclick = async () => {
    const d = E.docs.find(x => x.id === b.dataset.desbdoc);
    if(!confirm(L(`Esborrar «${d.nom}»?`, `¿Borrar «${d.nom}»?`))) return;
    await sb.storage.from("it-documents").remove([d.path]);
    const { error } = await sb.from("it_documents").delete().eq("id", d.id);
    if(error){ toast(L("No s'ha pogut esborrar", "No se ha podido borrar")); return; }
    E.docs = E.docs.filter(x => x.id !== d.id); pintarDocs(); toast(L("Esborrat", "Borrado"));
  });
}
$("btnDoc").onclick = async () => {
  if(E.nou || BRUT){
    if(!confirm(L("Primer cal desar l'itinerari. Vols desar-lo ara?", "Primero hay que guardar el itinerario. ¿Quieres guardarlo ahora?"))) return;
    if(!(await desar())) return;
  }
  $("fDoc").value = ""; $("fDoc").click();
};
$("fDoc").onchange = async () => {
  const f = $("fDoc").files[0]; if(!f) return;
  if(f.size > 20 * 1024 * 1024){ toast(L("El document és massa gran (màxim 20 MB)", "El documento es demasiado grande (máximo 20 MB)")); return; }
  toast(L("Pujant el document…", "Subiendo el documento…"));
  const net_ = f.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
  const ruta = `${USER.id}/${E.it.id}/${uuid()}-${net_}`;
  const { error } = await sb.storage.from("it-documents").upload(ruta, f, { contentType: f.type || "application/octet-stream" });
  if(error){ toast(L("No s'ha pogut pujar", "No se ha podido subir")); return; }
  const { data, error: e2 } = await sb.from("it_documents").insert({ itinerari_id: E.it.id, nom: f.name, path: ruta }).select().single();
  if(e2){ toast(L("No s'ha pogut desar", "No se ha podido guardar")); return; }
  E.docs.push(data); pintarDocs(); toast(L("Document afegit", "Documento añadido"));
};

/* ---------- activitat ---------- */
async function carregarActivitat(){
  if(!E || E.nou) return;
  const id = E.it.id;
  const [{ data: evs }, { data: it }] = await Promise.all([
    sb.from("it_events").select("*").eq("itinerari_id", id).order("created_at", { ascending: false }).limit(300),
    sb.from("it_itineraris").select("seleccio,seleccio_at").eq("id", id).single()
  ]);
  if(!E || E.it.id !== id) return;
  const sel = (it && it.seleccio) || {};
  const oberts = (evs || []).filter(e => e.tipus === "obert");
  const n = E.it.num_persones;
  const opc = E.serveis.filter(s => s.opcional);
  const tCli = IT.totals(E.serveis, sel, n);
  const cops = x => x === 1 ? L("cop", "vez") : L("cops", "veces");
  let h = `<div class="stats">
    ${oberts.length ? `<span class="xip verd">👁 ${L("L'ha obert", "Lo ha abierto")} ${oberts.length} ${cops(oberts.length)}</span><span class="xip">${L("Últim", "Último")}: ${esc(quan(oberts[0].created_at))}</span>` : `<span class="xip">👁 ${L("Encara no l'ha obert", "Todavía no lo ha abierto")}</span>`}
    ${(evs || []).some(e => e.tipus === "pdf") ? `<span class="xip">📄 ${L("Ha descarregat el PDF", "Ha descargado el PDF")}</span>` : ""}
  </div>`;
  if(opc.length){
    h += `<h3>${L("La seva tria d'opcionals ara mateix", "Su elección de opcionales ahora mismo")}</h3>` + opc.map(s => {
      const e = IT.estatOpcional(s, sel, n);
      const txt = s.opcional_per_persones ? (e.persones ? `✅ ${L("per a", "para")} ${e.persones} ${L("de", "de")} ${n}` : `❌ ${L("tret", "quitado")}`) : (e.actiu ? `✅ ${L("inclòs", "incluido")}` : `❌ ${L("tret", "quitado")}`);
      return `<div class="doc-fila"><span>${(IT.TIPUS[s.tipus] || IT.TIPUS.altre).ico} ${esc(IT.nomServei(s))}</span><strong style="font-size:14px">${txt}</strong></div>`;
    }).join("");
    h += `<p class="meta" style="margin-top:10px">${L("Total amb la seva tria", "Total con su elección")}: <strong>${esc(euros(tCli.total, LANG))}</strong> (${esc(euros(tCli.perPersona, LANG))}/pers.)</p>`;
  }
  $("actResum").innerHTML = h;
  const nomSrv = e => { const s = E.serveis.find(x => x.id === e.servei_id); return (s && IT.nomServei(s)) || (e.detall && e.detall.nom) || "opcional"; };
  const linia = e => {
    if(e.tipus === "obert") return `👁 ${L("Ha obert l'itinerari", "Ha abierto el itinerario")}${e.detall && e.detall.dispositiu ? ` <span class="meta">(${esc(e.detall.dispositiu)})</span>` : ""}`;
    if(e.tipus === "pdf") return `📄 ${L("Ha descarregat el PDF", "Ha descargado el PDF")}`;
    if(e.tipus === "document") return `📎 ${L("Ha obert el document", "Ha abierto el documento")} «${esc((e.detall || {}).document || "")}»`;
    const d = e.detall || {};
    if(typeof d.persones === "number" && E.serveis.find(s => s.id === e.servei_id && s.opcional_per_persones))
      return `✋ «${esc(nomSrv(e))}» → ${L("per a", "para")} ${d.persones} ${d.persones === 1 ? L("persona", "persona") : L("persones", "personas")}`;
    return `✋ ${d.actiu ? L("Ha tornat a afegir", "Ha vuelto a añadir") : L("Ha tret", "Ha quitado")} «${esc(nomSrv(e))}»`;
  };
  $("actEvents").innerHTML = (evs && evs.length) ? evs.map(e => `<div class="event"><span class="q">${esc(quan(e.created_at))}</span><span>${linia(e)}</span></div>`).join("")
    : `<div class="meta">${L("Encara no hi ha activitat.", "Todavía no hay actividad.")}</div>`;
}
$("btnActRefresca").onclick = carregarActivitat;

/* ---------- esborrar / duplicar ---------- */
$("btnEsborrar").onclick = async () => {
  if(!confirm(L("Segur que vols esborrar aquest itinerari? L'enllaç del client deixarà de funcionar. No es pot desfer.", "¿Seguro que quieres borrar este itinerario? El enlace del cliente dejará de funcionar. No se puede deshacer."))) return;
  if(E.docs.length) await sb.storage.from("it-documents").remove(E.docs.map(d => d.path));
  const { error } = await sb.from("it_itineraris").delete().eq("id", E.it.id);
  if(error){ toast(L("No s'ha pogut esborrar", "No se ha podido borrar")); return; }
  net(); toast(L("Esborrat", "Borrado")); pestanya("llista");
};
async function duplicar(id, boto){
  boto.disabled = true;
  try{
    const [a, b, c] = await Promise.all([
      sb.from("it_itineraris").select("*").eq("id", id).single(),
      sb.from("it_dies").select("*").eq("itinerari_id", id).order("ordre"),
      sb.from("it_serveis").select("*").eq("itinerari_id", id).order("ordre")
    ]);
    if(a.error) throw a.error;
    const nouId = uuid(), mapa = {};
    const { id: _i, token: _t, owner_id: _o, created_at: _c, updated_at: _u, seleccio: _s, seleccio_at: _sa, ...resta } = a.data;
    const r1 = await sb.from("it_itineraris").insert({ ...resta, id: nouId, titol: a.data.titol + L(" (còpia)", " (copia)") });
    if(r1.error) throw r1.error;
    const dies = (b.data || []).map(d => { const nid = uuid(); mapa[d.id] = nid; return { ...d, id: nid, itinerari_id: nouId }; });
    if(dies.length){ const r = await sb.from("it_dies").insert(dies); if(r.error) throw r.error; }
    const srv = (c.data || []).map(s => ({ ...s, id: uuid(), itinerari_id: nouId, dia_id: s.dia_id ? mapa[s.dia_id] : null }));
    if(srv.length){ const r = await sb.from("it_serveis").insert(srv); if(r.error) throw r.error; }
    toast(L("Duplicat (els documents no es copien)", "Duplicado (los documentos no se copian)"));
    obrirEditor(nouId);
  }catch(e){ toast(L("No s'ha pogut duplicar", "No se ha podido duplicar")); boto.disabled = false; }
}

/* ================= IA ================= */
async function demanarIA(boto, que, context, notes){
  const txt = boto.textContent; boto.disabled = true; boto.textContent = L("✨ Escrivint…", "✨ Escribiendo…");
  try{
    const { data, error } = await sb.functions.invoke("it-redactar", { body: { que, idioma: E.it.idioma, context, notes } });
    if(error) throw error;
    if(data && data.error === "FALTA_CLAU"){
      alert(L("La IA encara no està activada (falta la clau a Supabase).", "La IA todavía no está activada (falta la clave en Supabase).")); return null;
    }
    if(!data || data.error) throw new Error(data && data.error);
    return data.text;
  }catch(e){ toast(L("La IA no ha pogut respondre", "La IA no ha podido responder")); return null; }
  finally{ boto.disabled = false; boto.textContent = txt; }
}
document.querySelector('[data-ia="intro"]').onclick = async e => {
  const t = await demanarIA(e.currentTarget, "intro", { titol: E.it.titol, destinacio: E.it.destinacio, client: E.it.client_nom, agencia: nomAgencia() }, $("eIntro").value);
  if(t){ $("eIntro").value = t; E.it.introduccio = t; brut(); }
};
async function iaDia(boto){
  const d = E.dies.find(x => x.id === boto.dataset.iaDia);
  const serveis = serveisDe(d.id).map(s => `${(IT.TIPUS[s.tipus] || {}).ca}: ${IT.nomServei(s)}${s.detalls ? " (" + s.detalls + ")" : ""}`).join("; ");
  const t = await demanarIA(boto, "dia", { titol: d.titol, destinacio: E.it.destinacio, serveis, agencia: nomAgencia() }, d.descripcio);
  if(t){ d.descripcio = t; boto.closest(".camp").querySelector("textarea").value = t; brut(); }
}
async function iaServei(boto, s, det){
  const t = await demanarIA(boto, "servei", { tipus: s.tipus, nom: s.nom, destinacio: E.it.destinacio, agencia: nomAgencia() }, [s.detalls, s.descripcio].filter(Boolean).join("\n"));
  if(t){ s.descripcio = t; det.querySelector('[data-sc="descripcio"]').value = t; brut(); }
}

/* ================= BIBLIOTECA ================= */
async function carregarBib(){
  const { data } = await sb.from("it_biblioteca").select("*").order("tipus").order("nom");
  BIB = (data || []).map(b => ({ ...b, preu: Number(b.preu) }));
}
function filtrarBib(q){
  q = (q || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return BIB.filter(b => !q || (b.nom + " " + b.detalls + " " + b.descripcio).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q));
}
const htmlBibItem = b => `<span style="font-size:22px">${(IT.TIPUS[b.tipus] || IT.TIPUS.altre).ico}</span>
  <span style="flex:1;min-width:0"><strong>${esc(b.nom)}</strong><br><span class="meta">${esc(b.detalls || "")}</span></span>
  <span class="meta" style="white-space:nowrap">${esc(resumPreu(b))}</span>`;
function pintarBib(){
  const l = filtrarBib($("bibCerca").value);
  $("bibLlista").innerHTML = l.length ? l.map(b => `<button type="button" class="bib-item" data-bib="${b.id}">${htmlBibItem(b)}</button>`).join("")
    : `<div class="buit" style="margin-bottom:10px">${BIB.length ? L("Cap resultat.", "Ningún resultado.") : L("La biblioteca és buida.", "La biblioteca está vacía.")}</div>`;
  $("bibLlista").querySelectorAll("[data-bib]").forEach(x => x.onclick = () => editarBib(BIB.find(b => b.id === x.dataset.bib)));
}
$("bibCerca").oninput = pintarBib;
$("btnBibNou").onclick = () => editarBib({ tipus: "hotel", nom: "", detalls: "", descripcio: "", preu: 0, preu_unitat: "persona", imatge_url: null });
function editarBib(b){
  const nou = !b.id;
  $("bibEdTitol").textContent = nou ? L("Nou servei a la biblioteca", "Nuevo servicio en la biblioteca") : L("Editar servei", "Editar servicio");
  $("bibEdCos").innerHTML = `
    <div class="camp"><label>${L("Tipus", "Tipo")}</label><select id="bTipus">${tipusOpc().replace(`value="${b.tipus}"`, `value="${b.tipus}" selected`)}</select></div>
    <div class="camp"><label>${L("Nom", "Nombre")}</label><input id="bNom" value="${esc(b.nom)}"></div>
    <div class="camp"><label>${L("Detalls", "Detalles")}</label><input id="bDet" value="${esc(b.detalls)}"></div>
    <div class="camp"><label>${L("Descripció", "Descripción")}</label><textarea id="bDesc">${esc(b.descripcio)}</textarea></div>
    <div class="graella"><div><label>${L("Preu habitual (€)", "Precio habitual (€)")}</label><input id="bPreu" type="number" min="0" step="0.01" value="${b.preu || ""}"></div>
      <div><label>${L("El preu és…", "El precio es…")}</label><select id="bUnitat"><option value="persona">${L("Per persona", "Por persona")}</option><option value="grup" ${b.preu_unitat === "grup" ? "selected" : ""}>${L("Total del grup", "Total del grupo")}</option></select></div></div>
    ${b.imatge_url ? `<img class="img-prev" src="${esc(b.imatge_url)}" alt="">` : ""}
    <div class="fila-botons" style="margin-top:14px;justify-content:space-between">
      ${nou ? "<span></span>" : `<button class="boto perill petit" type="button" id="bEsb">${L("Esborrar", "Borrar")}</button>`}
      <button class="boto" type="button" id="bDesa">${L("Desar", "Guardar")}</button></div>`;
  $("dlgBibEd").showModal();
  $("bDesa").onclick = async () => {
    const fila = { tipus: $("bTipus").value, nom: $("bNom").value.trim(), detalls: $("bDet").value.trim(), descripcio: $("bDesc").value.trim(),
      preu: Math.max(0, parseFloat($("bPreu").value) || 0), preu_unitat: $("bUnitat").value, imatge_url: b.imatge_url || null };
    if(!fila.nom){ toast(L("Posa-hi un nom", "Ponle un nombre")); return; }
    const r = nou ? await sb.from("it_biblioteca").insert(fila) : await sb.from("it_biblioteca").update(fila).eq("id", b.id);
    if(r.error){ toast(L("No s'ha pogut desar", "No se ha podido guardar")); return; }
    $("dlgBibEd").close(); await carregarBib(); pintarBib(); toast(L("Desat", "Guardado"));
  };
  if(!nou) $("bEsb").onclick = async () => {
    if(!confirm(L("Esborrar de la biblioteca? (Els itineraris on ja el tens no canvien.)", "¿Borrar de la biblioteca? (Los itinerarios donde ya lo tienes no cambian.)"))) return;
    await sb.from("it_biblioteca").delete().eq("id", b.id);
    $("dlgBibEd").close(); await carregarBib(); pintarBib(); toast(L("Esborrat", "Borrado"));
  };
}
$("bibEdTancar").onclick = () => $("dlgBibEd").close();

async function desarABib(s){
  if(!IT.nomServei(s)){ toast(L("Posa-li un nom primer", "Ponle un nombre primero")); return; }
  const { tot_viatge, dia_original, data, data_arribada, ...extra } = s.extra || {};
  const { error } = await sb.from("it_biblioteca").insert({ tipus: s.tipus, nom: s.nom, detalls: s.detalls, descripcio: s.descripcio,
    preu: s.preu || 0, preu_unitat: s.preu_unitat, imatge_url: s.imatge_url || null, extra });
  toast(error ? L("No s'ha pogut desar", "No se ha podido guardar") : L("Desat a la biblioteca 📚", "Guardado en la biblioteca 📚"));
}
async function obrirDlgBib(diaId){
  destiBib = diaId;
  await carregarBib();
  $("dlgCerca").value = ""; pintarDlg();
  $("dlgBib").showModal();
}
function pintarDlg(){
  const l = filtrarBib($("dlgCerca").value);
  $("dlgLlista").innerHTML = l.length ? l.map(b => `<button type="button" class="bib-item" data-tria="${b.id}">${htmlBibItem(b)}</button>`).join("")
    : `<div class="buit">${BIB.length ? L("Cap resultat.", "Ningún resultado.") : L("La biblioteca és buida. Desa-hi serveis amb el botó «📚 Desar a la biblioteca».", "La biblioteca está vacía. Guarda servicios con el botón «📚 Guardar en la biblioteca».")}</div>`;
  $("dlgLlista").querySelectorAll("[data-tria]").forEach(x => x.onclick = () => {
    const b = BIB.find(y => y.id === x.dataset.tria);
    $("dlgBib").close();
    nouServei(destiBib, { tipus: b.tipus, nom: b.nom, detalls: b.detalls, descripcio: b.descripcio, preu: b.preu, preu_unitat: b.preu_unitat, imatge_url: b.imatge_url, extra: { ...(b.extra || {}) }, _obert: false });
    toast(L("Afegit: ", "Añadido: ") + b.nom);
  });
}
$("dlgCerca").oninput = pintarDlg;
$("dlgTancar").onclick = () => $("dlgBib").close();

iniciar();
