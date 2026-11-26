// Anonta · Preus que veu cada agència al seu panell
// Les agències marcades «de fora» veuen els preus de la web (amb IVA inclòs); els agents de Rimu, els d'agent.
(function(){
  if(typeof DEMO !== "undefined" && DEMO) return;   // a la demo ja ho fa config.js segons d'on ve
  let fet = false;
  async function comprova(){
    if(fet || $("vApp").classList.contains("amagat")) return;
    fet = true;
    const { data: tarifa } = await sb.rpc("ag_tarifa");
    if(tarifa !== "web" || !window.TARIFES) return;
    PREU.basic = TARIFES.web.anonta.basic;
    PREU.premium = TARIFES.web.anonta.premium;
    // Els textos de preus diuen «+ IVA» / «sense IVA»: aquí l'IVA ja hi és inclòs
    const canvia = arrel => {
      const w = document.createTreeWalker(arrel, NodeFilter.SHOW_TEXT);
      let n;
      while((n = w.nextNode())){
        if(n.data.indexOf("€/mes") < 0 && !/(sense|sin) IVA/.test(n.data)) continue;
        const nou = n.data.replace(/\+\s?IVA/g, LANG === "es" ? "IVA incluido" : "IVA inclòs")
          .replace(/Preus sense IVA/g, "Preus amb IVA inclòs").replace(/Precios sin IVA/g, "Precios con IVA incluido");
        if(nou !== n.data) n.data = nou;
      }
    };
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(x => {
      if(x.nodeType === 1) canvia(x); else if(x.nodeType === 3 && x.parentNode) canvia(x.parentNode);
    }))).observe(document.body, { childList: true, subtree: true });
    // es tornen a pintar la franja de prova i la pantalla amb els preus nous
    try{ await comprovarProva(); }catch(e){}
    try{ route(); }catch(e){}
    canvia(document.body);
  }
  const t = setInterval(() => { comprova(); if(fet) clearInterval(t); }, 1000);
})();
