// Anonta · Panell: documents lligats als serveis del viatge
// - A «Documents», en pujar o editar un document es poden triar els serveis als quals pertany
// - A «Serveis», cada servei mostra els seus documents i se n'hi poden lligar o pujar de nous
(function(){
  const nomServei = s => {
    const ico = AN.TIPUS_SERVEI[s.tipus]?.ico || "";
    if(s.tipus === "vol") return `${ico} ${SRV.titolVol(s) || L("Vol", "Vuelo")}${s.extra?.numero ? " · " + s.extra.numero : ""}`;
    return `${ico} ${s.titol || L("(sense nom)", "(sin nombre)")}`;
  };
  const catPerTipus = { vol: "bitllet", hotel: "bo", circuit: "bo", excursio: "bo", trasllat: "bo", asseguranca: "asseguranca" };
  const carregarServeis = async v => {
    const { data } = await sb.from("an_serveis").select("*").eq("viatge_id", v.id)
      .order("data_inici", { ascending: true, nullsFirst: false }).order("hora_inici", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true });
    return data || [];
  };
  const checksServeis = (serveis, marcats = []) => serveis.length
    ? `<div class="checks-serveis">${serveis.map(s => `<label class="check"><input type="checkbox" data-srv="${s.id}"${marcats.includes(s.id) ? " checked" : ""}> <span>${esc(nomServei(s))}</span></label>`).join("")}</div>`
    : `<p class="meta">${L("Aquest viatge encara no té serveis.", "Este viaje todavía no tiene servicios.")}</p>`;
  const llegirChecks = el => [...el.querySelectorAll("[data-srv]:checked")].map(i => i.dataset.srv);
  const obreDoc = async path => {
    const w = window.open("", "_blank");
    const { data, error } = await sb.storage.from(AN.BUCKET).createSignedUrl(path, 300);
    if(error || !data){ w && w.close(); return avis(L("No s'ha pogut obrir.", "No se ha podido abrir."), true); }
    if(w) w.location = data.signedUrl; else location.href = data.signedUrl;
  };
  async function pujarFitxers(v, fits, cat, serveis, estat){
    let ok = 0;
    for(const f of fits){
      if(estat) estat.textContent = L(`Pujant ${ok + 1} de ${fits.length}…`, `Subiendo ${ok + 1} de ${fits.length}…`);
      if(f.size > 25 * 1024 * 1024){ avis(L(`«${f.name}» fa més de 25 MB.`, `«${f.name}» ocupa más de 25 MB.`), true); continue; }
      const ruta = `${v.id}/docs/${uuid()}-${AN.nomFitxerSegur(f.name)}`;
      const { error } = await sb.storage.from(AN.BUCKET).upload(ruta, f, { contentType: f.type || "application/octet-stream" });
      if(error){ avis(errMsg(error), true); continue; }
      const nom = f.name.replace(/\.[^.]+$/, "");
      const { error: e2 } = await sb.from("an_documents").insert({ viatge_id: v.id, nom, categoria: cat, path: ruta, mida: f.size, serveis });
      if(e2){ await sb.storage.from(AN.BUCKET).remove([ruta]); avis(errMsg(e2), true); continue; }
      ok++;
    }
    if(estat) estat.textContent = "";
    return ok;
  }

  // ---------- Pestanya «Documents» ----------
  subDocuments = async function(cont, v){
    const [{ data: docs, error }, serveis] = await Promise.all([
      sb.from("an_documents").select("*").eq("viatge_id", v.id).order("created_at"),
      carregarServeis(v)
    ]);
    if(error){ cont.innerHTML = `<div class="error">${esc(errMsg(error))}</div>`; return; }
    const perId = new Map(serveis.map(s => [s.id, s]));
    const serveisDe = d => (d.serveis || []).map(id => perId.get(id)).filter(Boolean);
    cont.innerHTML = `
      <div class="targeta">
        <h2>${L("Pujar documents", "Subir documentos")}</h2>
        <div class="graella">
          <div class="camp"><label>${L("Tipus", "Tipo")}</label><select id="docCat">${opcions(AN.CATEGORIA_DOC, "bitllet")}</select></div>
          <div class="camp"><label>${L("Fitxers", "Archivos")}</label><input type="file" id="docFit" multiple></div>
          <div class="camp ample"><label>${L("De quin servei és?", "¿De qué servicio es?")} <span class="opc">(${L("opcional, en pots marcar més d'un", "opcional, puedes marcar más de uno")})</span></label>
            <div id="docSrv">${checksServeis(serveis)}</div>
            <div class="ajuda">${L("El client el veurà dins d'aquest servei, sense haver d'obrir els documents un per un.", "El cliente lo verá dentro de este servicio, sin tener que abrir los documentos uno a uno.")}</div></div>
        </div>
        <p class="ajuda">${L("Pots triar-ne diversos alhora (PDF, fotos…). Màxim 25 MB per fitxer. No hi pugis passaports ni DNI.",
          "Puedes elegir varios a la vez (PDF, fotos…). Máximo 25 MB por archivo. No subas pasaportes ni DNI.")}</p>
        <button class="boto petit" type="button" id="bPuja">${L("Puja", "Subir")}</button> <span class="meta" id="docEstat"></span>
      </div>
      <div class="targeta">
        <h2>${L("Documents del viatge", "Documentos del viaje")}</h2>
        ${(docs || []).length ? docs.map(d => { const sv = serveisDe(d); return `
          <div class="doc">
            <span style="font-size:22px">${AN.CATEGORIA_DOC[d.categoria]?.ico || "📎"}</span>
            <div class="n"><b>${esc(d.nom)}</b><span class="meta">${lbl(AN.CATEGORIA_DOC[d.categoria])} · ${AN.mida(d.mida)}</span>
              ${sv.length ? `<span class="meta" style="display:block">🔗 ${sv.map(s => esc(nomServei(s))).join(" · ")}</span>` : ""}</div>
            <label class="check" style="white-space:nowrap"><input type="checkbox" data-vis="${d.id}"${d.visible ? " checked" : ""}> ${L("Visible", "Visible")}</label>
            <button class="mini" type="button" data-obre="${esc(d.path)}">${L("Obre", "Abrir")}</button>
            <button class="mini" type="button" data-nom="${d.id}">✎</button>
            <button class="mini perill" type="button" data-esb="${d.id}">✕</button>
          </div>`; }).join("") : `<p class="meta">${L("Encara no hi ha documents.", "Todavía no hay documentos.")}</p>`}
        <p class="ajuda">${L("Si treus «Visible», el document queda guardat però el client no el veu. Amb ✎ pots canviar-ne el nom, el tipus i els serveis.",
          "Si quitas «Visible», el documento queda guardado pero el cliente no lo ve. Con ✎ puedes cambiar el nombre, el tipo y los servicios.")}</p>
      </div>`;
    $("bPuja").onclick = async () => {
      const fits = [...$("docFit").files];
      if(!fits.length) return avis(L("Tria algun fitxer.", "Elige algún archivo."), true);
      $("bPuja").disabled = true;
      const ok = await pujarFitxers(v, fits, $("docCat").value, llegirChecks($("docSrv")), $("docEstat"));
      avis(L(`${ok} document(s) pujat(s) ✓`, `${ok} documento(s) subido(s) ✓`));
      subDocuments(cont, v);
    };
    cont.querySelectorAll("[data-vis]").forEach(c => c.onchange = async () => {
      const { error } = await sb.from("an_documents").update({ visible: c.checked }).eq("id", c.dataset.vis);
      if(error) avis(errMsg(error), true);
    });
    cont.querySelectorAll("[data-obre]").forEach(b => b.onclick = () => obreDoc(b.dataset.obre));
    cont.querySelectorAll("[data-nom]").forEach(b => b.onclick = () => {
      const d = docs.find(x => x.id === b.dataset.nom);
      modal(`<h2>${L("Canviar el document", "Cambiar el documento")}</h2>
        <div class="camp"><label>${L("Nom que veu el client", "Nombre que ve el cliente")}</label><input id="mNom" value="${esc(d.nom)}"></div>
        <div class="camp"><label>${L("Tipus", "Tipo")}</label><select id="mCat">${opcions(AN.CATEGORIA_DOC, d.categoria)}</select></div>
        <div class="camp"><label>${L("Serveis", "Servicios")}</label><div id="mSrv">${checksServeis(serveis, d.serveis || [])}</div></div>
        <div class="fila"><button class="boto" type="button" id="mDesa">${L("Desa", "Guardar")}</button><button class="boto sec" type="button" data-tanca>${L("Cancel·la", "Cancelar")}</button></div>`, m => {
        m.querySelector("#mDesa").onclick = async () => {
          const nom = m.querySelector("#mNom").value.trim();
          if(!nom) return;
          const { error } = await sb.from("an_documents").update({ nom, categoria: m.querySelector("#mCat").value, serveis: llegirChecks(m.querySelector("#mSrv")) }).eq("id", d.id);
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
  };

  // ---------- Pestanya «Serveis»: documents de cada servei ----------
  const serveisAnterior = subServeis;
  subServeis = async function(cont, v){
    await serveisAnterior(cont, v);
    const [serveis, { data: docs }] = await Promise.all([
      carregarServeis(v),
      sb.from("an_documents").select("id, nom, categoria, path, visible, serveis").eq("viatge_id", v.id).order("created_at")
    ]);
    const tots = docs || [];
    const fitxes = [...cont.querySelectorAll(".llista > details")];
    serveis.forEach((s, i) => {
      const el = fitxes[i];
      if(!el) return;
      const bloc = document.createElement("div");
      bloc.className = "docs-servei-adm";
      el.querySelector(".el-cos")?.appendChild(bloc);
      pintaBloc(bloc, el, s, tots, v);
    });
  };

  function pintaBloc(bloc, el, s, tots, v){
    const meus = tots.filter(d => (d.serveis || []).includes(s.id));
    const altres = tots.filter(d => !(d.serveis || []).includes(s.id));
    // comptador a la capçalera del servei
    const sum = el.querySelector("summary");
    sum.querySelector(".xip-docs")?.remove();
    if(meus.length) sum.querySelector(".n")?.insertAdjacentHTML("beforeend", ` <span class="xip-docs">📎 ${meus.length}</span>`);
    bloc.innerHTML = `
      <div style="font-weight:600;margin-bottom:6px">📎 ${L("Documents d'aquest servei", "Documentos de este servicio")}</div>
      ${meus.length ? meus.map(d => `<div class="doc" style="padding:6px 0">
          <span>${AN.CATEGORIA_DOC[d.categoria]?.ico || "📎"}</span>
          <div class="n"><b>${esc(d.nom)}</b>${d.visible ? "" : `<span class="meta">${L("No visible per al client", "No visible para el cliente")}</span>`}</div>
          <button class="mini" type="button" data-obre="${esc(d.path)}">${L("Obre", "Abrir")}</button>
          <button class="mini perill" type="button" data-treu="${d.id}" title="${L("Deslliga'l d'aquest servei (no s'esborra)", "Desvincúlalo de este servicio (no se borra)")}">${L("Treu", "Quitar")}</button>
        </div>`).join("") : `<p class="meta" style="margin:0 0 6px">${L("Encara no n'hi ha cap.", "Todavía no hay ninguno.")}</p>`}
      <div class="fila" style="margin-top:6px;flex-wrap:wrap;gap:8px">
        ${altres.length ? `<select data-tria style="flex:1;min-width:180px"><option value="">${L("Lliga un document ja pujat…", "Vincula un documento ya subido…")}</option>
          ${altres.map(d => `<option value="${d.id}">${AN.CATEGORIA_DOC[d.categoria]?.ico || "📎"} ${esc(d.nom)}</option>`).join("")}</select>
          <button class="boto sec petit" type="button" data-lliga>${L("Lliga", "Vincular")}</button>` : ""}
        <label class="boto sec petit" style="cursor:pointer">⬆️ ${L("Puja'n un de nou", "Sube uno nuevo")}<input type="file" data-puja multiple hidden></label>
        <span class="meta" data-estat></span>
      </div>`;
    const refresca = async () => {
      const { data } = await sb.from("an_documents").select("id, nom, categoria, path, visible, serveis").eq("viatge_id", v.id).order("created_at");
      tots.splice(0, tots.length, ...(data || []));
      // refresca tots els blocs, perquè la llista «ja pujats» canvia per a tots els serveis
      const cont = el.closest(".llista");
      cont?.querySelectorAll(".docs-servei-adm").forEach(b => b._pinta && b._pinta());
    };
    bloc._pinta = () => pintaBloc(bloc, el, s, tots, v);
    const desa = async (d, serveis) => {
      const { error } = await sb.from("an_documents").update({ serveis }).eq("id", d.id);
      if(error){ avis(errMsg(error), true); return false; }
      return true;
    };
    bloc.querySelectorAll("[data-obre]").forEach(b => b.onclick = () => obreDoc(b.dataset.obre));
    bloc.querySelectorAll("[data-treu]").forEach(b => b.onclick = async () => {
      const d = tots.find(x => x.id === b.dataset.treu);
      if(await desa(d, (d.serveis || []).filter(x => x !== s.id))){ avis(L("Document deslligat ✓", "Documento desvinculado ✓")); refresca(); }
    });
    const bL = bloc.querySelector("[data-lliga]");
    if(bL) bL.onclick = async () => {
      const id = bloc.querySelector("[data-tria]").value;
      if(!id) return avis(L("Tria un document de la llista.", "Elige un documento de la lista."), true);
      const d = tots.find(x => x.id === id);
      if(await desa(d, [...(d.serveis || []), s.id])){ avis(L("Document lligat ✓", "Documento vinculado ✓")); refresca(); }
    };
    bloc.querySelector("[data-puja]").onchange = async ev => {
      const fits = [...ev.target.files];
      if(!fits.length) return;
      const ok = await pujarFitxers(v, fits, catPerTipus[s.tipus] || "altre", [s.id], bloc.querySelector("[data-estat]"));
      if(ok) avis(L(`${ok} document(s) pujat(s) ✓`, `${ok} documento(s) subido(s) ✓`));
      refresca();
    };
  }

  const css = document.createElement("style");
  css.textContent = `.checks-serveis{display:flex;flex-direction:column;gap:4px;max-height:220px;overflow:auto}
    .docs-servei-adm{margin-top:14px;padding-top:12px;border-top:1px dashed var(--vora,#d9dee5)}
    .xip-docs{font-size:12px;font-weight:600;background:var(--fons-clar,#eef2f7);border-radius:999px;padding:2px 8px;margin-left:4px;white-space:nowrap}`;
  document.head.appendChild(css);
})();
