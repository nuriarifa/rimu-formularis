// Anonta · Missatges del formulari de contacte d'anonta.es (pestanya «Agències», només l'administradora)
(function(){
  if(typeof vistaAgencies !== "function") return;
  const base = vistaAgencies;
  window.vistaAgencies = async function(){
    await base();
    const { data, error } = await sb.rpc("ag_admin_contactes");
    if(error) return;
    const msgs = data || [];
    const noLlegits = msgs.filter(m => !m.llegit).length;
    const caixa = document.createElement("div");
    caixa.className = "targeta";
    const data_ = d => new Date(d).toLocaleString(LANG === "es" ? "es-ES" : "ca-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    caixa.innerHTML = `<h2>✉️ ${L("Missatges de la web", "Mensajes de la web")}${noLlegits ? ` <span class="xip coral" style="margin-left:6px">${noLlegits} ${noLlegits === 1 ? L("nou", "nuevo") : L("nous", "nuevos")}</span>` : ""}</h2>
      ${msgs.length ? msgs.slice(0, 30).map(m => `<div class="doc" style="align-items:flex-start;flex-wrap:wrap;${m.llegit ? "opacity:.65" : ""}">
          <div class="n" style="min-width:220px"><b>${esc(m.nom)}${m.agencia ? " · " + esc(m.agencia) : ""}</b>
            <span class="meta"><a href="mailto:${esc(m.email)}">${esc(m.email)}</a>${m.telefon ? " · " + esc(m.telefon) : ""} · ${data_(m.created_at)}</span>
            <div style="white-space:pre-wrap;margin-top:6px">${esc(m.missatge)}</div></div>
          <div class="fila">
            <a class="mini" href="mailto:${esc(m.email)}?subject=${encodeURIComponent("Anonta")}">${L("Respon", "Responder")}</a>
            <button class="mini" type="button" data-llegit="${m.id}" data-v="${m.llegit ? 0 : 1}">${m.llegit ? L("Marca com a nou", "Marcar como nuevo") : L("✓ Llegit", "✓ Leído")}</button>
          </div></div>`).join("")
        : `<p class="meta" style="margin:0">${L("Encara no n'ha arribat cap.", "Todavía no ha llegado ninguno.")}</p>`}`;
    const llista = $("agLlista");
    if(llista) llista.before(caixa); else pantalla.appendChild(caixa);
    caixa.querySelectorAll("[data-llegit]").forEach(b => b.onclick = async () => {
      const { error } = await sb.rpc("ag_contacte_llegit", { p_id: b.dataset.llegit, p_llegit: b.dataset.v === "1" });
      if(error) return avis(errMsg(error), true);
      vistaAgencies();
    });
  };
})();
