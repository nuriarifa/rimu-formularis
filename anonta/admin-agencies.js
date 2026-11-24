// Anonta · Pestanya «Agències» (només per a l'administradora): sol·licituds del mes de prova i plans
(function(){
  const URL_LOGOS = RIMU.SUPABASE_URL + "/storage/v1/object/public/logos-agencies/";
  const PLANS = () => ({
    prova:   [L("Mes de prova", "Mes de prueba"), L("gratis · logo propi i IA", "gratis · logo propio e IA")],
    basic:   [L("Bàsic", "Básico"), L(`20 €/mes · logo Anonta, sense IA`, `20 €/mes · logo Anonta, sin IA`)],
    premium: [L("Prèmium", "Prémium"), L(`25 €/mes · logo propi i IA`, `25 €/mes · logo propio e IA`)],
    cap:     [L("Donar de baixa", "Dar de baja"), L("ja no hi pot entrar", "ya no puede entrar")]
  });
  let SOLS = [], AGS = [];

  window.comptarSollicituds = async function(){
    const { count } = await sb.from("an_sollicituds").select("id", { count: "exact", head: true }).eq("estat", "pendent");
    const b = document.querySelector('#navPrincipal [data-vista="agencies"]');
    if(b && count) b.innerHTML = `🏢 ${L("Agències", "Agencias")} <span class="xip coral" style="margin-left:4px">${count}</span>`;
  };

  window.vistaAgencies = async function(){
    pantalla.innerHTML = `<p class="meta">${L("Carregant…", "Cargando…")}</p>`;
    const [s, a] = await Promise.all([
      sb.from("an_sollicituds").select("*").eq("estat", "pendent").order("created_at"),
      sb.rpc("an_admin_agencies")
    ]);
    if(s.error || a.error){ pantalla.innerHTML = `<div class="error">${esc(errMsg(s.error || a.error))}</div>`; return; }
    SOLS = s.data || []; AGS = a.data || [];
    pantalla.innerHTML = `
      <h2 style="margin:0 0 14px">${L("Agències", "Agencias")}</h2>
      <div class="targeta">
        <h2>🎁 ${L("Sol·licituds del mes de prova", "Solicitudes del mes de prueba")}</h2>
        <div id="solLlista">${SOLS.length ? "" : `<p class="meta" style="margin:0">${L("No n'hi ha cap de pendent.", "No hay ninguna pendiente.")}</p>`}</div>
        <div id="benvinguda" class="amagat"></div>
      </div>
      <div class="targeta">
        <h2>🏢 ${L("Agències amb Anonta", "Agencias con Anonta")}</h2>
        <div id="agLlista"></div>
        <p class="ajuda">${L("El pla decideix la marca que veuen els clients: <b>Mes de prova</b> i <b>Prèmium</b> amb el logo i els colors de l'agència; <b>Bàsic</b> amb la marca Anonta. La IA només és al Prèmium i a la prova. Preus sense IVA. Quan una prova s'acaba, l'agència pot mirar però no crear viatges nous.",
          "El plan decide la marca que ven los clientes: <b>Mes de prueba</b> y <b>Prémium</b> con el logo y los colores de la agencia; <b>Básico</b> con la marca Anonta. La IA solo está en el Prémium y en la prueba. Precios sin IVA. Cuando una prueba termina, la agencia puede mirar pero no crear viajes nuevos.")}</p>
      </div>`;
    pintaSols(); pintaAgs();
  };

  function pintaSols(){
    if(!SOLS.length) return;
    $("solLlista").innerHTML = SOLS.map(s => {
      const ja = AGS.find(a => a.usuaris.some(u => u.toLowerCase() === s.email.toLowerCase()));
      return `<div class="doc" style="align-items:flex-start;flex-wrap:wrap">
        ${s.logo_path ? `<img src="${esc(URL_LOGOS + s.logo_path)}" alt="" style="width:64px;height:64px;object-fit:contain;border:1px solid var(--linia);border-radius:10px;background:#fff">` : ""}
        <div class="n" style="min-width:180px"><b>${esc(s.nom)}</b>
          <span class="meta">${esc(s.email)} · ${s.idioma === "es" ? "Castellano" : "Català"} · ${new Date(s.created_at).toLocaleDateString(LANG === "es" ? "es-ES" : "ca-ES")}</span>
          ${ja ? `<span class="xip blau">${L("Ja és agència vostra: ", "Ya es agencia vuestra: ")}${esc(ja.nom)}</span>` : ""}</div>
        <div class="fila">
          <button class="boto petit" type="button" data-aprova="${s.id}">✓ ${L("Aprovar (30 dies de prova)", "Aprobar (30 días de prueba)")}</button>
          <button class="mini perill" type="button" data-rebutja="${s.id}">${L("Rebutjar", "Rechazar")}</button>
        </div></div>`;
    }).join("");
    $("solLlista").querySelectorAll("[data-aprova]").forEach(b => b.onclick = () => aprovar(b.dataset.aprova, b));
    $("solLlista").querySelectorAll("[data-rebutja]").forEach(b => b.onclick = async () => {
      const s = SOLS.find(x => x.id === b.dataset.rebutja);
      if(!confirm(L(`Rebutjar la sol·licitud de «${s.nom}»?`, `¿Rechazar la solicitud de «${s.nom}»?`))) return;
      const { error } = await sb.from("an_sollicituds").update({ estat: "rebutjada" }).eq("id", s.id);
      if(error) return avis(errMsg(error), true);
      avis(L("Sol·licitud rebutjada", "Solicitud rechazada"));
      vistaAgencies(); comptarSollicituds();
    });
  }

  function pintaAgs(){
    $("agLlista").innerHTML = AGS.length ? AGS.map(a => {
      const dies = a.prova_fins ? diesFins(a.prova_fins) : null;
      const estatProva = a.pla === "prova" && a.prova_fins
        ? (dies >= 0 ? L(`queden ${dies} dies`, `quedan ${dies} días`) : L("prova acabada", "prueba terminada")) : "";
      return `<div class="doc" style="flex-wrap:wrap">
        <div class="n" style="min-width:180px"><b>${esc(a.nom)}</b>
          <span class="meta">${esc((a.usuaris || []).join(", ") || L("sense usuaris", "sin usuarios"))}</span>
          <span class="meta">${a.clients} ${L("clients", "clientes")} · ${a.viatges} ${L("viatges", "viajes")}${estatProva ? ` · <b style="color:${dies >= 0 ? "var(--blau)" : "#A4504A"}">${estatProva}</b>` : ""}</span></div>
        <select data-pla="${esc(a.id)}" style="width:auto">${Object.entries(PLANS()).filter(([k]) => k !== "cap" || a.id !== "rimu")
          .map(([k, [n, d]]) => `<option value="${k}"${k === a.pla ? " selected" : ""}>${n} · ${d}</option>`).join("")}</select>
        ${a.pla === "prova" ? `<button class="mini" type="button" data-mes30="${esc(a.id)}" data-fins="${a.prova_fins || ""}">+30 ${L("dies", "días")}</button>` : ""}
      </div>`;
    }).join("") : `<p class="meta">${L("Encara no n'hi ha cap.", "Todavía no hay ninguna.")}</p>`;
    $("agLlista").querySelectorAll("[data-pla]").forEach(sel => {
      const abans = sel.value;
      sel.onchange = async () => {
        const a = AGS.find(x => x.id === sel.dataset.pla), pla = sel.value;
        const msg = pla === "cap"
          ? L(`Donar de baixa «${a.nom}»? No podrà entrar al panell i els seus clients deixaran de veure l'app. Les dades es conserven.`,
              `¿Dar de baja «${a.nom}»? No podrá entrar en el panel y sus clientes dejarán de ver la app. Los datos se conservan.`)
          : L(`Canviar «${a.nom}» al pla ${PLANS()[pla][0]}?`, `¿Cambiar «${a.nom}» al plan ${PLANS()[pla][0]}?`);
        if(!confirm(msg)){ sel.value = abans; return; }
        const { error } = await sb.rpc("an_canviar_pla", { p_agencia: a.id, p_pla: pla, p_fins: null });
        if(error){ sel.value = abans; return avis(errMsg(error), true); }
        avis(L("Pla canviat ✓", "Plan cambiado ✓"));
        vistaAgencies();
      };
    });
    $("agLlista").querySelectorAll("[data-mes30]").forEach(b => b.onclick = async () => {
      const avui = AN.avui(), base = new Date(((b.dataset.fins && b.dataset.fins > avui) ? b.dataset.fins : avui) + "T12:00:00");
      base.setDate(base.getDate() + 30);
      const fins = `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,"0")}-${String(base.getDate()).padStart(2,"0")}`;
      const { error } = await sb.rpc("an_canviar_pla", { p_agencia: b.dataset.mes30, p_pla: "prova", p_fins: fins });
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
    const ja = AGS.find(a => a.usuaris.some(u => u.toLowerCase() === s.email.toLowerCase()));
    if(ja) return avis(L(`«${ja.nom}» ja té Anonta. Si cal, canvia-li el pla a la llista d'agències i rebutja aquesta sol·licitud.`,
                         `«${ja.nom}» ya tiene Anonta. Si hace falta, cámbiale el plan en la lista de agencias y rechaza esta solicitud.`), true);
    if(!confirm(L(`Crear l'espai de «${s.nom}» amb 30 dies de prova?`, `¿Crear el espacio de «${s.nom}» con 30 días de prueba?`))) return;
    boto.disabled = true; boto.textContent = L("Creant…", "Creando…");
    const colors = s.logo_path ? await colorsDelLogo(URL_LOGOS + s.logo_path) : {};
    const { error } = await sb.rpc("an_aprovar_sollicitud", { p_id: id, p_colors: colors });
    if(error){
      avis(/JA_TE_APP/.test(error.message) ? L("Aquesta agència ja té Anonta.", "Esta agencia ya tiene Anonta.") : L("No s'ha pogut aprovar: ", "No se ha podido aprobar: ") + error.message, true);
      boto.disabled = false; boto.textContent = "✓ " + L("Aprovar (30 dies de prova)", "Aprobar (30 días de prueba)");
      return;
    }
    const s2 = { ...s };
    await vistaAgencies();
    comptarSollicituds();
    benvinguda(s2);
  }

  // Missatge per enviar a l'agència quan ja té l'espai creat (en el seu idioma)
  function benvinguda(s){
    const fins = new Date(); fins.setDate(fins.getDate() + 30);
    const url = new URL("admin.html", location.href).href.split("?")[0].split("#")[0];
    const es = s.idioma !== "ca";
    const data = fins.toLocaleDateString(es ? "es-ES" : "ca-ES");
    const text = es
      ? `¡Hola! Ya tienes listo el espacio de ${s.nom} en Anonta, la app de viaje para tus clientes, con tu logo y tus colores.\n\n`
        + `1. Entra en: ${url}\n`
        + `2. Escribe tu correo (${s.email}) y la contraseña que quieras, y pulsa «¿Primera vez? Crear la contraseña».\n`
        + `3. Si te llega un correo para confirmar la cuenta, confírmala y vuelve a entrar.\n\n`
        + `Si ya usas nuestros formularios o itinerarios, entra con el mismo correo y la misma contraseña.\n\n`
        + `Tu prueba gratuita dura hasta el ${data}. Cualquier duda, escríbenos.\n\nRimu Viatges`
      : `Hola! Ja tens a punt l'espai de ${s.nom} a Anonta, l'app de viatge per als teus clients, amb el teu logo i els teus colors.\n\n`
        + `1. Entra a: ${url}\n`
        + `2. Escriu el teu correu (${s.email}) i la contrasenya que vulguis, i prem «Primer cop? Crear la contrasenya».\n`
        + `3. Si t'arriba un correu per confirmar el compte, confirma'l i torna a entrar.\n\n`
        + `Si ja fas servir els nostres formularis o itineraris, entra amb el mateix correu i la mateixa contrasenya.\n\n`
        + `La teva prova gratuïta dura fins al ${data}. Qualsevol dubte, escriu-nos.\n\nRimu Viatges`;
    const b = $("benvinguda");
    b.innerHTML = `<div style="margin-top:12px;border-top:1px solid var(--linia);padding-top:12px">
      <div class="ok"><strong>${L("Fet!", "¡Hecho!")}</strong> ${L("Envia-li aquest missatge perquè hi pugui entrar:", "Envíale este mensaje para que pueda entrar:")}</div>
      <textarea readonly rows="10" style="margin-top:10px;font-size:13.5px">${esc(text)}</textarea>
      <div class="fila" style="margin-top:10px">
        <a class="boto petit" href="mailto:${esc(s.email)}?subject=${encodeURIComponent(es ? "Tu mes de prueba de Anonta ya está listo" : "El teu mes de prova d'Anonta ja està a punt")}&body=${encodeURIComponent(text)}">✉️ ${L("Enviar per correu", "Enviar por correo")}</a>
        <button class="boto sec petit" type="button" id="bCopiaBenv">${L("Copiar el missatge", "Copiar el mensaje")}</button></div></div>`;
    b.classList.remove("amagat");
    $("bCopiaBenv").onclick = async () => {
      try{ await navigator.clipboard.writeText(text); avis(L("Copiat ✓", "Copiado ✓")); }catch{ avis(L("No s'ha pogut copiar.", "No se ha podido copiar."), true); }
    };
  }
})();
