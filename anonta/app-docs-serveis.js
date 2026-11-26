// Anonta · App del client: documents lligats als serveis
// (dins de cada servei surten els seus documents, i a «Documents» es veu de quin servei és cada un)
(function(){
  // Afegeix la llista de serveis de cada document a les dades del viatge (un cop per viatge)
  const carregarOriginal = carregarViatge;
  carregarViatge = async function(v){
    const d = await carregarOriginal(v);
    if(d && !d._docsServeis){
      d._docsServeis = true;
      try{
        const { data } = await sb.from("an_documents").select("id, serveis").eq("viatge_id", v.id);
        const m = new Map((data || []).map(x => [x.id, x.serveis || []]));
        d.docs.forEach(x => x.serveis = m.get(x.id) || []);
      }catch(e){ d.docs.forEach(x => x.serveis = x.serveis || []); }
    }
    return d;
  };

  const nomServei = s => s.tipus === "vol" && !s.titol ? (SRV.titolVol(s) || "") : (tr("an_serveis", s, "titol") || "");
  const obreDoc = async path => {
    const w = window.open("", "_blank");
    const { data, error } = await sb.storage.from(AN.BUCKET).createSignedUrl(path, 600);
    if(error || !data){ w && w.close(); return avis(t("errDoc"), true); }
    if(w) w.location = data.signedUrl; else location.href = data.signedUrl;
  };
  const lligaBotons = cos => cos.querySelectorAll("[data-doc]").forEach(b => b.onclick = () => obreDoc(b.dataset.doc));

  // Serveis: cada servei porta els seus documents a sota
  const serveisAnterior = tabServeis;
  tabServeis = function(cos, v, d){
    serveisAnterior(cos, v, d);
    const targetes = cos.querySelectorAll(".servei");
    d.serveis.forEach((s, i) => {
      const docs = d.docs.filter(x => (x.serveis || []).includes(s.id));
      if(!docs.length || !targetes[i]) return;
      const zona = targetes[i].lastElementChild || targetes[i];
      zona.insertAdjacentHTML("beforeend", `<div class="docs-servei">${docs.map(x =>
        `<button type="button" class="doc-xip" data-doc="${esc(x.path)}">${AN.CATEGORIA_DOC[x.categoria]?.ico || "📎"} ${esc(tr("an_documents", x, "nom"))}</button>`).join("")}</div>`);
    });
    lligaBotons(cos);
  };

  // Documents: com abans, però amb el servei al qual pertany cada document
  tabDocuments = function(cos, v, d){
    const grups = {};
    d.docs.forEach(x => (grups[x.categoria] = grups[x.categoria] || []).push(x));
    const serveiDe = x => (x.serveis || []).map(id => d.serveis.find(s => s.id === id)).filter(Boolean)
      .map(s => `${AN.TIPUS_SERVEI[s.tipus]?.ico || ""} ${esc(nomServei(s))}`).join(" · ");
    cos.innerHTML = Object.keys(AN.CATEGORIA_DOC).filter(k => grups[k]).map(k => `
      <div class="targeta"><h2>${AN.CATEGORIA_DOC[k].ico} ${esc(nomCat(AN.CATEGORIA_DOC, k))}</h2>
        ${grups[k].map(x => { const sv = serveiDe(x); return `<div class="doc"><div class="n"><b>${esc(tr("an_documents", x, "nom"))}</b>
          <span class="meta">${sv ? sv + " · " : ""}${AN.mida(x.mida)}</span></div>
          <button class="boto petit sec" type="button" data-doc="${esc(x.path)}">${esc(t("obre"))}</button></div>`; }).join("")}
      </div>`).join("");
    lligaBotons(cos);
  };

  const css = document.createElement("style");
  css.textContent = `.docs-servei{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
    .doc-xip{border:1px solid var(--vora,#d9dee5);background:var(--fons-clar,#f4f6f9);color:inherit;border-radius:999px;padding:7px 12px;font:inherit;font-size:14px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .doc-xip:active{opacity:.7}`;
  document.head.appendChild(css);

  // si la pàgina ja s'ha pintat en una pestanya afectada, es torna a pintar
  if(/\/(serveis|documents)$/.test(location.hash) && document.querySelector(".pestanyes .actiu")) route(true);
})();
