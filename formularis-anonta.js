// Formularis · Connexió amb Anonta i amb el panell comú.
//  - Enllaç «Totes les meves apps» (panell d'Anonta).
//  - Botó «Passar a Anonta» als formularis rebuts: crea o actualitza els clients d'Anonta amb les dades
//    i, si es tria un viatge, els hi afegeix i hi copia les fotos del DNI i del passaport (sense que el client les vegi).
(function(){
  const T = (ca, es) => (t && t.locale === "es") ? es : ca;
  let teAnonta = null;

  // Enllaç al panell comú, al costat de «Tancar sessió»
  const sortir = document.getElementById("lnkSortir");
  if(sortir){
    sortir.insertAdjacentHTML("beforebegin", `<a href="anonta/admin.html#apps" id="lnkApps" style="color:var(--blau);font-size:14px;margin-right:18px"></a>`);
  }
  const posaTextos = () => { const l = document.getElementById("lnkApps"); if(l) l.textContent = T("🧩 Totes les meves apps", "🧩 Todas mis apps"); };
  posaTextos();

  const original = pintarLlista;
  pintarLlista = function(){
    original();
    posaTextos();
    afegir();
  };

  async function afegir(){
    if(!P) return;
    if(teAnonta === null){ const { data } = await sb.rpc("an_perfil"); teAnonta = !!data; }
    if(!teAnonta) return;
    $("llista").querySelectorAll("[data-veure]").forEach(b => {
      const f = dadesLlista.find(x => x.id === b.dataset.veure), fila = b.closest(".fila-botons");
      if(!f || !fila || f.estat !== "rebut" || f.agencia !== P.agencia.id || fila.querySelector("[data-anonta]")) return;
      fila.insertAdjacentHTML("beforeend", `<button class="boto sec petit" data-anonta="${f.id}">${T("🧳 Passar a Anonta", "🧳 Pasar a Anonta")}</button>`);
      fila.querySelector("[data-anonta]").onclick = () => obrir(f);
    });
  }

  async function obrir(f){
    const id = f.id, det = $("det_" + id); if(!det) return;
    let box = $("an_" + id);
    if(box){ box.remove(); return; }
    det.insertAdjacentHTML("afterend", `<div id="an_${id}"></div>`);
    box = $("an_" + id);
    box.innerHTML = `<div class="meta" style="margin-top:10px">${esc(t.carregant)}</div>`;
    const { data: viatges } = await sb.from("an_viatges").select("id,titol,data_inici").order("data_inici", { ascending: false, nullsFirst: true });
    const teFotos = f.viatgers.some(v => v.foto_dni || v.foto_passaport);
    box.innerHTML = `<div style="margin-top:12px;border:1px solid var(--linia);border-radius:12px;padding:14px;background:var(--blau-clar)">
      <strong style="color:var(--blau)">${T("Passar a Anonta", "Pasar a Anonta")}</strong>
      <p class="meta" style="margin:6px 0 10px">${T("Es crearan (o s'actualitzaran) els clients a Anonta amb aquestes dades. Si ja hi eren, només s'omple el que hi faltava o ha canviat.",
        "Se crearán (o se actualizarán) los clientes en Anonta con estos datos. Si ya estaban, solo se rellena lo que faltaba o ha cambiado.")}</p>
      <label>${T("Afegir-los al viatge", "Añadirlos al viaje")}</label>
      <select id="anV_${id}"><option value="">${T("— Només crear els clients —", "— Solo crear los clientes —")}</option>${(viatges || []).map(v =>
        `<option value="${v.id}">${esc(v.titol)}${v.data_inici ? " · " + dataCurta(v.data_inici) : ""}</option>`).join("")}</select>
      ${teFotos ? `<label class="consentiment amagat" id="anFl_${id}" style="font-weight:500;margin-top:10px"><input type="checkbox" id="anF_${id}" checked>
        ${T("Copiar també les fotos del DNI i del passaport als documents del viatge (el client no les veurà)", "Copiar también las fotos del DNI y del pasaporte a los documentos del viaje (el cliente no las verá)")}</label>` : ""}
      <div style="margin-top:12px"><button class="boto petit" id="anB_${id}">${T("Passar", "Pasar")}</button></div>
      <div id="anR_${id}"></div></div>`;
    const sel = $("anV_" + id);
    if(teFotos) sel.onchange = () => $("anFl_" + id).classList.toggle("amagat", !sel.value);
    $("anB_" + id).onclick = async () => {
      const b = $("anB_" + id); b.disabled = true; b.textContent = T("Passant…", "Pasando…");
      const viatge = sel.value || null;
      const { data, error } = await sb.rpc("an_importar_formulari", { p_formulari: id, p_viatge: viatge });
      if(error){ b.disabled = false; b.textContent = T("Passar", "Pasar"); toast(T("No s'ha pogut passar a Anonta: ", "No se ha podido pasar a Anonta: ") + error.message); return; }
      let fotos = 0;
      if(viatge && teFotos && $("anF_" + id).checked){
        for(const v of f.viatgers){
          for(const [tipus, nomDoc] of [["dni", "DNI"], ["passaport", T("Passaport", "Pasaporte")]]){
            const ruta = v["foto_" + tipus]; if(!ruta) continue;
            try{
              const blob = await blobFoto(ruta);
              const ext = blob.type === "application/pdf" ? "pdf" : blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
              const nom = `${nomDoc} · ${[v.nom, v.cognoms].filter(Boolean).join(" ")}`.trim();
              const desti = `${viatge}/docs/${crypto.randomUUID()}-${tipus}.${ext}`;
              const up = await sb.storage.from("anonta").upload(desti, blob, { contentType: blob.type || "image/jpeg" });
              if(up.error) continue;
              const ins = await sb.from("an_documents").insert({ viatge_id: viatge, nom, categoria: "altre", path: desti, mida: blob.size, visible: false });
              if(ins.error){ await sb.storage.from("anonta").remove([desti]); continue; }
              fotos++;
            }catch(e){}
          }
        }
      }
      const cl = (data.clients || []).filter(Boolean);
      const desti = viatge ? "viatge/" + viatge + "/viatgers" : (cl.length === 1 ? "client/" + cl[0].id : "clients");
      $("anR_" + id).innerHTML = `<div class="ok" style="margin-top:12px">${T("Fet! Ja són a Anonta:", "¡Hecho! Ya están en Anonta:")} ${cl.map(c =>
          `<b>${esc(c.nom)}</b> (${c.nou ? T("nou", "nuevo") : T("actualitzat", "actualizado")})`).join(", ")}${fotos ? ` · ${T("fotos copiades", "fotos copiadas")}: ${fotos}` : ""}</div>
        <a class="boto sec petit" style="margin-top:8px" href="anonta/admin.html#${desti}">${T("Obrir a Anonta", "Abrir en Anonta")} →</a>`;
      b.textContent = "✓";
    };
  }
})();
