// Anonta · Pestanya «Les meves apps»: totes les apps de Rimu en un sol panell.
// L'agència veu les que té (i les obre) i pot demanar provar les altres 30 dies; ho aprova l'administradora.
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
