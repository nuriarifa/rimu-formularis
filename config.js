// Configuració dels formularis de viatgers (Rimu Viatges i agències associades)
window.RIMU = {
  SUPABASE_URL: "https://ewcrlyoiyfcbzjsqaqzr.supabase.co",
  SUPABASE_KEY: "sb_publishable_fEZ3TlyG9yWIw1QM_DQhLA_FwpdQn5C"
};

// Aplica el logo i els colors d'una agència a la pàgina
window.aplicarMarca = function(ag){
  if(!ag) return;
  const r = document.documentElement.style;
  r.setProperty("--blau", ag.color);
  r.setProperty("--blau-fosc", ag.color_fosc);
  r.setProperty("--blau-clar", ag.color_clar);
  r.setProperty("--coral", ag.accent);
  r.setProperty("--coral-clar", ag.accent_clar);
  // El logo pot venir en un sol arxiu o en diverses parts separades per comes
  const fitxers = (ag.logo_fitxer || "logo.js").split(",").map(f => f.trim().replace(/[^a-z0-9._-]/gi, "")).filter(Boolean);
  let pendents = fitxers.length;
  window.LOGO_PARTS = [];
  const mostrar = () => {
    const src = window.LOGO_PARTS.length ? window.LOGO_PARTS.join("") : window.RIMU_LOGO;
    document.querySelectorAll("img.logo").forEach(i => { i.src = src; i.alt = ag.nom; i.style.visibility = "visible"; });
  };
  fitxers.forEach(f => {
    const s = document.createElement("script");
    s.src = f;
    s.onload = () => { if(--pendents === 0) mostrar(); };
    document.head.appendChild(s);
  });
};
