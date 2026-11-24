// Anonta · Omplir l'apartat «Destí» amb IA (s'afegeix al panell de l'agència)
(function(){
  const base = subDesti;

  subDesti = async function(cont, v){
    cont.innerHTML = `
      <div class="targeta" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">
        <div><b>✨ ${L("Omplir amb IA", "Rellenar con IA")}</b><div class="meta">${L("Et proposa informació pràctica, consells, llocs, on menjar… Tu tries què afegeixes.", "Te propone información práctica, consejos, lugares, dónde comer… Tú eliges qué añades.")}</div></div>
        <button class="boto petit" type="button" id="bIA">${L("Proposa recomanacions", "Proponer recomendaciones")}</button>
      </div>
      <div id="destiLlista"></div>`;
    $("bIA").onclick = () => obrirIA(v, () => subDesti(cont, v));
    base($("destiLlista"), v);
  };

  async function idiomaTitular(viatgeId){
    const { data } = await sb.from("an_viatge_clients").select("titular, an_clients(idioma)").eq("viatge_id", viatgeId);
    const t = (data || []).find(x => x.titular) || (data || [])[0];
    return t?.an_clients?.idioma || LANG;
  }

  async function obrirIA(v, enAcabar){
    const idioma = await idiomaTitular(v.id);
    const cats = Object.entries(AN.CATEGORIA_DESTI);
    modal(`<h2>✨ ${L("Recomanacions amb IA", "Recomendaciones con IA")}</h2>
      <div class="camp"><label>${L("Destinació", "Destino")}</label><input id="iaDesti" value="${esc([v.desti, v.pais].filter(Boolean).join(", "))}" placeholder="${L("Ex.: Kyoto, Japó", "Ej.: Kioto, Japón")}"></div>
      <div class="camp"><label>${L("Idioma dels textos", "Idioma de los textos")}</label><select id="iaIdioma">
        <option value="ca"${idioma === "ca" ? " selected" : ""}>Català</option><option value="es"${idioma === "es" ? " selected" : ""}>Castellano</option></select></div>
      <div class="camp"><label>${L("Què vols que et proposi?", "¿Qué quieres que te proponga?")}</label>
        ${cats.map(([k, c]) => `<label class="check" style="margin-bottom:6px"><input type="checkbox" class="iaCat" value="${k}" checked> ${c.ico} ${esc(c[LANG] || c.ca)}</label>`).join("")}</div>
      <div class="camp"><label>${L("Detalls dels viatgers", "Detalles de los viajeros")} <span class="opc">(opcional)</span></label>
        <textarea id="iaNotes" placeholder="${L("Ex.: Família amb dos nens de 8 i 11 anys. Els agrada la natura i la gastronomia. Primer cop al país.", "Ej.: Familia con dos niños de 8 y 11 años. Les gusta la naturaleza y la gastronomía. Primera vez en el país.")}"></textarea></div>
      <div class="fila"><button class="boto" type="button" id="iaGenera">${L("Genera", "Generar")}</button><button class="boto sec" type="button" data-tanca>${L("Cancel·la", "Cancelar")}</button></div>
      <div id="iaEstat" class="meta" style="margin-top:10px"></div>`, m => {
      m.querySelector("#iaGenera").onclick = async () => {
        const desti = m.querySelector("#iaDesti").value.trim();
        const categories = [...m.querySelectorAll(".iaCat:checked")].map(x => x.value);
        if(!desti) return avis(L("Escriu la destinació.", "Escribe el destino."), true);
        if(!categories.length) return avis(L("Tria almenys un apartat.", "Elige al menos un apartado."), true);
        const b = m.querySelector("#iaGenera"); b.disabled = true;
        m.querySelector("#iaEstat").textContent = L("Preparant les recomanacions… pot trigar uns 30 segons.", "Preparando las recomendaciones… puede tardar unos 30 segundos.");
        const r = await cridaIA({ desti, idioma: m.querySelector("#iaIdioma").value, categories,
          notes: m.querySelector("#iaNotes").value.trim(), data_inici: v.data_inici, data_fi: v.data_fi });
        b.disabled = false;
        if(!r.ok){ m.querySelector("#iaEstat").textContent = ""; return avis(r.msg, true); }
        if(!r.items.length){ m.querySelector("#iaEstat").textContent = L("No ha sortit cap proposta. Torna-ho a provar.", "No ha salido ninguna propuesta. Vuelve a intentarlo."); return; }
        triar(v, r.items, enAcabar);
      };
    });
  }

  function triar(v, items, enAcabar){
    const grups = {};
    items.forEach((x, i) => (grups[x.categoria] = grups[x.categoria] || []).push({ ...x, i }));
    modal(`<h2>${L("Tria què vols afegir", "Elige qué quieres añadir")}</h2>
      <p class="avis" style="margin-top:0">${L("Revisa-ho abans de publicar: la IA pot equivocar-se. Després ho podràs editar tot i posar-hi fotos.", "Revísalo antes de publicar: la IA puede equivocarse. Después podrás editarlo todo y añadir fotos.")}</p>
      ${Object.keys(AN.CATEGORIA_DESTI).filter(k => grups[k]).map(k => `
        <h3>${AN.CATEGORIA_DESTI[k].ico} ${esc(AN.CATEGORIA_DESTI[k][LANG] || AN.CATEGORIA_DESTI[k].ca)}</h3>
        ${grups[k].map(x => `<label class="check" style="margin-bottom:10px"><input type="checkbox" class="iaTria" value="${x.i}" checked>
          <span><b>${esc(x.titol)}</b><br><span style="font-size:14px">${esc(x.descripcio)}</span>${x.adreca ? `<br><span class="meta">📍 ${esc(x.adreca)}</span>` : ""}</span></label>`).join("")}`).join("")}
      <div class="fila" style="margin-top:12px"><button class="boto" type="button" id="iaAfegeix">${L("Afegeix els marcats", "Añadir los marcados")}</button><button class="boto sec" type="button" data-tanca>${L("Cancel·la", "Cancelar")}</button></div>`, m => {
      m.querySelector("#iaAfegeix").onclick = async () => {
        const tries = [...m.querySelectorAll(".iaTria:checked")].map(x => items[Number(x.value)]);
        if(!tries.length) return avis(L("No n'has marcat cap.", "No has marcado ninguno."), true);
        const { data: ult } = await sb.from("an_desti").select("ordre").eq("viatge_id", v.id).order("ordre", { ascending: false }).limit(1);
        let ordre = ult?.[0]?.ordre || 0;
        const files = tries.map(x => ({ viatge_id: v.id, categoria: x.categoria, titol: x.titol, descripcio: x.descripcio || null,
                                        adreca: x.adreca || null, ordre: ++ordre }));
        const { error } = await sb.from("an_desti").insert(files);
        if(error) return avis(errMsg(error), true);
        tancarModal();
        avis(L(`${files.length} recomanacions afegides ✓`, `${files.length} recomendaciones añadidas ✓`));
        enAcabar();
      };
    });
  }

  async function cridaIA(cos){
    const MSG = {
      FALTA_CLAU: L("La IA no està configurada. Avisa'ns a admin@rimuviatges.com.", "La IA no está configurada. Avísanos en admin@rimuviatges.com."),
      NO_PERMIS: L("No tens permís. Torna a entrar al panell.", "No tienes permiso. Vuelve a entrar en el panel."),
      ERROR_IA: L("La IA no ha pogut respondre ara. Torna-ho a provar d'aquí a una estona.", "La IA no ha podido responder ahora. Vuelve a intentarlo dentro de un rato.")
    };
    try{
      const { data, error } = await sb.functions.invoke("anonta-desti", { body: cos });
      let codi = data?.error;
      if(error){ try{ codi = (await error.context.json()).error; }catch{} }
      if(codi) return { ok: false, msg: MSG[codi] || L("No s'ha pogut fer. Torna-ho a provar.", "No se ha podido hacer. Vuelve a intentarlo.") };
      return { ok: true, items: data?.items || [] };
    }catch(e){ return { ok: false, msg: errMsg(e) }; }
  }
})();
