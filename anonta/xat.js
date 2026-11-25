// Anonta · Xat del viatge (el fan servir l'app del client i el panell de l'agència) i notificacions al mòbil.
//   XAT.munta(cont, { sb, viatgeId, fil, esAgencia, jo, idioma, onLlegit })  → dibuixa la conversa i la manté al dia
//   XAT.noLlegits(sb)                                                        → [{ viatge_id, fil, n, … }]
//   XAT.notificacions                                                        → activar / estat de les notificacions
window.XAT = (function(){
  const { esc } = AN;
  const T = {
    ca: { escriu: "Escriu un missatge…", envia: "Envia", foto: "Envia una foto", buit: "Encara no hi ha cap missatge. Escriu el primer!",
          tu: "Tu", err: "No s'ha pogut enviar. Torna-ho a provar.", carregant: "Carregant…", avui: "Avui", ahir: "Ahir",
          esborra: "Esborrar aquest missatge?", errFoto: "No s'ha pogut enviar la foto." },
    es: { escriu: "Escribe un mensaje…", envia: "Enviar", foto: "Enviar una foto", buit: "Todavía no hay ningún mensaje. ¡Escribe el primero!",
          tu: "Tú", err: "No se ha podido enviar. Vuelve a intentarlo.", carregant: "Cargando…", avui: "Hoy", ahir: "Ayer",
          esborra: "¿Borrar este mensaje?", errFoto: "No se ha podido enviar la foto." }
  };

  // Estils del xat (s'afegeixen una sola vegada)
  if(!document.getElementById("estilXat")){
    const st = document.createElement("style"); st.id = "estilXat";
    st.textContent = `
      .xat{display:flex;flex-direction:column;border:1px solid var(--linia);border-radius:14px;background:var(--fons,#F6F8FA);overflow:hidden}
      .xat-llista{flex:1;min-height:260px;max-height:58vh;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px}
      .xat-dia{align-self:center;font-size:12px;color:var(--gris);background:#fff;border-radius:12px;padding:2px 10px;margin:6px 0}
      .xat-m{max-width:82%;align-self:flex-start;background:#fff;border:1px solid var(--linia);border-radius:14px 14px 14px 4px;padding:8px 11px;word-wrap:break-word;font-size:15px}
      .xat-m .txt{white-space:pre-wrap}
      .xat-m.meu{align-self:flex-end;background:var(--blau);border-color:var(--blau);color:#fff;border-radius:14px 14px 4px 14px}
      .xat-m .qui{font-size:12px;font-weight:700;color:var(--blau);margin-bottom:2px}
      .xat-m.meu .qui{display:none}
      .xat-m .hora{font-size:11px;opacity:.65;text-align:right;margin-top:3px}
      .xat-m img{display:block;max-width:100%;max-height:300px;border-radius:10px;margin:2px 0;cursor:zoom-in}
      .xat-m .esb{background:none;border:0;color:inherit;opacity:.5;cursor:pointer;font-size:12px;padding:0 0 0 6px}
      .xat-peu{display:flex;gap:8px;align-items:flex-end;padding:10px;border-top:1px solid var(--linia);background:#fff}
      .xat-peu textarea{flex:1;min-height:42px;max-height:140px;resize:none;margin:0;font:inherit;padding:10px 12px;border-radius:20px}
      .xat-peu button{flex:none;width:44px;height:44px;border-radius:50%;padding:0;font-size:19px;display:flex;align-items:center;justify-content:center}
      .xat-buit{margin:auto;color:var(--gris);font-size:14px;text-align:center;padding:20px}
      .xat-fils{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
      .xat-fils button{font:inherit;font-size:14px;padding:7px 12px;border-radius:20px;border:1px solid var(--linia);background:#fff;cursor:pointer;color:var(--text)}
      .xat-fils button.actiu{background:var(--blau);border-color:var(--blau);color:#fff}
      .xat-num{display:inline-block;min-width:18px;padding:0 5px;border-radius:9px;background:#D9534F;color:#fff;font-size:11px;font-weight:700;line-height:18px;text-align:center;margin-left:5px}
      .xat-avis{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:var(--blau-clar);border-radius:12px;padding:10px 12px;margin-bottom:10px;font-size:14px}`;
    document.head.appendChild(st);
  }

  const hora = iso => new Date(iso).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit", hour12: false });
  const clauDia = iso => new Date(iso).toLocaleDateString("sv");
  function etiquetaDia(iso, tx, idioma){
    const d = clauDia(iso), avui = new Date(), ahir = new Date(Date.now() - 864e5);
    if(d === clauDia(avui)) return tx.avui;
    if(d === clauDia(ahir)) return tx.ahir;
    return new Date(iso).toLocaleDateString(idioma === "es" ? "es-ES" : "ca-ES", { weekday: "short", day: "numeric", month: "short" });
  }

  let actiu = null;   // conversa oberta (per tancar el canal en canviar)

  async function munta(cont, o){
    const tx = T[o.idioma === "es" ? "es" : "ca"];
    if(actiu) actiu.tanca();
    cont.innerHTML = `<div class="xat"><div class="xat-llista"><div class="xat-buit">${esc(tx.carregant)}</div></div>
      <div class="xat-peu">
        <button type="button" class="boto sec" data-x="foto" title="${esc(tx.foto)}" aria-label="${esc(tx.foto)}">📷</button>
        <textarea rows="1" placeholder="${esc(tx.escriu)}" maxlength="4000"></textarea>
        <button type="button" class="boto" data-x="envia" title="${esc(tx.envia)}" aria-label="${esc(tx.envia)}">➤</button>
        <input type="file" accept="image/*" class="amagat" hidden>
      </div></div>`;
    const llista = cont.querySelector(".xat-llista"), ta = cont.querySelector("textarea"),
          bEnvia = cont.querySelector('[data-x="envia"]'), bFoto = cont.querySelector('[data-x="foto"]'), inFoto = cont.querySelector("input[type=file]");
    let msgs = [], urls = {}, tancat = false, canal = null, timer = null;

    const filtre = q => o.fil ? q.eq("fil", o.fil) : q.is("fil", null);
    async function carrega(){
      const { data, error } = await filtre(o.sb.from("an_missatges").select("*").eq("viatge_id", o.viatgeId)).order("created_at").limit(500);
      if(error || tancat) return;
      const nous = data.filter(m => m.foto && !urls[m.foto]).map(m => m.foto);
      if(nous.length) Object.assign(urls, await AN.urlsSignades(o.sb, nous));
      const abans = msgs.length; msgs = data;
      pinta(abans !== msgs.length);
      if(msgs.length !== abans){ await o.sb.rpc("an_xat_marcar_llegit", { p_viatge: o.viatgeId, p_fil: o.fil || null }); o.onLlegit && o.onLlegit(); }
    }
    const esMeu = m => o.esAgencia ? m.autor_tipus === "agencia" : m.autor_client === o.jo;
    function pinta(baixa){
      const aBaix = llista.scrollHeight - llista.scrollTop - llista.clientHeight < 80;
      if(!msgs.length){ llista.innerHTML = `<div class="xat-buit">${esc(tx.buit)}</div>`; return; }
      let html = "", dia = "";
      for(const m of msgs){
        const d = clauDia(m.created_at);
        if(d !== dia){ dia = d; html += `<div class="xat-dia">${esc(etiquetaDia(m.created_at, tx, o.idioma))}</div>`; }
        html += `<div class="xat-m${esMeu(m) ? " meu" : ""}">
          <div class="qui">${esc(m.autor_nom || "")}</div>
          ${m.foto ? (urls[m.foto] ? `<img src="${esc(urls[m.foto])}" alt="" data-gran="${esc(urls[m.foto])}">` : "📷") : ""}
          ${m.text ? `<div class="txt">${esc(m.text)}</div>` : ""}
          <div class="hora">${hora(m.created_at)}${o.esAgencia ? `<button class="esb" type="button" data-esb="${m.id}" title="✕">✕</button>` : ""}</div></div>`;
      }
      llista.innerHTML = html;
      llista.querySelectorAll("img[data-gran]").forEach(i => i.onclick = () => window.open(i.dataset.gran, "_blank"));
      llista.querySelectorAll("[data-esb]").forEach(b => b.onclick = async () => {
        if(!confirm(tx.esborra)) return;
        const { error } = await o.sb.from("an_missatges").delete().eq("id", b.dataset.esb);
        if(!error){ msgs = msgs.filter(x => x.id !== b.dataset.esb); pinta(false); }
      });
      if(baixa || aBaix) llista.scrollTop = llista.scrollHeight;
    }
    async function envia(text, foto){
      const reg = { viatge_id: o.viatgeId, fil: o.fil || null, autor_tipus: o.esAgencia ? "agencia" : "client", text: text || null, foto: foto || null };
      const { error } = await o.sb.from("an_missatges").insert(reg);
      if(error){ alert(tx.err); return false; }
      await carrega(); return true;
    }
    bEnvia.onclick = async () => {
      const text = ta.value.trim(); if(!text) return;
      bEnvia.disabled = true;
      if(await envia(text)) ta.value = "";
      bEnvia.disabled = false; ta.style.height = ""; ta.focus();
    };
    ta.addEventListener("keydown", e => { if(e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)){ e.preventDefault(); bEnvia.click(); } });
    ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = Math.min(140, ta.scrollHeight) + "px"; });
    bFoto.onclick = () => inFoto.click();
    inFoto.onchange = async () => {
      const f = inFoto.files[0]; inFoto.value = ""; if(!f) return;
      bFoto.disabled = true;
      try{
        const blob = await AN.reduirFoto(f, 1600);
        const ruta = `${o.viatgeId}/xat/${crypto.randomUUID()}.jpg`;
        const { error } = await o.sb.storage.from("anonta").upload(ruta, blob, { contentType: "image/jpeg" });
        if(error) throw error;
        if(!(await envia(ta.value.trim(), ruta))) await o.sb.storage.from("anonta").remove([ruta]);
        else ta.value = "";
      }catch(e){ alert(tx.errFoto); }
      bFoto.disabled = false;
    };

    // Al dia: avís en temps real i, per si de cas, una consulta cada 20 segons
    try{
      canal = o.sb.channel("xat-" + o.viatgeId + "-" + (o.fil || "grup") + "-" + Math.random().toString(36).slice(2))
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "an_missatges", filter: "viatge_id=eq." + o.viatgeId }, () => carrega())
        .subscribe();
    }catch(e){}
    timer = setInterval(() => { if(!document.body.contains(llista)) return actiu && actiu.tanca(); if(!document.hidden) carrega(); }, 20000);
    document.addEventListener("visibilitychange", () => { if(!document.hidden && !tancat) carrega(); });
    actiu = { tanca(){ tancat = true; clearInterval(timer); try{ canal && o.sb.removeChannel(canal); }catch(e){} actiu = null; } };
    await carrega();
    await o.sb.rpc("an_xat_marcar_llegit", { p_viatge: o.viatgeId, p_fil: o.fil || null }); o.onLlegit && o.onLlegit();
  }

  async function noLlegits(sb){
    const { data } = await sb.rpc("an_xat_no_llegits");
    return data || [];
  }

  // ---------- Notificacions al mòbil ----------
  const b64uABytes = s => { const p = "=".repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, c => c.charCodeAt(0)); };
  const notificacions = {
    suportades: () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window,
    esIOS: () => /iphone|ipad|ipod/i.test(navigator.userAgent),
    instalada: () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true,
    estat(){
      if(!this.suportades()) return this.esIOS() && !this.instalada() ? "instalar" : "no";
      return Notification.permission === "granted" ? "si" : Notification.permission === "denied" ? "bloquejades" : "pregunta";
    },
    async activa(sb, idioma){
      const reg = await navigator.serviceWorker.register("sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if(perm !== "granted") return false;
      const { data: clau } = await sb.rpc("an_push_clau");
      let sub = await reg.pushManager.getSubscription();
      if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uABytes(clau) });
      const j = sub.toJSON();
      const { error } = await sb.rpc("an_push_desa", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_idioma: idioma });
      return !error;
    },
    // Si ja les té activades, torna a desar la subscripció (per si ha canviat de sessió o d'idioma)
    async refresca(sb, idioma){
      if(this.estat() !== "si") return;
      try{
        const reg = await navigator.serviceWorker.getRegistration("sw.js") || await navigator.serviceWorker.register("sw.js");
        const sub = reg && await reg.pushManager.getSubscription();
        if(!sub) return this.activa(sb, idioma);
        const j = sub.toJSON();
        await sb.rpc("an_push_desa", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_idioma: idioma });
      }catch(e){}
    },
    // Targeta per activar-les (torna "" si no cal)
    targeta(idioma, perAgencia){
      const es = idioma === "es", e = this.estat();
      if(e === "si" || e === "no") return "";
      if(e === "instalar") return `<div class="xat-avis"><span>🔔 ${es
        ? "Para recibir avisos en el iPhone, primero añade la app a la pantalla de inicio (botón Compartir → «Añadir a pantalla de inicio») y ábrela desde allí."
        : "Per rebre avisos a l'iPhone, primer afegeix l'app a la pantalla d'inici (botó Compartir → «Afegir a la pantalla d'inici») i obre-la des d'allà."}</span></div>`;
      if(e === "bloquejades") return `<div class="xat-avis"><span>🔕 ${es
        ? "Las notificaciones están bloqueadas. Puedes activarlas en los ajustes del navegador para esta web."
        : "Les notificacions estan bloquejades. Les pots activar als ajustos del navegador per a aquesta web."}</span></div>`;
      return `<div class="xat-avis"><span>🔔 ${perAgencia
          ? (es ? "Recibe un aviso en el móvil cuando un cliente te escriba." : "Rep un avís al mòbil quan un client t'escrigui.")
          : (es ? "Activa las notificaciones para enterarte de los mensajes y cambios de tu viaje." : "Activa les notificacions per assabentar-te dels missatges i dels canvis del teu viatge.")}</span>
        <button class="boto petit" type="button" data-activa-notif>${es ? "Activar" : "Activar"}</button></div>`;
    },
    lliga(arrel, sb, idioma){
      const b = arrel.querySelector("[data-activa-notif]"); if(!b) return;
      b.onclick = async () => {
        b.disabled = true;
        let ok = false; try{ ok = await this.activa(sb, idioma); }catch(e){}
        const av = b.closest(".xat-avis");
        if(ok) av.innerHTML = `<span>✅ ${idioma === "es" ? "¡Notificaciones activadas!" : "Notificacions activades!"}</span>`;
        else { b.disabled = false; av.insertAdjacentHTML("beforeend", `<span class="meta">${idioma === "es" ? "No se han podido activar." : "No s'han pogut activar."}</span>`); }
      };
    }
  };

  return { munta, noLlegits, notificacions };
})();
