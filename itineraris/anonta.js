// Itineraris · Connexió amb Anonta: quan el client accepta la proposta, l'itinerari es converteix en un viatge d'Anonta
// (amb els dies i els serveis que s'ha quedat). Només surt si l'agència té Anonta.
(function(){
  if(DEMO) return;
  // Enllaç al panell comú, al costat de «Tancar sessió»
  const sortir = document.getElementById("lnkSortir");
  if(sortir) sortir.insertAdjacentHTML("beforebegin", `<a href="../anonta/admin.html#apps" style="color:var(--blau);font-size:14px;margin-right:18px"
    data-es="🧩 Todas mis apps" data-ca="🧩 Totes les meves apps">${L("🧩 Totes les meves apps", "🧩 Todas mis apps")}</a>`);
  let teAnonta = null;
  const original = carregarLlista;
  carregarLlista = async function(){ await original(); await afegir(); };
  async function afegir(){
    if(teAnonta === null){ const { data } = await sb.rpc("an_perfil"); teAnonta = !!data; }
    if(!teAnonta || !LLISTA.length) return;
    const { data: infos } = await sb.from("it_itineraris").select("id,info");
    const fet = {}; (infos || []).forEach(x => { if(x.info && x.info.anonta_viatge) fet[x.id] = x.info.anonta_viatge; });
    $("llista").querySelectorAll("[data-ed]").forEach(b => {
      const id = b.dataset.ed, fila = b.closest(".fila-botons");
      if(!fila || fila.querySelector("[data-anonta],[data-anonta-v]")) return;
      fila.insertAdjacentHTML("beforeend", fet[id]
        ? `<a class="boto sec petit" data-anonta-v href="../anonta/admin.html#viatge/${esc(fet[id])}">🧳 ${L("Veure el viatge a Anonta", "Ver el viaje en Anonta")}</a>`
        : `<button class="boto sec petit" data-anonta="${esc(id)}">🧳 ${L("Convertir en viatge d'Anonta", "Convertir en viaje de Anonta")}</button>`);
      const bt = fila.querySelector("[data-anonta]"); if(bt) bt.onclick = () => convertir(id, bt);
    });
  }
  $("btnRefresca").onclick = carregarLlista;
  if(LLISTA.length) afegir();   // per si la llista ja s'havia carregat abans d'aquest fitxer

  async function convertir(id, boto){
    const i = LLISTA.find(x => x.id === id);
    if(!confirm(L(`Convertir «${i.titol}» en un viatge d'Anonta? Es crearà amb els dies i els serveis inclosos (els opcionals que el client ha tret no hi aniran). El viatge queda sense publicar perquè el revisis i hi afegeixis els viatgers.`,
                  `¿Convertir «${i.titol}» en un viaje de Anonta? Se creará con los días y los servicios incluidos (los opcionales que el cliente ha quitado no irán). El viaje queda sin publicar para que lo revises y le añadas los viajeros.`))) return;
    boto.disabled = true; boto.textContent = L("Convertint…", "Convirtiendo…");
    const { data, error } = await sb.rpc("it_a_anonta", { p_itinerari: id });
    if(error){
      boto.disabled = false; boto.textContent = "🧳 " + L("Convertir en viatge d'Anonta", "Convertir en viaje de Anonta");
      toast(/PROVA_ACABADA/.test(error.message) ? L("La prova d'Anonta s'ha acabat: no s'hi poden crear viatges nous.", "La prueba de Anonta ha terminado: no se pueden crear viajes nuevos.")
        : /NO_ANONTA/.test(error.message) ? L("La teva agència no té Anonta activada.", "Tu agencia no tiene Anonta activada.") : error.message);
      return;
    }
    location.href = "../anonta/admin.html#viatge/" + data;
  }
})();
