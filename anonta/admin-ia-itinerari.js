// Anonta · Proposar l'itinerari dia a dia amb IA (pestanya «Itinerari» del panell)
// La IA llegeix els serveis del viatge (vols, hotels, trasllats, excursions…) i proposa cada dia
// amb el títol, el text i les activitats amb hora. L'agent ho revisa i tria quins dies afegeix o substitueix.
(function(){
  const base = subItinerari;

  subItinerari = async function(cont, v){
    if(cont.id === "itBase") return base(cont, v);   // recàrrega interna de la llista de dies
    cont.innerHTML = `<div id="itIA"></div><div id="itBase"></div>`;
    const caixa = $("itIA");
    if(!teIA()){
      caixa.innerHTML = `<div class="targeta" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">
        <div><b>✨ ${L("Itinerari amb IA", "Itinerario con IA")}</b><div class="meta">${L(`Inclòs al pla <b>Prèmium</b> (${PREU.premium} €/mes + IVA). Escriu-nos a admin@rimuviatges.com per canviar de pla.`,
          `Incluido en el plan <b>Prémium</b> (${PREU.premium} €/mes + IVA). Escríbenos a admin@rimuviatges.com para cambiar de plan.`)}</div></div></div>`;
    } else {
      caixa.innerHTML = `<div class="targeta" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap">
        <div><b>✨ ${L("Itinerari amb IA", "Itinerario con IA")}</b><div class="meta">${L("Et proposa cada dia a partir dels vols, l'allotjament i les activitats contractades. Tu tries què afegeixes.",
          "Te propone cada día a partir de los vuelos, el alojamiento y las actividades contratadas. Tú eliges qué añades.")}</div></div>
        <button class="boto petit" type="button" id="bIAit">${L("Proposa l'itinerari", "Proponer el itinerario")}</button></div>`;
      $("bIAit").onclick = () => obrir(v, () => subItinerari(cont, v));
    }
    await base($("itBase"), v);
  };

  async function idiomaTitular(viatgeId){
    const { data } = await sb.from("an_viatge_clients").select("titular, an_clients(idioma)").eq("viatge_id", viatgeId);
    const t = (data || []).find(x => x.titular) || (data || [])[0];
    return t?.an_clients?.idioma || LANG;
  }

  async function obrir(v, enAcabar){
    if(!v.data_inici || !v.data_fi) return avis(L("Primer posa les dates del viatge (pestanya Dades).", "Primero pon las fechas del viaje (pestaña Datos)."), true);
    const { count } = await sb.from("an_serveis").select("id", { count: "exact", head: true }).eq("viatge_id", v.id);
    const idioma = await idiomaTitular(v.id);
    modal(`<h2>✨ ${L("Proposar l'itinerari amb IA", "Proponer el itinerario con IA")}</h2>
      ${!count ? `<p class="avis" style="margin-top:0">${L("Aquest viatge encara no té serveis. La IA funciona molt millor si primer hi poses els vols, l'allotjament i les activitats.",
        "Este viaje todavía no tiene servicios. La IA funciona mucho mejor si primero pones los vuelos, el alojamiento y las actividades.")}</p>` : ""}
      <p class="meta" style="margin-top:0">${L("Farà servir els horaris dels vols, l'allotjament de cada nit i les activitats amb dia i hora.",
        "Usará los horarios de los vuelos, el alojamiento de cada noche y las actividades con día y hora.")}</p>
      <div class="camp"><label>${L("Idioma", "Idioma")}</label><select id="iaIdioma">
        <option value="ca"${idioma === "ca" ? " selected" : ""}>Català</option><option value="es"${idioma === "es" ? " selected" : ""}>Castellano</option></select></div>
      <div class="camp"><label>${L("Notes per a la IA", "Notas para la IA")} <span class="opc">(${L("opcional", "opcional")})</span></label>
        <textarea id="iaNotes" rows="3" placeholder="${L("Ex.: família amb dos nens petits, ritme tranquil, aniversari el dia 3…", "Ej.: familia con dos niños pequeños, ritmo tranquilo, aniversario el día 3…")}"></textarea></div>
      <label class="check"><input type="checkbox" id="iaSuggerir" checked> ${L("Suggereix què fer a les estones lliures", "Sugiere qué hacer en los ratos libres")}</label>
      <div class="fila" style="margin-top:14px"><button class="boto" type="button" id="iaFes">${L("Proposa", "Proponer")}</button><button class="boto sec" type="button" data-tanca>${L("Cancel·la", "Cancelar")}</button></div>
      <p class="meta" id="iaEstat"></p>`, m => {
      m.querySelector("#iaFes").onclick = async () => {
        const b = m.querySelector("#iaFes"); b.disabled = true;
        m.querySelector("#iaEstat").textContent = L("Preparant l'itinerari… pot trigar un minut o dos, no tanquis la finestra.", "Preparando el itinerario… puede tardar uno o dos minutos, no cierres la ventana.");
        const r = await crida({ viatge_id: v.id, idioma: m.querySelector("#iaIdioma").value, notes: m.querySelector("#iaNotes").value, suggerir: m.querySelector("#iaSuggerir").checked });
        if(!r.ok){ b.disabled = false; m.querySelector("#iaEstat").textContent = ""; return avis(r.msg, true); }
        if(!r.dies.length){ b.disabled = false; m.querySelector("#iaEstat").textContent = ""; return avis(L("La IA no ha proposat cap dia. Torna-ho a provar.", "La IA no ha propuesto ningún día. Vuelve a intentarlo."), true); }
        const triat = m.querySelector("#iaIdioma").value;
        tancarModal();
        revisar(v, r.dies, triat, enAcabar);
      };
    });
  }

  async function revisar(v, dies, idioma, enAcabar){
    const { data: existents } = await sb.from("an_dies").select("id, data, titol, descripcio, ordre, an_activitats(id)").eq("viatge_id", v.id);
    const perData = new Map((existents || []).filter(d => d.data).map(d => [d.data, d]));
    const teContingut = d => d && (d.descripcio || (d.an_activitats || []).length || !/^(Dia|Día) \d+$/.test(d.titol || ""));
    const SUG = idioma === "es" ? "Sugerencia" : "Suggeriment";
    modal(`<h2>✨ ${L("Proposta d'itinerari", "Propuesta de itinerario")}</h2>
      <p class="avis" style="margin-top:0">${L("Revisa-ho abans de publicar: la IA pot equivocar-se. Marca els dies que vols fer servir; després ho podràs editar tot.",
        "Revísalo antes de publicar: la IA puede equivocarse. Marca los días que quieres usar; después podrás editarlo todo.")}</p>
      <div style="max-height:60vh;overflow:auto">
      ${dies.map((d, i) => { const ex = perData.get(d.data), ple = teContingut(ex); return `
        <div class="targeta" style="margin:0 0 10px">
          <label class="check" style="align-items:flex-start"><input type="checkbox" data-i="${i}"${ple ? "" : " checked"}>
            <span><b>${esc(AN.dataLlarga(d.data, LANG))} · ${esc(d.titol)}</b>
            ${ple ? `<br><span class="meta" style="color:#B3261E">${L("Aquest dia ja té contingut: si el marques, se substituirà (la foto es manté).", "Este día ya tiene contenido: si lo marcas, se sustituirá (la foto se mantiene).")}</span>` : ""}</span></label>
          ${d.descripcio ? `<p style="margin:8px 0">${esc(d.descripcio)}</p>` : ""}
          ${d.activitats.length ? `<ul style="margin:6px 0 0;padding-left:18px">${d.activitats.map(a => `<li>${a.suggeriment ? "💡 " : ""}${a.hora ? `<b>${esc(a.hora)}</b> · ` : ""}${esc(a.nom)}${a.lloc ? ` <span class="meta">· ${esc(a.lloc)}</span>` : ""}</li>`).join("")}</ul>` : ""}
        </div>`; }).join("")}
      </div>
      <p class="meta">💡 = ${L("suggeriment per a una estona lliure (no inclòs al viatge)", "sugerencia para un rato libre (no incluido en el viaje)")}</p>
      <div class="fila"><button class="boto" type="button" id="iaAplica">${L("Afegeix els dies marcats", "Añadir los días marcados")}</button><button class="boto sec" type="button" data-tanca>${L("Cancel·la", "Cancelar")}</button></div>`, m => {
      m.querySelector("#iaAplica").onclick = async () => {
        const tria = [...m.querySelectorAll("[data-i]:checked")].map(c => dies[+c.dataset.i]);
        if(!tria.length) return avis(L("No has marcat cap dia.", "No has marcado ningún día."), true);
        const b = m.querySelector("#iaAplica"); b.disabled = true; b.textContent = L("Desant…", "Guardando…");
        try{
          for(const d of tria){
            const acts = d.activitats.map((a, k) => ({
              hora: a.hora || null,
              nom: (a.suggeriment ? "💡 " : "") + a.nom,
              lloc: a.lloc || null,
              descripcio: [a.descripcio, a.suggeriment ? `(${SUG}, ${idioma === "es" ? "no incluido en el viaje" : "no inclòs al viatge"}.)` : ""].filter(Boolean).join(" ") || null,
              ordre: k + 1
            }));
            let diaId;
            const ex = perData.get(d.data);
            if(ex){
              const { error } = await sb.from("an_dies").update({ titol: d.titol, descripcio: d.descripcio }).eq("id", ex.id);
              if(error) throw error;
              const { error: e2 } = await sb.from("an_activitats").delete().eq("dia_id", ex.id);
              if(e2) throw e2;
              diaId = ex.id;
            } else {
              const { data, error } = await sb.from("an_dies").insert({ viatge_id: v.id, data: d.data, titol: d.titol, descripcio: d.descripcio, ordre: 0 }).select("id").single();
              if(error) throw error;
              diaId = data.id;
            }
            if(acts.length){
              const { error } = await sb.from("an_activitats").insert(acts.map(a => ({ ...a, dia_id: diaId })));
              if(error) throw error;
            }
          }
          // ordena tots els dies per data
          const { data: tots } = await sb.from("an_dies").select("id, data, ordre").eq("viatge_id", v.id);
          const ord = (tots || []).slice().sort((a, b) => (a.data || "9999").localeCompare(b.data || "9999") || (a.ordre || 0) - (b.ordre || 0));
          for(let k = 0; k < ord.length; k++) if(ord[k].ordre !== k + 1) await sb.from("an_dies").update({ ordre: k + 1 }).eq("id", ord[k].id);
          tancarModal();
          avis(L(`${tria.length} dia(es) afegit(s) a l'itinerari ✓`, `${tria.length} día(s) añadido(s) al itinerario ✓`));
          enAcabar && enAcabar();
        }catch(e){
          b.disabled = false; b.textContent = L("Afegeix els dies marcats", "Añadir los días marcados");
          avis(errMsg(e), true);
        }
      };
    });
  }

  async function crida(cos){
    const MSG = {
      FALTA_CLAU: L("La IA no està configurada. Avisa'ns a admin@rimuviatges.com.", "La IA no está configurada. Avísanos en admin@rimuviatges.com."),
      NO_PERMIS: L("No tens permís. Torna a entrar al panell.", "No tienes permiso. Vuelve a entrar en el panel."),
      SENSE_IA: L(`La IA només és al pla Prèmium (${PREU.premium} €/mes + IVA).`, `La IA solo está en el plan Prémium (${PREU.premium} €/mes + IVA).`),
      FALTEN_DATES: L("Primer posa les dates del viatge.", "Primero pon las fechas del viaje."),
      MASSA_DIES: L("La IA pot preparar viatges de fins a 31 dies.", "La IA puede preparar viajes de hasta 31 días."),
      ERROR_IA: L("La IA no ha pogut respondre ara. Torna-ho a provar d'aquí a una estona.", "La IA no ha podido responder ahora. Vuelve a intentarlo dentro de un rato.")
    };
    try{
      const { data, error } = await sb.functions.invoke("anonta-itinerari", { body: cos });
      let codi = data?.error;
      if(error){ try{ codi = (await error.context.json()).error; }catch{ codi = codi || "ERROR_IA"; } }
      if(codi) return { ok: false, msg: MSG[codi] || L("No s'ha pogut fer. Torna-ho a provar.", "No se ha podido hacer. Vuelve a intentarlo.") };
      return { ok: true, dies: data?.dies || [] };
    }catch(e){ return { ok: false, msg: errMsg(e) }; }
  }
})();
