// Anonta · App del client: pestanya «💬 Missatges» a cada viatge (grup del viatge i conversa privada amb l'agència)
// i notificacions al mòbil. S'afegeix a app.js sense tocar-lo.
(function(){
  if(new URLSearchParams(location.search).has("demo")) return;   // la demostració no té missatges reals
  const Lx = (ca, es) => S.idioma === "es" ? es : ca;
  let JO = null, NL = [];   // id del client actual i missatges sense llegir

  async function quiSoc(){
    if(JO) return JO;
    const { data } = await sb.rpc("an_client_actual");
    return JO = data || null;
  }
  async function actualitzaNoLlegits(){
    try{ NL = await XAT.noLlegits(sb); }catch(e){ NL = []; }
    return NL;
  }
  const nViatge = (id, fil) => NL.filter(x => x.viatge_id === id && (fil === undefined || (x.fil || null) === fil)).reduce((a, x) => a + Number(x.n), 0);
  const bombolla = n => n ? `<span class="xat-num">${n}</span>` : "";

  // ---- Fitxa del viatge: afegeix la pestanya i, si és la triada, hi posa el xat ----
  const pantallaViatge0 = pantallaViatge;
  pantallaViatge = async function(id, tab){
    const esXat = tab === "missatges";
    await pantallaViatge0(id, esXat ? "resum" : tab);
    const nav = main.querySelector(".pestanyes");
    if(!nav || !S.viatges.find(x => x.id === id)) return;
    refresca();
    await actualitzaNoLlegits();
    nav.insertAdjacentHTML("beforeend", `<button type="button" data-t="missatges" class="${esXat ? "actiu" : ""}">💬 ${esc(Lx("Missatges", "Mensajes"))}${bombolla(nViatge(id))}</button>`);
    nav.querySelector('[data-t="missatges"]').onclick = () => location.hash = `#viatge/${id}/missatges`;
    if(!esXat) return;
    nav.querySelectorAll("button").forEach(b => b.classList.toggle("actiu", b.dataset.t === "missatges"));
    nav.querySelector(".actiu")?.scrollIntoView({ inline: "center", block: "nearest" });
    await obreXat(document.getElementById("cos"), id, null);
  };

  async function obreXat(cos, viatgeId, fil){
    const jo = await quiSoc();
    const nG = nViatge(viatgeId, null), nP = jo ? nViatge(viatgeId, jo) : 0;
    cos.innerHTML = `
      ${XAT.notificacions.targeta(S.idioma, false)}
      <div class="xat-fils">
        <button type="button" data-fil="" class="${fil ? "" : "actiu"}">👥 ${esc(Lx("Grup del viatge", "Grupo del viaje"))}${bombolla(fil ? nG : 0)}</button>
        ${jo ? `<button type="button" data-fil="${jo}" class="${fil ? "actiu" : ""}">🔒 ${esc(Lx("Privat amb l'agència", "Privado con la agencia"))}${bombolla(fil ? 0 : nP)}</button>` : ""}
      </div>
      <p class="meta" style="margin:0 0 8px">${esc(fil
        ? Lx("Només tu i l'agència veieu aquesta conversa.", "Solo tú y la agencia veis esta conversación.")
        : Lx("Tots els viatgers d'aquest viatge i l'agència veieu aquests missatges.", "Todos los viajeros de este viaje y la agencia veis estos mensajes."))}</p>
      <div id="xatCont"></div>`;
    XAT.notificacions.lliga(cos, sb, S.idioma);
    cos.querySelectorAll("[data-fil]").forEach(b => b.onclick = () => obreXat(cos, viatgeId, b.dataset.fil || null));
    await XAT.munta(document.getElementById("xatCont"), { sb, viatgeId, fil, esAgencia: false, jo, idioma: S.idioma,
      onLlegit: () => { NL = NL.filter(x => !(x.viatge_id === viatgeId && (x.fil || null) === (fil || null))); } });
  }

  // ---- Llista de viatges: bombolla de missatges nous a cada targeta ----
  const pantallaLlista0 = pantallaLlista;
  pantallaLlista = function(){
    pantallaLlista0();
    refresca();
    actualitzaNoLlegits().then(() => {
      main.querySelectorAll(".targeta-viatge").forEach(el => {
        const n = nViatge(el.dataset.id);
        if(n && !el.querySelector(".xat-num")) el.querySelector(".cos > div:last-child")?.insertAdjacentHTML("beforeend",
          ` <span class="xip blau">💬 ${esc(Lx(n === 1 ? "1 missatge nou" : `${n} missatges nous`, n === 1 ? "1 mensaje nuevo" : `${n} mensajes nuevos`))}</span>`);
      });
    });
  };

  // Si ja té les notificacions activades, es manté la subscripció al dia (una vegada, en entrar)
  let refrescat = false;
  function refresca(){ if(refrescat) return; refrescat = true; XAT.notificacions.refresca(sb, S.idioma); }

  // Si l'app ja havia dibuixat la pantalla abans que es carregués aquest fitxer, es torna a dibuixar
  if(!document.getElementById("menu").classList.contains("amagat")) route(true);
})();
