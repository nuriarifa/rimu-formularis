// Anonta · Pestanya «Agències» (només per a l'administradora): totes les agències i totes les apps en un sol lloc.
// Sol·licituds de prova de les tres apps, i per a cada agència l'estat d'Anonta, dels formularis i dels itineraris.
(function(){
  const URL_LOGOS = RIMU.SUPABASE_URL + "/storage/v1/object/public/logos-agencies/";
  const NOM_APP = () => ({ anonta: "🧳 Anonta", formularis: "📝 " + L("Formularis", "Formularios"), itineraris: "🗺️ " + L("Itineraris", "Itinerarios") });
  // Els preus del pla depenen de si l'agència és agent de Rimu (sense IVA) o de fora (IVA inclòs)
  const ESTATS = (tarifa = "agent") => {
    const web = tarifa === "web", P = (window.TARIFES && TARIFES[web ? "web" : "agent"].anonta) || { basic: 20, premium: 25 };
    const iva = web ? L(" IVA incl.", " IVA incl.") : "";
    return {
    anonta: {
      prova:   L("🎁 Mes de prova (logo propi i IA)", "🎁 Mes de prueba (logo propio e IA)"),
      basic:   L(`Bàsic · ${P.basic} €/mes${iva} (logo Anonta, sense IA)`, `Básico · ${P.basic} €/mes${iva} (logo Anonta, sin IA)`),
      premium: L(`Prèmium · ${P.premium} €/mes${iva} (logo propi i IA)`, `Prémium · ${P.premium} €/mes${iva} (logo propio e IA)`)
    },
    formularis: { prova: L("🎁 Mes de prova", "🎁 Mes de prueba"), activa: L("✓ Activa (ha pagat)", "✓ Activa (ha pagado)") },
    itineraris: { prova: L("🎁 Mes de prova", "🎁 Mes de prueba"), activa: L("✓ Activa (ha pagat)", "✓ Activa (ha pagado)") }
    };
  };
  let SOLS = [], AGS = [];

  window.comptarSollicituds = async function(){
    const { data } = await sb.rpc("ag_admin_sollicituds");
    const n = (data || []).length;
    const b = document.querySelector('#navPrincipal [data-vista="agencies"]');
    if(b) b.innerHTML = `🏢 ${L("Agències", "Agencias")}${n ? ` <span class="xip coral" style="margin-left:4px">${n}</span>` : ""}`;
  };

  window.vistaAgencies = async function(){
    pantalla.innerHTML = `<p class="meta">${L("Carregant…", "Cargando…")}</p>`;
    const [s, a, tf] = await Promise.all([sb.rpc("ag_admin_sollicituds"), sb.rpc("ag_admin_agencies"), sb.rpc("ag_admin_tarifes")]);
    if(s.error || a.error){ pantalla.innerHTML = `<div class="error">${esc(errMsg(s.error || a.error))}</div>`; return; }
    SOLS = s.data || []; AGS = a.data || [];
    const tarifes = new Map((tf.data || []).map(x => [x.id, x.tarifa]));
    AGS.forEach(x => x.tarifa = tarifes.get(x.id) || "web");
    pantalla.innerHTML = `
      <h2 style="margin:0 0 14px">${L("Agències", "Agencias")}</h2>
      <div class="targeta">
        <h2>🎁 ${L("Sol·licituds de prova", "Solicitudes de prueba")}</h2>
        <div id="solLlista">${SOLS.length ? "" : `<p class="meta" style="margin:0">${L("No n'hi ha cap de pendent.", "No hay ninguna pendiente.")}</p>`}</div>
        <div id="benvinguda" class="amagat"></div>
      </div>
      <div id="agLlista"></div>
      <p class="ajuda">${L("Cada agència només té les apps que hi surten activades. <b>Mes de prova</b>: pot crear coses fins a la data; després només pot mirar. <b>Activa</b> o un pla: sense data de final. <b>Donar de baixa</b>: ja no hi entra, però les dades es conserven. A Anonta, el pla decideix la marca: <b>Bàsic</b> amb la marca Anonta; <b>Prova</b> i <b>Prèmium</b> amb el logo de l'agència. Al costat de cada pla hi surt el preu que li toca: d'agent sense IVA, o de fora amb IVA inclòs. A cada agència tries si veu els preus d'agent o els de fora (els de la web, amb IVA inclòs).",
        "Cada agencia solo tiene las apps que salen activadas. <b>Mes de prueba</b>: puede crear cosas hasta la fecha; después solo puede mirar. <b>Activa</b> o un plan: sin fecha de final. <b>Dar de baja</b>: ya no entra, pero los datos se conservan. En Anonta, el plan decide la marca: <b>Básico</b> con la marca Anonta; <b>Prueba</b> y <b>Prémium</b> con el logo de la agencia. Junto a cada plan sale el precio que le corresponde: de agente sin IVA, o de fuera con IVA incluido. En cada agencia eliges si ve los precios de agente o los de fuera (los de la web, con IVA incluido).")}</p>`;
    pintaSols(); pintaAgs();
  };

  function pintaSols(){
    if(!SOLS.length) return;
    $("solLlista").innerHTML = SOLS.map(s => `<div class="doc" style="align-items:flex-start;flex-wrap:wrap">
        ${s.logo_path ? `<img src="${esc(URL_LOGOS + s.logo_path)}" alt="" style="width:64px;height:64px;object-fit:contain;border:1px solid var(--linia);border-radius:10px;background:#fff">` : ""}
        <div class="n" style="min-width:180px"><b>${esc(s.nom)}</b>
          <span class="meta">${esc(s.email)} · ${new Date(s.created_at).toLocaleDateString(LANG === "es" ? "es-ES" : "ca-ES")}</span>
          <span class="xip blau">${L("Vol provar", "Quiere probar")}: ${NOM_APP()[s.app]}</span>
          ${s.agencia_existent ? `<span class="xip verd">${L("Ja és agència vostra: ", "Ya es agencia vuestra: ")}${esc(s.agencia_existent)}</span>` : `<span class="xip">${L("Agència nova", "Agencia nueva")}</span>`}</div>
        <div class="fila">
          <button class="boto petit" type="button" data-aprova="${s.id}">✓ ${L("Aprovar (30 dies de prova)", "Aprobar (30 días de prueba)")}</button>
          <button class="mini perill" type="button" data-rebutja="${s.id}">${L("Rebutjar", "Rechazar")}</button>
        </div></div>`).join("");
    $("solLlista").querySelectorAll("[data-aprova]").forEach(b => b.onclick = () => aprovar(b.dataset.aprova, b));
    $("solLlista").querySelectorAll("[data-rebutja]").forEach(b => b.onclick = async () => {
      const s = SOLS.find(x => x.id === b.dataset.rebutja);
      if(!confirm(L(`Rebutjar la sol·licitud de «${s.nom}» (${NOM_APP()[s.app]})?`, `¿Rechazar la solicitud de «${s.nom}» (${NOM_APP()[s.app]})?`))) return;
      const taula = s.app === "anonta" ? "an_sollicituds" : "sollicituds";
      const { error } = await sb.from(taula).update({ estat: "rebutjada" }).eq("id", s.id);
      if(error) return avis(errMsg(error), true);
      avis(L("Sol·licitud rebutjada", "Solicitud rechazada"));
      vistaAgencies(); comptarSollicituds();
    });
  }

  function filaApp(a, k){
    const x = a[k] || {}, est = ESTATS(a.tarifa)[k];
    const actual = !x.actiu ? "cap" : k === "anonta" ? x.pla : (x.prova_fins ? "prova" : "activa");
    const enProva = x.actiu && x.prova_fins && (k !== "anonta" || x.pla === "prova");
    const dies = enProva ? diesFins(x.prova_fins) : null;
    const estatTxt = !x.actiu ? `<span class="xip">${L("No la té", "No la tiene")}</span>`
      : enProva ? `<span class="xip ${dies >= 0 ? "blau" : "coral"}">${dies >= 0 ? L(`queden ${dies} dies`, `quedan ${dies} días`) : L("prova acabada", "prueba terminada")}</span>`
      : `<span class="xip verd">✓ ${L("Activa", "Activa")}</span>`;
    const unitat = { anonta: L("viatges", "viajes"), formularis: L("formularis", "formularios"), itineraris: L("itineraris", "itinerarios") }[k];
    const opcions = Object.entries(est).map(([v, n]) => `<option value="${v}"${v === actual ? " selected" : ""}>${n}</option>`).join("")
      + (a.id === "rimu" ? "" : `<option value="cap"${actual === "cap" ? " selected" : ""}>${x.actiu ? L("Donar de baixa", "Dar de baja") : L("— No la té —", "— No la tiene —")}</option>`);
    return `<div class="doc" style="flex-wrap:wrap;align-items:center">
      <div class="n" style="min-width:150px"><b>${NOM_APP()[k]}</b><span class="meta">${x.n || 0} ${unitat}</span></div>
      ${estatTxt}
      <select data-ag="${esc(a.id)}" data-app="${k}" data-abans="${actual}" style="width:auto">${opcions}</select>
      ${enProva ? `<button class="mini" type="button" data-mes30="${esc(a.id)}" data-app="${k}" data-fins="${x.prova_fins}">+30 ${L("dies", "días")}</button>` : ""}
    </div>`;
  }

  function pintaAgs(){
    $("agLlista").innerHTML = AGS.map(a => `<div class="targeta">
        <div class="fila" style="gap:12px;align-items:center;margin-bottom:6px">
          ${a.logo_url ? `<img src="${esc(a.logo_url)}" alt="" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--linia);border-radius:10px;background:#fff">` : ""}
          <div style="flex:1"><h2 style="margin:0">${esc(a.nom)}</h2><span class="meta">${esc((a.usuaris || []).join(", ") || L("sense usuaris", "sin usuarios"))}</span></div>
          <label class="meta" style="display:flex;flex-direction:column;gap:2px">${L("Preus", "Precios")}
            <select data-tarifa="${esc(a.id)}" style="width:auto">
              <option value="agent"${a.tarifa === "agent" ? " selected" : ""}>${L("Agent de Rimu", "Agente de Rimu")}</option>
              <option value="web"${a.tarifa === "web" ? " selected" : ""}>${L("De fora (IVA inclòs)", "De fuera (IVA incluido)")}</option>
            </select></label>
        </div>
        ${["anonta", "formularis", "itineraris"].map(k => filaApp(a, k)).join("")}
      </div>`).join("") || `<p class="meta">${L("Encara no n'hi ha cap.", "Todavía no hay ninguna.")}</p>`;

    $("agLlista").querySelectorAll("select[data-tarifa]").forEach(sel => sel.onchange = async () => {
      const a = AGS.find(x => x.id === sel.dataset.tarifa);
      const { error } = await sb.rpc("ag_canviar_tarifa", { p_agencia: a.id, p_tarifa: sel.value });
      if(error){ sel.value = a.tarifa; return avis(errMsg(error), true); }
      a.tarifa = sel.value;
      pintaAgs();
      avis(sel.value === "agent" ? L(`«${a.nom}» veurà els preus d'agent ✓`, `«${a.nom}» verá los precios de agente ✓`) : L(`«${a.nom}» veurà els preus de fora ✓`, `«${a.nom}» verá los precios de fuera ✓`));
    });
    $("agLlista").querySelectorAll("select[data-ag]").forEach(sel => sel.onchange = async () => {
      const a = AGS.find(x => x.id === sel.dataset.ag), k = sel.dataset.app, nou = sel.value, abans = sel.dataset.abans;
      const nomApp = NOM_APP()[k];
      const msg = nou === "cap"
        ? L(`Donar de baixa «${a.nom}» de ${nomApp}? Ja no hi podrà entrar. Les dades es conserven i la pots tornar a activar quan vulguis.`,
            `¿Dar de baja «${a.nom}» de ${nomApp}? Ya no podrá entrar. Los datos se conservan y la puedes volver a activar cuando quieras.`)
        : nou === "prova"
          ? L(`Posar ${nomApp} de «${a.nom}» en mes de prova (30 dies des d'avui)?`, `¿Poner ${nomApp} de «${a.nom}» en mes de prueba (30 días desde hoy)?`)
          : L(`Activar ${nomApp} per a «${a.nom}» sense data de final?`, `¿Activar ${nomApp} para «${a.nom}» sin fecha de final?`);
      if(!confirm(msg)){ sel.value = abans; return; }
      const { error } = await sb.rpc("ag_canviar_app", { p_agencia: a.id, p_app: k, p_estat: nou, p_fins: null });
      if(error){ sel.value = abans; return avis(errMsg(error), true); }
      avis(nou === "cap" ? L("Donada de baixa", "Dada de baja") : L("Canviat ✓", "Cambiado ✓"));
      vistaAgencies();
    });
    $("agLlista").querySelectorAll("[data-mes30]").forEach(b => b.onclick = async () => {
      const avui = AN.avui(), base = new Date(((b.dataset.fins && b.dataset.fins > avui) ? b.dataset.fins : avui) + "T12:00:00");
      base.setDate(base.getDate() + 30);
      const fins = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,"0")}-${String(base.getDate()).padStart(2,"0")}`;
      const { error } = await sb.rpc("ag_canviar_app", { p_agencia: b.dataset.mes30, p_app: b.dataset.app, p_estat: "prova", p_fins: fins });
      if(error) return avis(errMsg(error), true);
      avis(L(`Prova allargada fins al ${dataCurta(fins)} ✓`, `Prueba alargada hasta el ${dataCurta(fins)} ✓`));
      vistaAgencies();
    });
  }

  // Colors principals del logo (per vestir l'app de l'agència amb els seus colors)
  function colorsDelLogo(src){
    return new Promise(resolve => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => {
        try{
          const c = document.createElement("canvas"), n = 80; c.width = n; c.height = n;
          const x = c.getContext("2d"); x.drawImage(img, 0, 0, n, n);
          const px = x.getImageData(0, 0, n, n).data, cubs = {};
          for(let i = 0; i < px.length; i += 4){
            const [r, g, b, a] = [px[i], px[i+1], px[i+2], px[i+3]];
            if(a < 128) continue;
            const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            if(mx > 235 && mn > 235) continue;
            if(mx - mn < 25 && mx > 60) continue;
            const k = [r >> 5, g >> 5, b >> 5].join(",");
            (cubs[k] = cubs[k] || { n: 0, r: 0, g: 0, b: 0 }).n++;
            cubs[k].r += r; cubs[k].g += g; cubs[k].b += b;
          }
          const llista = Object.values(cubs).sort((a, b) => b.n - a.n).map(c => [c.r / c.n, c.g / c.n, c.b / c.n]);
          if(!llista.length) return resolve({});
          const dist = (a, b) => Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]);
          const lum = c => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
          let prin = llista[0];
          while(lum(prin) > 0.55) prin = prin.map(v => v * 0.85);
          const acc = llista.find(c => dist(c, llista[0]) > 90) || prin;
          const hex = c => "#" + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
          const fosc = c => c.map(v => v * 0.78), clar = c => c.map(v => v + (255 - v) * 0.9);
          resolve({ color: hex(prin), color_fosc: hex(fosc(prin)), color_clar: hex(clar(prin)), accent: hex(acc), accent_clar: hex(clar(acc)) });
        }catch(e){ resolve({}); }
      };
      img.onerror = () => resolve({});
      img.src = src + (src.includes("?") ? "&" : "?") + "v=" + Date.now();
    });
  }

  async function aprovar(id, boto){
    const s = SOLS.find(x => x.id === id); if(!s) return;
    if(!confirm(s.agencia_existent
      ? L(`Activar ${NOM_APP()[s.app]} per a «${s.agencia_existent}» amb 30 dies de prova?`, `¿Activar ${NOM_APP()[s.app]} para «${s.agencia_existent}» con 30 días de prueba?`)
      : L(`Crear l'agència «${s.nom}» amb ${NOM_APP()[s.app]} i 30 dies de prova?`, `¿Crear la agencia «${s.nom}» con ${NOM_APP()[s.app]} y 30 días de prueba?`))) return;
    boto.disabled = true; boto.textContent = L("Creant…", "Creando…");
    const colors = s.logo_path ? await colorsDelLogo(URL_LOGOS + s.logo_path) : {};
    const { error } = await sb.rpc(s.app === "anonta" ? "an_aprovar_sollicitud" : "aprovar_sollicitud", { p_id: id, p_colors: colors });
    if(error){
      avis(/JA_TE_APP/.test(error.message) ? L("Aquesta agència ja té l'app.", "Esta agencia ya tiene la app.") : L("No s'ha pogut aprovar: ", "No se ha podido aprobar: ") + error.message, true);
      boto.disabled = false; boto.textContent = "✓ " + L("Aprovar (30 dies de prova)", "Aprobar (30 días de prueba)");
      return;
    }
    const s2 = { ...s };
    await vistaAgencies();
    comptarSollicituds();
    benvinguda(s2);
  }

  // Missatge per enviar a l'agència quan ja té l'app activada (tothom entra pel panell d'Anonta)
  function benvinguda(s){
    const fins = new Date(); fins.setDate(fins.getDate() + 30);
    const url = new URL("admin.html", location.href).href.split("?")[0].split("#")[0];
    const es = s.idioma ? s.idioma !== "ca" : true;
    const data = fins.toLocaleDateString(es ? "es-ES" : "ca-ES");
    const app = { anonta: "Anonta", formularis: es ? "el formulario de datos de viajeros" : "el formulari de dades de viatgers",
                  itineraris: es ? "los itinerarios y presupuestos" : "els itineraris i pressupostos" }[s.app];
    const text = s.agencia_existent
      ? (es ? `¡Hola! Ya tienes activado ${app} para ${s.agencia_existent}. Entra en tu panel con el mismo correo y la misma contraseña de siempre:\n${url}#apps\n\nTu prueba gratuita dura hasta el ${data}. Cualquier duda, escríbenos.\n\nRimu Viatges`
            : `Hola! Ja tens activat ${app} per a ${s.agencia_existent}. Entra al teu panell amb el mateix correu i la mateixa contrasenya de sempre:\n${url}#apps\n\nLa teva prova gratuïta dura fins al ${data}. Qualsevol dubte, escriu-nos.\n\nRimu Viatges`)
      : es
        ? `¡Hola! Ya tienes listo el espacio de ${s.nom} con ${app}, con tu logo y tus colores.\n\n`
          + `1. Entra en: ${url}\n`
          + `2. Escribe tu correo (${s.email}) y la contraseña que quieras, y pulsa «¿Primera vez? Crear la contraseña».\n`
          + `3. Si te llega un correo para confirmar la cuenta, confírmala y vuelve a entrar.\n\n`
          + `Desde el mismo panel, en «Mis apps», puedes probar también nuestras otras apps.\n\n`
          + `Tu prueba gratuita dura hasta el ${data}. Cualquier duda, escríbenos.\n\nRimu Viatges`
        : `Hola! Ja tens a punt l'espai de ${s.nom} amb ${app}, amb el teu logo i els teus colors.\n\n`
          + `1. Entra a: ${url}\n`
          + `2. Escriu el teu correu (${s.email}) i la contrasenya que vulguis, i prem «Primer cop? Crear la contrasenya».\n`
          + `3. Si t'arriba un correu per confirmar el compte, confirma'l i torna a entrar.\n\n`
          + `Des del mateix panell, a «Les meves apps», també pots provar les nostres altres apps.\n\n`
          + `La teva prova gratuïta dura fins al ${data}. Qualsevol dubte, escriu-nos.\n\nRimu Viatges`;
    const b = $("benvinguda");
    b.innerHTML = `<div style="margin-top:12px;border-top:1px solid var(--linia);padding-top:12px">
      <div class="ok"><strong>${L("Fet!", "¡Hecho!")}</strong> ${L("Envia-li aquest missatge perquè hi pugui entrar:", "Envíale este mensaje para que pueda entrar:")}</div>
      <textarea readonly rows="10" style="margin-top:10px;font-size:13.5px">${esc(text)}</textarea>
      <div class="fila" style="margin-top:10px">
        <a class="boto petit" href="mailto:${esc(s.email)}?subject=${encodeURIComponent(es ? "Tu prueba ya está lista" : "La teva prova ja està a punt")}&body=${encodeURIComponent(text)}">✉️ ${L("Enviar per correu", "Enviar por correo")}</a>
        <button class="boto sec petit" type="button" id="bCopiaBenv">${L("Copiar el missatge", "Copiar el mensaje")}</button></div></div>`;
    b.classList.remove("amagat");
    $("bCopiaBenv").onclick = async () => {
      try{ await navigator.clipboard.writeText(text); avis(L("Copiat ✓", "Copiado ✓")); }catch{ avis(L("No s'ha pogut copiar.", "No se ha podido copiar."), true); }
    };
  }
})();
