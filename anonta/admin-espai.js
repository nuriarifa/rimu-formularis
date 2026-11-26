// Anonta · Avís d'espai per a la superadministradora
// Quan l'espai del pla gratuït (fitxers o base de dades) passa del 80 %, surt una franja al panell.
(function(){
  if(typeof DEMO !== "undefined" && DEMO) return;
  let fet = false;
  const mb = b => (b / 1048576).toLocaleString(LANG === "es" ? "es-ES" : "ca-ES", { maximumFractionDigits: 0 }) + " MB";
  async function comprova(){
    if(fet || $("vApp").classList.contains("amagat")) return;
    fet = true;
    const { data: e } = await sb.rpc("an_us_espai");
    if(!e) return;                                   // no és la superadministradora
    const pct = Math.max(e.pct_db, e.pct_fitxers);
    if(pct < 80) return;
    const d = document.createElement("div");
    d.className = "avis";
    d.style.cssText = "margin-bottom:14px;border-left:4px solid #B3261E;background:#FDECEA";
    d.innerHTML = `<strong>⚠️ ${L("L'espai del pla gratuït s'està omplint", "El espacio del plan gratuito se está llenando")} (${pct} %)</strong><br>
      ${L("Documents i fotos", "Documentos y fotos")}: ${mb(e.fitxers)} / ${mb(e.limit_fitxers)} · ${L("Base de dades", "Base de datos")}: ${mb(e.db)} / ${mb(e.limit_db)}<br>
      <span style="font-size:14px">${L("És hora de passar Supabase al pla Pro: supabase.com → el teu projecte → Settings → Billing.",
        "Es hora de pasar Supabase al plan Pro: supabase.com → tu proyecto → Settings → Billing.")}</span>`;
    $("vApp").prepend(d);
  }
  const t = setInterval(() => { comprova(); if(fet) clearInterval(t); }, 1500);
})();
