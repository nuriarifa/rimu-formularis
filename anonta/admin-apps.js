// Anonta · Pestanya «Les meves apps»: totes les apps de Rimu en un sol panell.
// L'agència veu les que té (i les obre) i pot demanar provar les altres 30 dies; ho aprova l'administradora.
// Aquest fitxer també estén el panell (admin.js) sense tocar-lo:
//  - hi deixa entrar les agències que encara no tenen Anonta (només veuen «Les meves apps»);
//  - afegeix la pestanya «Les meves apps»;
//  - afegeix a la fitxa del client la targeta «Documentació i adreça» (dades que venen del formulari).
(function(){
  if(DEMO) return;

  // ---- Entrada: si no té Anonta però és d'una agència, entra igualment (ag_perfil) ----
  const rpc0 = sb.rpc.bind(sb);
  sb.rpc = async function(nom, args){
    if(nom !== "an_perfil") return rpc0(nom, args);
    const [r, c] = await Promise.all([rpc0("an_perfil"), rpc0("ag_perfil")]);
    A.apps = c.data ? c.data.apps : {}; A.pendents = c.data ? c.data.pendents : [];
    A.nomesApps = !r.data && !!c.data;
    return A.nomesApps ? { data: c.data, error: null } : r;
  };

  // ---- Pestanyes ----
  pintaNav = function(){
    const nav = $("navPrincipal");
    const items = A.nomesApps ? [] : [["viatges", "🧳 " + L("Viatges", "Viajes")], ["clients", "👤 " + L("Clients", "Clientes")]];
    items.push(["apps", "🧩 " + L("Les meves apps", "Mis apps")]);
    if(A.superadmin) items.push(["agencies", "🏢 " + L("Agències", "Agencias")]);
    nav.innerHTML = items.map(([k, t]) => `<button type="button" data-vista="${k}">${t}</button>`).join("");
    nav.querySelectorAll("button").forEach(b => b.onclick = () => ir("#" + b.dataset.vista));
    marcaNav();
  };
  marcaNav = function(){
    const v = location.hash.replace(/^#/, "").split("/")[0];
    const actiu = v === "client" || v === "clients" ? "clients" : v === "agencies" ? "agencies"
      : (v === "apps" || A.nomesApps) ? "apps" : "viatges";
    document.querySelectorAll("#navPrincipal button").forEach(b => b.classList.toggle("actiu", b.dataset.vista === actiu));
  };
  const route0 = route;
  window.removeEventListener("hashchange", route0);
  route = function(){
    const v = location.hash.replace(/^#/, "").split("/")[0];
    if(v === "apps" || (A.nomesApps && !(v === "agencies" && A.superadmin))){ marcaNav(); window.scrollTo(0, 0); return vistaApps(); }
    return route0();
  };
  window.addEventListener("hashchange", route);
  const prova0 = comprovarProva;
  comprovarProva = async function(){
    if(A.nomesApps){ $("bandaProva").classList.add("amagat"); A.potCrear = true; return; }
    return prova0();
  };

  // ---- Fitxa del client: documentació i adreça ----
  const client0 = vistaClient;
  vistaClient = async function(id){
    await client0(id);
    const acces = $("acces"); if(!acces) return;
    const { data: c } = await sb.from("an_clients").select("id,naixement,dni,passaport,caducitat_passaport,adreca").eq("id", id).maybeSingle();
    if(!c || $("docClient")) return;
    acces.insertAdjacentHTML("beforebegin", `<div class="targeta" id="docClient"></div>`);
    const pinta = () => {
      const res = [
        [L("Naixement", "Nacimiento"), c.naixement ? dataCurta(c.naixement) : ""], ["DNI", c.dni],
        [L("Passaport", "Pasaporte"), c.passaport ? c.passaport + (c.caducitat_passaport ? ` · ${L("caduca", "caduca")} ${dataCurta(c.caducitat_passaport)}` : "") : ""],
        [L("Adreça", "Dirección"), c.adreca]
      ];
      $("docClient").innerHTML = `<div class="fila entre"><h2 style="margin:0">🛂 ${L("Documentació i adreça", "Documentación y dirección")}</h2>
          <button class="mini" type="button" id="bEditaDoc">✎ ${L("Edita", "Editar")}</button></div>
        <p class="meta" style="margin:4px 0 10px">${L("Només la veu l'agència. Si el client ha omplert el formulari de viatgers, la pots passar d'allà amb «Passar a Anonta».",
          "Solo la ve la agencia. Si el cliente ha rellenado el formulario de viajeros, la puedes pasar desde allí con «Pasar a Anonta».")}</p>
        <dl class="kv">${res.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v || "—")}</dd></div>`).join("")}</dl>`;
      $("bEditaDoc").onclick = edita;
    };
    const edita = () => {
      $("docClient").innerHTML = `<h2>🛂 ${L("Documentació i adreça", "Documentación y dirección")}</h2>
        <form id="fDoc"><div class="graella">
          <div class="camp"><label>${L("Data de naixement", "Fecha de nacimiento")}</label><input name="naixement" type="date" value="${esc(c.naixement)}"></div>
          <div class="camp"><label>DNI</label><input name="dni" value="${esc(c.dni)}"></div>
          <div class="camp"><label>${L("Núm. passaport", "Nº pasaporte")}</label><input name="passaport" value="${esc(c.passaport)}"></div>
          <div class="camp"><label>${L("Caducitat del passaport", "Caducidad del pasaporte")}</label><input name="caducitat_passaport" type="date" value="${esc(c.caducitat_passaport)}"></div>
        </div>
        <div class="camp"><label>${L("Adreça", "Dirección")}</label><input name="adreca" value="${esc(c.adreca)}"></div>
        <div class="fila"><button class="boto" type="submit">${L("Desa", "Guardar")}</button><button class="boto sec" type="button" id="bCancelDoc">${L("Cancel·la", "Cancelar")}</button></div></form>`;
      $("bCancelDoc").onclick = pinta;
      $("fDoc").onsubmit = async e => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.target));
        const reg = { naixement: d.naixement || null, dni: d.dni.trim() || null, passaport: d.passaport.trim() || null,
                      caducitat_passaport: d.caducitat_passaport || null, adreca: d.adreca.trim() || null };
        const { error } = await sb.from("an_clients").update(reg).eq("id", c.id);
        if(error) return avis(errMsg(error), true);
        Object.assign(c, reg); avis(L("Desat ✓", "Guardado ✓")); pinta();
      };
    };
    pinta();
  };
})();

(function(){
  const APPS = () => ({
    anonta: {
      ico: "🧳", nom: "Anonta",
      desc: L("L'app de viatge per als teus clients: itinerari, serveis, documents i pagaments, amb el teu logo.",
              "La app de viaje para tus clientes: itinerario, servicios, documentos y pagos, con tu logo."),
      url: "#viatges"
    },
    formularis: {
      ico: "📝", nom: L("Formulari de viatgers", "Formulario de viajeros"),
      desc: L("Envia un enllaç per WhatsApp i el client t'omple el nom, el DNI, el passaport i l'adreça. Després ho passes a Anonta amb un clic.",
              "Envía un enlace por WhatsApp y el cliente te rellena el nombre, el DNI, el pasaporte y la dirección. Después lo pasas a Anonta con un clic."),
      url: "../admin.html"
    },
    itineraris: {
      ico: "🗺️", nom: L("Itineraris i pressupostos", "Itinerarios y presupuestos"),
      desc: L("Prepara la proposta dia a dia amb preus i opcionals. Quan el client l'accepta, la converteixes en viatge d'Anonta.",
              "Prepara la propuesta día a día con precios y opcionales. Cuando el cliente la acepta, la conviertes en viaje de Anonta."),
      url: "../itineraris/admin.html"
    }
  });

  function estatApp(k){
    const a = (A.apps || {})[k] || {};
    if(!a.actiu) return (A.pendents || []).includes(k) ? "pendent" : "no";
    if(k === "anonta" ? a.pla === "prova" && a.prova_fins : a.prova_fins) return diesFins(a.prova_fins) >= 0 ? "prova" : "acabada";
    return "activa";
  }

  window.vistaApps = function(){
    const apps = APPS();
    pantalla.innerHTML = `
      <h2 style="margin:0 0 6px">${L("Les meves apps", "Mis apps")}</h2>
      <p class="meta" style="margin:0 0 14px">${L("Totes funcionen amb el mateix correu i la mateixa contrasenya.", "Todas funcionan con el mismo correo y la misma contraseña.")}</p>
      ${Object.entries(apps).map(([k, a]) => {
        const e = estatApp(k), x = (A.apps || {})[k] || {};
        const xip = {
          activa: `<span class="xip verd">✓ ${L("Activa", "Activa")}</span>`,
          prova: `<span class="xip blau">🎁 ${L(`Prova: queden ${diesFins(x.prova_fins)} dies`, `Prueba: quedan ${diesFins(x.prova_fins)} días`)}</span>`,
          acabada: `<span class="xip coral">⏳ ${L("Prova acabada", "Prueba terminada")}</span>`,
          pendent: `<span class="xip blau">⌛ ${L("Sol·licitud enviada", "Solicitud enviada")}</span>`,
          no: ""
        }[e];
        const boto = (e === "activa" || e === "prova" || e === "acabada")
          ? `<a class="boto petit" href="${a.url}">${L("Obrir", "Abrir")} →</a>`
          : e === "pendent"
            ? `<p class="meta" style="margin:0">${L("Rebràs un correu quan estigui activada.", "Recibirás un correo cuando esté activada.")}</p>`
            : `<button class="boto petit" type="button" data-demana="${k}">🎁 ${L("Provar 30 dies gratis", "Probar 30 días gratis")}</button>`;
        return `<div class="targeta">
          <div class="fila entre" style="align-items:flex-start;gap:10px">
            <h2 style="margin:0">${a.ico} ${esc(a.nom)}</h2>${xip}</div>
          <p style="margin:8px 0 12px">${esc(a.desc)}</p>
          ${boto}
        </div>`;
      }).join("")}
      <p class="ajuda">${L("Per contractar una app o canviar de pla, escriu-nos a", "Para contratar una app o cambiar de plan, escríbenos a")} <a href="mailto:admin@rimuviatges.com">admin@rimuviatges.com</a>.</p>`;
    pantalla.querySelectorAll("[data-demana]").forEach(b => b.onclick = () => demanar(b.dataset.demana, b));
  };

  async function demanar(k, boto){
    const nom = APPS()[k].nom;
    if(!confirm(L(`Vols provar «${nom}» gratis durant 30 dies? T'avisarem quan estigui activada.`,
                  `¿Quieres probar «${nom}» gratis durante 30 días? Te avisaremos cuando esté activada.`))) return;
    boto.disabled = true;
    const { error } = await sb.rpc("ag_demanar_app", { p_app: k });
    if(error && !/JA_SOLLICITAT/.test(error.message)){
      boto.disabled = false;
      return avis(/JA_TE_APP/.test(error.message) ? L("Ja tens aquesta app.", "Ya tienes esta app.") : errMsg(error), true);
    }
    A.pendents = [...new Set([...(A.pendents || []), k])];
    fetch("https://formsubmit.co/ajax/admin@rimuviatges.com", {
      method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ _subject: `Nova sol·licitud: ${A.agencia.nom} vol provar ${nom}`, _template: "table", _captcha: "false",
        "Agència": A.agencia.nom, "Correu": A.email, "App": nom, "Aprova-ho al panell": new URL("admin.html#agencies", location.href).href })
    }).catch(() => {});
    avis(L("Sol·licitud enviada ✓", "Solicitud enviada ✓"));
    vistaApps();
  }
})();
