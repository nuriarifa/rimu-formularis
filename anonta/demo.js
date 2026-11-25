// Anonta · Mode DEMOSTRACIÓ (admin.html?demo i index.html?demo)
// Substitueix la connexió a Supabase per una de falsa: res no va a la base de dades,
// tot es guarda només al navegador de qui prova la demo.
(function(){
  if(!new URLSearchParams(location.search).has("demo")) return;
  const ROL = /admin\.html/.test(location.pathname) ? "admin" : "client";
  const CLAU = "anonta_demo_v1", CLAU_FIT = "anonta_demo_fitxers_v1";
  const CLIENT_DEMO = "c-marta", USUARI_CLIENT = "u-marta";

  // ---------- dades d'exemple ----------
  const dia = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : "x" + Date.now() + Math.random().toString(16).slice(2));
  const ara = () => new Date().toISOString();

  function imatge(c1, c2, emoji, text){
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><text x="400" y="240" font-size="150" text-anchor="middle" dominant-baseline="middle">${emoji}</text>${text ? `<text x="400" y="400" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#fff" text-anchor="middle">${text}</text>` : ""}</svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function document_(titol, linies){
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titol}</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Arial,sans-serif;max-width:640px;margin:40px auto;padding:0 20px;color:#22313F"><p style="background:#FFF4D6;padding:10px 14px;border-radius:8px">📄 Document d'exemple de la demostració</p><h1 style="color:#3D698E">${titol}</h1>${linies.map(l => `<p>${l}</p>`).join("")}</body></html>`;
    return "data:text/html;charset=utf-8," + encodeURIComponent(html);
  }

  function inicial(){
    const J = "v-japo", M = "v-menorca", R = "v-roma";
    const ini = dia(45);
    const fitxers = {
      "demo/portada-japo.svg": imatge("#3D698E", "#E79893", "🗾", "Japó"),
      "demo/portada-menorca.svg": imatge("#2F8FA8", "#9AD3D8", "🏝️", "Menorca"),
      "demo/portada-roma.svg": imatge("#B5653A", "#F0C27B", "🏛️", "Roma"),
      "demo/dia-tokyo.svg": imatge("#22313F", "#3D698E", "🌃", ""),
      "demo/dia-kyoto.svg": imatge("#7A3E48", "#E79893", "⛩️", ""),
      "demo/rec-ramen.svg": imatge("#C9783F", "#F3C98B", "🍜", ""),
      "demo/doc-vols.html": document_("Bitllets d'avió · Barcelona – Tòquio", ["Passatgers: Marta Puig, Jordi Soler, Laia Soler", "Localitzador: QR7K2M", "Anada i tornada amb una maleta facturada de 23 kg per persona."]),
      "demo/doc-hotel.html": document_("Bo d'hotel · Tòquio", ["Hotel Shinjuku Garden (exemple)", "3 nits en habitació triple amb esmorzar.", "Presenteu aquest bo a la recepció."]),
      "demo/doc-asseguranca.html": document_("Assegurança de viatge", ["Cobertura mèdica, cancel·lació i equipatge.", "Telèfon d'assistència 24 h: (el que indiqui la pòlissa)."]),
      "demo/doc-condicions.html": document_("Condicions del viatge combinat", ["Text d'exemple de les condicions generals del contracte de viatge combinat."])
    };
    const db = {
      agencies: [{ id: "rimu", nom: "Rimu Viatges", color: "#3D698E", color_fosc: "#2C5274", color_clar: "#EAF1F7", accent: "#E79893", accent_clar: "#FBEDEC", logo_url: null, logo_fitxer: "logo.js" }],
      an_clients: [
        { id: CLIENT_DEMO, nom: "Marta", cognoms: "Puig", email: "marta@exemple.com", telefon: "600 000 001", idioma: "ca", notes: "Li agrada viatjar amb temps per passejar.", user_id: USUARI_CLIENT, created_at: ara() },
        { id: "c-jordi", nom: "Jordi", cognoms: "Soler", email: "jordi@exemple.com", telefon: "600 000 002", idioma: "ca", notes: null, user_id: "u-jordi", created_at: ara() },
        { id: "c-laia", nom: "Laia", cognoms: "Soler Puig", email: null, telefon: null, idioma: "ca", notes: "Filla de la Marta i el Jordi (12 anys).", user_id: null, created_at: ara() },
        { id: "c-pere", nom: "Pere", cognoms: "Vila", email: "pere@exemple.com", telefon: "600 000 003", idioma: "es", notes: null, user_id: null, created_at: ara() }
      ],
      an_viatges: [
        { id: J, agencia_id: "rimu", referencia: "RV-2026-118", titol: "Japó en família", desti: "Tòquio, Kyoto i Osaka", pais: "Japó", data_inici: ini, data_fi: dia(54),
          estat: "confirmat", publicat: true, descripcio: "Deu dies per descobrir el Japó amb calma: la Tòquio més moderna, els temples de Kyoto i el menjar d'Osaka. Ho tenim tot a punt perquè només us hàgiu de preocupar de gaudir-ne!",
          portada: "demo/portada-japo.svg", import_total: 9450, mostrar_pagaments: true, created_at: ara(), updated_at: ara() },
        { id: M, agencia_id: "rimu", referencia: "RV-2026-041", titol: "Setmana a Menorca", desti: "Ciutadella", pais: "Espanya", data_inici: dia(-140), data_fi: dia(-133),
          estat: "confirmat", publicat: true, descripcio: "Una setmana de cales i bon menjar.", portada: "demo/portada-menorca.svg", import_total: 2100, mostrar_pagaments: false, created_at: ara(), updated_at: ara() },
        { id: R, agencia_id: "rimu", referencia: null, titol: "Escapada a Roma", desti: "Roma", pais: "Itàlia", data_inici: dia(110), data_fi: dia(113),
          estat: "en_preparacio", publicat: false, descripcio: null, portada: "demo/portada-roma.svg", import_total: null, mostrar_pagaments: true, created_at: ara(), updated_at: ara() }
      ],
      an_viatge_clients: [
        { viatge_id: J, client_id: CLIENT_DEMO, titular: true }, { viatge_id: J, client_id: "c-jordi", titular: true }, { viatge_id: J, client_id: "c-laia", titular: false },
        { viatge_id: M, client_id: CLIENT_DEMO, titular: true }, { viatge_id: R, client_id: "c-pere", titular: true }
      ],
      an_serveis: [
        { id: id(), viatge_id: J, tipus: "vol", titol: null, proveidor: "Qatar Airways", data_inici: ini, hora_inici: "08:25", data_fi: dia(46), hora_fi: "07:10", localitzador: "QR7K2M", descripcio: "Escala a Doha. Us aconsellem ser a l'aeroport 3 hores abans.", ordre: 0, created_at: ara(),
          extra: { numero: "QR148", origen: "Barcelona (BCN)", desti: "Tòquio (HND)", data_arribada: true, cabina: true, cabina_kg: "7", facturada: true, facturada_kg: "23" } },
        { id: id(), viatge_id: J, tipus: "trasllat", titol: "Trasllat aeroport → hotel", proveidor: "Receptiu local", data_inici: dia(46), hora_inici: "08:00", data_fi: null, hora_fi: null, localitzador: null, descripcio: "Us esperaran a la sortida amb un cartell amb el vostre nom.", ordre: 0, created_at: ara() },
        { id: id(), viatge_id: J, tipus: "hotel", titol: "Hotel Shinjuku Garden (Tòquio)", proveidor: null, data_inici: dia(46), hora_inici: null, data_fi: dia(49), hora_fi: null, localitzador: "HSG-55821", descripcio: "Al cor de Shinjuku, a 5 minuts a peu de l'estació.", ordre: 0, created_at: ara(),
          extra: { estrelles: 4, allotjament: "hotel", regim: "ad", habitacio: "Triple", checkin: "A partir de les 15:00. Sortida abans de les 11:00. Cal ensenyar els passaports." } },
        { id: id(), viatge_id: J, tipus: "tren", titol: "Japan Rail Pass 7 dies", proveidor: "JR", data_inici: dia(49), hora_inici: null, data_fi: dia(55), hora_fi: null, localitzador: "JRP-3X", descripcio: "Inclou els trens bala entre Tòquio, Kyoto i Osaka. S'activa a la primera estació.", ordre: 0, created_at: ara() },
        { id: id(), viatge_id: J, tipus: "hotel", titol: "Ryokan Gion (Kyoto)", proveidor: null, data_inici: dia(49), hora_inici: null, data_fi: dia(52), hora_fi: null, localitzador: "RG-1180", descripcio: "Sopar kaiseki inclòs la primera nit.", ordre: 0, created_at: ara(),
          extra: { estrelles: 3, allotjament: "ryokan", regim: "mp", habitacio: "Tatami familiar", checkin: "A partir de les 15:00. Sortida abans de les 10:00." } },
        { id: id(), viatge_id: J, tipus: "excursio", titol: "Excursió a Nara amb guia", proveidor: null, data_inici: dia(50), hora_inici: "08:30", data_fi: null, hora_fi: null, localitzador: "EXC-2207", descripcio: "Temple Todai-ji i el parc dels cérvols. Dinar no inclòs.", ordre: 0, created_at: ara(),
          extra: { lloc: "Recepció del ryokan" } },
        { id: id(), viatge_id: J, tipus: "asseguranca", titol: "Assegurança de viatge completa", proveidor: null, data_inici: null, hora_inici: null, data_fi: null, hora_fi: null, localitzador: "POL-99812", descripcio: "Cobertura mèdica, cancel·lació i equipatge.", ordre: 0, created_at: ara(),
          extra: { tipus: "assistencia_cancel" } }
      ],
      an_documents: [
        { id: id(), viatge_id: J, nom: "Bitllets d'avió", categoria: "bitllet", path: "demo/doc-vols.html", mida: 184000, visible: true, created_at: ara() },
        { id: id(), viatge_id: J, nom: "Bo de l'hotel de Tòquio", categoria: "bo", path: "demo/doc-hotel.html", mida: 96000, visible: true, created_at: ara() },
        { id: id(), viatge_id: J, nom: "Pòlissa de l'assegurança", categoria: "asseguranca", path: "demo/doc-asseguranca.html", mida: 312000, visible: true, created_at: ara() },
        { id: id(), viatge_id: J, nom: "Condicions del viatge combinat", categoria: "contracte", path: "demo/doc-condicions.html", mida: 158000, visible: true, created_at: ara() }
      ],
      an_pagaments: [
        { id: id(), viatge_id: J, concepte: "Paga i senyal", import: 2835, data_venciment: dia(-30), data_pagament: dia(-31), created_at: ara() },
        { id: id(), viatge_id: J, concepte: "Segon pagament", import: 3300, data_venciment: dia(5), data_pagament: null, created_at: ara() },
        { id: id(), viatge_id: J, concepte: "Pagament final", import: 3315, data_venciment: dia(15), data_pagament: null, created_at: ara() }
      ],
      an_dies: [], an_activitats: [],
      an_desti: [
        { id: id(), viatge_id: J, categoria: "info", titol: "Moneda i pagaments", descripcio: "La moneda és el ien. Molts llocs petits només accepten efectiu: porteu-ne sempre una mica. Als caixers de les botigues 7-Eleven podeu treure diners amb targeta.", adreca: null, enllac: null, foto: null, ordre: 1 },
        { id: id(), viatge_id: J, categoria: "info", titol: "Endolls", descripcio: "Els endolls són de tipus A (dues clavilles planes). Porteu un adaptador.", adreca: null, enllac: null, foto: null, ordre: 2 },
        { id: id(), viatge_id: J, categoria: "consell", titol: "Propines", descripcio: "Al Japó no es deixa propina: fins i tot pot semblar de mala educació.", adreca: null, enllac: null, foto: null, ordre: 3 },
        { id: id(), viatge_id: J, categoria: "visita", titol: "Santuari Fushimi Inari", descripcio: "Els milers de portes vermelles que pugen per la muntanya. Aneu-hi d'hora al matí per evitar la gent.", adreca: "Fushimi Inari Taisha, Kyoto", enllac: null, foto: null, ordre: 4 },
        { id: id(), viatge_id: J, categoria: "restaurant", titol: "Ramen a Tòquio", descripcio: "Proveu un bol de ramen en un local petit de barri: es demana a la màquina de l'entrada.", adreca: null, enllac: null, foto: "demo/rec-ramen.svg", ordre: 5 },
        { id: id(), viatge_id: J, categoria: "transport", titol: "Targeta Suica", descripcio: "Recarregable per al metro i els autobusos de Tòquio. També serveix per pagar a moltes botigues.", adreca: null, enllac: null, foto: null, ordre: 6 }
      ]
    };
    const dies = [
      { t: "Sortida de Barcelona", d: "Vol cap a Tòquio amb escala a Doha.", f: null, a: [["08:25", "Sortida del vol", "Aeroport de Barcelona, T1"]] },
      { t: "Arribada a Tòquio", d: "Trasllat a l'hotel i primer passeig per Shinjuku.", f: "demo/dia-tokyo.svg", a: [["08:00", "Trasllat a l'hotel", "Sortida de l'aeroport de Haneda"], ["18:00", "Vistes des de l'ajuntament de Tòquio", "Shinjuku"]] },
      { t: "Tòquio tradicional i modern", d: "Asakusa al matí i Shibuya a la tarda.", f: null, a: [["09:30", "Temple Senso-ji", "Asakusa"], ["17:00", "Encreuament de Shibuya", "Shibuya"]] },
      { t: "Tren bala cap a Kyoto", d: "Arribada al ryokan i sopar tradicional.", f: "demo/dia-kyoto.svg", a: [["10:00", "Shinkansen Tòquio → Kyoto", "Estació de Tòquio"], ["19:00", "Sopar kaiseki al ryokan", null]] }
    ];
    dies.forEach((x, i) => {
      const did = id();
      db.an_dies.push({ id: did, viatge_id: J, data: dia(45 + i), titol: x.t, descripcio: x.d, foto: x.f, ordre: i + 1 });
      x.a.forEach((a, j) => db.an_activitats.push({ id: id(), dia_id: did, hora: a[0], nom: a[1], lloc: a[2], descripcio: null, ordre: j + 1 }));
    });
    return { db, fitxers };
  }

  // traduccions al castellà dels textos d'exemple (a la demo no es fa servir la IA)
  const ES = {
    "Japó en família": "Japón en familia",
    "Tòquio, Kyoto i Osaka": "Tokio, Kioto y Osaka",
    "Japó": "Japón",
    "Deu dies per descobrir el Japó amb calma: la Tòquio més moderna, els temples de Kyoto i el menjar d'Osaka. Ho tenim tot a punt perquè només us hàgiu de preocupar de gaudir-ne!": "Diez días para descubrir Japón con calma: el Tokio más moderno, los templos de Kioto y la comida de Osaka. ¡Lo tenemos todo a punto para que solo os tengáis que preocupar de disfrutarlo!",
    "Setmana a Menorca": "Semana en Menorca",
    "Espanya": "España",
    "Una setmana de cales i bon menjar.": "Una semana de calas y buena comida.",
    "Escapada a Roma": "Escapada a Roma",
    "Itàlia": "Italia",
    "Vol Barcelona → Tòquio (Haneda)": "Vuelo Barcelona → Tokio (Haneda)",
    "Escala a Doha. Us aconsellem ser a l'aeroport 3 hores abans.": "Escala en Doha. Os aconsejamos estar en el aeropuerto 3 horas antes.",
    "Tòquio (HND)": "Tokio (HND)",
    "Hotel Shinjuku Garden (Tòquio)": "Hotel Shinjuku Garden (Tokio)",
    "Al cor de Shinjuku, a 5 minuts a peu de l'estació.": "En el corazón de Shinjuku, a 5 minutos a pie de la estación.",
    "A partir de les 15:00. Sortida abans de les 11:00. Cal ensenyar els passaports.": "A partir de las 15:00. Salida antes de las 11:00. Hay que enseñar los pasaportes.",
    "Ryokan Gion (Kyoto)": "Ryokan Gion (Kioto)",
    "Tatami familiar": "Tatami familiar",
    "A partir de les 15:00. Sortida abans de les 10:00.": "A partir de las 15:00. Salida antes de las 10:00.",
    "Excursió a Nara amb guia": "Excursión a Nara con guía",
    "Temple Todai-ji i el parc dels cérvols. Dinar no inclòs.": "Templo Todai-ji y el parque de los ciervos. Comida no incluida.",
    "Recepció del ryokan": "Recepción del ryokan",
    "Trasllat aeroport → hotel": "Traslado aeropuerto → hotel",
    "Us esperaran a la sortida amb un cartell amb el vostre nom.": "Os esperarán a la salida con un cartel con vuestro nombre.",
    "Hotel a Tòquio (Shinjuku)": "Hotel en Tokio (Shinjuku)",
    "Habitació triple amb esmorzar.": "Habitación triple con desayuno.",
    "Japan Rail Pass 7 dies": "Japan Rail Pass 7 días",
    "Inclou els trens bala entre Tòquio, Kyoto i Osaka. S'activa a la primera estació.": "Incluye los trenes bala entre Tokio, Kioto y Osaka. Se activa en la primera estación.",
    "Ryokan tradicional a Kyoto": "Ryokan tradicional en Kioto",
    "Sopar kaiseki inclòs la primera nit.": "Cena kaiseki incluida la primera noche.",
    "Assegurança de viatge completa": "Seguro de viaje completo",
    "Cobertura mèdica, cancel·lació i equipatge.": "Cobertura médica, cancelación y equipaje.",
    "Bitllets d'avió": "Billetes de avión",
    "Bo de l'hotel de Tòquio": "Bono del hotel de Tokio",
    "Pòlissa de l'assegurança": "Póliza del seguro",
    "Condicions del viatge combinat": "Condiciones del viaje combinado",
    "Paga i senyal": "Paga y señal",
    "Segon pagament": "Segundo pago",
    "Pagament final": "Pago final",
    "Moneda i pagaments": "Moneda y pagos",
    "La moneda és el ien. Molts llocs petits només accepten efectiu: porteu-ne sempre una mica. Als caixers de les botigues 7-Eleven podeu treure diners amb targeta.": "La moneda es el yen. Muchos sitios pequeños solo aceptan efectivo: llevad siempre un poco. En los cajeros de las tiendas 7-Eleven podéis sacar dinero con tarjeta.",
    "Endolls": "Enchufes",
    "Els endolls són de tipus A (dues clavilles planes). Porteu un adaptador.": "Los enchufes son de tipo A (dos clavijas planas). Llevad un adaptador.",
    "Propines": "Propinas",
    "Al Japó no es deixa propina: fins i tot pot semblar de mala educació.": "En Japón no se deja propina: incluso puede parecer de mala educación.",
    "Santuari Fushimi Inari": "Santuario Fushimi Inari",
    "Els milers de portes vermelles que pugen per la muntanya. Aneu-hi d'hora al matí per evitar la gent.": "Las miles de puertas rojas que suben por la montaña. Id temprano por la mañana para evitar a la gente.",
    "Ramen a Tòquio": "Ramen en Tokio",
    "Proveu un bol de ramen en un local petit de barri: es demana a la màquina de l'entrada.": "Probad un bol de ramen en un local pequeño de barrio: se pide en la máquina de la entrada.",
    "Targeta Suica": "Tarjeta Suica",
    "Recarregable per al metro i els autobusos de Tòquio. També serveix per pagar a moltes botigues.": "Recargable para el metro y los autobuses de Tokio. También sirve para pagar en muchas tiendas.",
    "Sortida de Barcelona": "Salida de Barcelona",
    "Vol cap a Tòquio amb escala a Doha.": "Vuelo hacia Tokio con escala en Doha.",
    "Sortida del vol": "Salida del vuelo",
    "Arribada a Tòquio": "Llegada a Tokio",
    "Trasllat a l'hotel i primer passeig per Shinjuku.": "Traslado al hotel y primer paseo por Shinjuku.",
    "Trasllat a l'hotel": "Traslado al hotel",
    "Vistes des de l'ajuntament de Tòquio": "Vistas desde el ayuntamiento de Tokio",
    "Tòquio tradicional i modern": "Tokio tradicional y moderno",
    "Asakusa al matí i Shibuya a la tarda.": "Asakusa por la mañana y Shibuya por la tarde.",
    "Temple Senso-ji": "Templo Senso-ji",
    "Encreuament de Shibuya": "Cruce de Shibuya",
    "Tren bala cap a Kyoto": "Tren bala hacia Kioto",
    "Arribada al ryokan i sopar tradicional.": "Llegada al ryokan y cena tradicional.",
    "Shinkansen Tòquio → Kyoto": "Shinkansen Tokio → Kioto",
    "Sopar kaiseki al ryokan": "Cena kaiseki en el ryokan",
    "Aeroport de Barcelona, T1": "Aeropuerto de Barcelona, T1",
    "Sortida de l'aeroport de Haneda": "Salida del aeropuerto de Haneda",
    "Estació de Tòquio": "Estación de Tokio"
    };
  // Idioma de la demo: la llavor es crea en castellà si la demo està en castellà
  const idiomaDemo = () => { try{ return localStorage.getItem("anonta-demo-idioma") || localStorage.getItem("anonta-idioma-panell") || ""; }catch{ return ""; } };
  function enCastella(st){
    const tradueix = o => Object.keys(o).forEach(k => {
      if(typeof o[k] === "string" && ES[o[k]]) o[k] = ES[o[k]];
      else if(o[k] && typeof o[k] === "object" && !Array.isArray(o[k])) tradueix(o[k]);
    });
    Object.values(st.db).filter(Array.isArray).forEach(files => files.forEach(tradueix));
    st.db.an_clients.forEach(c => c.idioma = "es");
    st.db._idioma = "es";
    return st;
  }

  // ---------- emmagatzematge al navegador ----------
  let ST;
  const VERSIO = 2; // es puja quan canvia l'exemple, perquè tothom vegi el nou
  function carregar(){
    const es = idiomaDemo() === "es";
    try{ const db = JSON.parse(localStorage.getItem(CLAU)); const f = JSON.parse(localStorage.getItem(CLAU_FIT));
      if(db && f && (db._idioma === "es") === es && db._versio === VERSIO){ ST = { db, fitxers: f }; return; } }catch{}
    ST = inicial(); ST.db._versio = VERSIO; if(es) enCastella(ST); desar();
  }
  function desar(){
    try{ localStorage.setItem(CLAU, JSON.stringify(ST.db)); localStorage.setItem(CLAU_FIT, JSON.stringify(ST.fitxers)); return true; }
    catch{ return false; }
  }
  window.ANONTA_DEMO = { reiniciar(){ localStorage.removeItem(CLAU); localStorage.removeItem(CLAU_FIT); } };
  carregar();
  window.addEventListener("storage", e => { if(e.key === CLAU || e.key === CLAU_FIT) carregar(); });

  // ---------- què pot veure el client ----------
  function meusViatges(){
    const db = ST.db;
    return new Set(db.an_viatge_clients.filter(x => x.client_id === CLIENT_DEMO)
      .map(x => x.viatge_id).filter(v => db.an_viatges.some(t => t.id === v && t.publicat)));
  }
  function titularDe(v){
    const t = ST.db.an_viatges.find(x => x.id === v);
    return !!t && t.mostrar_pagaments && ST.db.an_viatge_clients.some(x => x.viatge_id === v && x.client_id === CLIENT_DEMO && x.titular);
  }
  function visible(taula, r){
    if(ROL === "admin" || taula === "agencies") return true;
    const meus = meusViatges();
    switch(taula){
      case "an_viatges": return meus.has(r.id);
      case "an_viatge_clients": case "an_serveis": case "an_dies": case "an_desti": return meus.has(r.viatge_id);
      case "an_documents": return r.visible && meus.has(r.viatge_id);
      case "an_pagaments": return meus.has(r.viatge_id) && titularDe(r.viatge_id);
      case "an_clients": return r.id === CLIENT_DEMO;
      case "an_activitats": { const d = ST.db.an_dies.find(x => x.id === r.dia_id); return !!d && meus.has(d.viatge_id); }
    }
    return false;
  }

  // ---------- consultes ----------
  const REL = {
    an_viatges: { an_viatge_clients: { molts: "viatge_id" } },
    an_viatge_clients: { an_clients: { un: "client_id" }, an_viatges: { un: "viatge_id" } },
    an_dies: { an_activitats: { molts: "dia_id" } }
  };
  const PER_DEFECTE = {
    an_clients: () => ({ idioma: "ca", user_id: null, created_at: ara() }),
    an_viatges: () => ({ agencia_id: "rimu", estat: "en_preparacio", publicat: false, mostrar_pagaments: true, created_at: ara(), updated_at: ara() }),
    an_viatge_clients: () => ({ titular: false }),
    an_serveis: () => ({ tipus: "altre", ordre: 0, extra: {}, created_at: ara() }),
    an_documents: () => ({ categoria: "altre", visible: true, created_at: ara() }),
    an_pagaments: () => ({ import: 0, created_at: ara() }),
    an_dies: () => ({ ordre: 0 }), an_activitats: () => ({ ordre: 0 }), an_desti: () => ({ categoria: "consell", ordre: 0 })
  };
  const SENSE_ID = ["an_viatge_clients"];

  function trossos(s){
    const out = []; let prof = 0, act = "";
    for(const c of s){
      if(c === "(") prof++;
      if(c === ")") prof--;
      if(c === "," && prof === 0){ out.push(act.trim()); act = ""; } else act += c;
    }
    if(act.trim()) out.push(act.trim());
    return out;
  }
  function projectar(taula, fila, sel){
    if(!sel || sel === "*") return { ...fila };
    const o = {};
    trossos(sel).forEach(camp => {
      const m = camp.match(/^(\w+)\((.*)\)$/s);
      if(camp === "*") Object.assign(o, fila);
      else if(m){
        const rel = REL[taula]?.[m[1]];
        if(!rel) return;
        if(rel.molts) o[m[1]] = ST.db[m[1]].filter(x => x[rel.molts] === fila.id && visible(m[1], x)).map(x => projectar(m[1], x, m[2]));
        else { const p = ST.db[m[1]].find(x => x.id === fila[rel.un]); o[m[1]] = p ? projectar(m[1], p, m[2]) : null; }
      }
      else o[camp] = fila[camp] ?? null;
    });
    return o;
  }

  class Consulta {
    constructor(taula){ this.t = taula; this.op = "select"; this.sel = "*"; this.f = []; this.ord = []; this.lim = null; this.un = null; this.cap = false; }
    select(s, opts){ if(this.op === "select") this.sel = s || "*"; else this.selRet = s || "*"; if(opts?.head) this.cap = true; if(opts?.count) this.compte = true; return this; }
    eq(k, v){ this.f.push(r => r[k] === v); return this; }
    in(k, arr){ this.f.push(r => arr.includes(r[k])); return this; }
    order(k, o = {}){ this.ord.push([k, o.ascending !== false, o.nullsFirst === true]); return this; }
    limit(n){ this.lim = n; return this; }
    single(){ this.un = "single"; return this; }
    maybeSingle(){ this.un = "maybe"; return this; }
    insert(r){ this.op = "insert"; this.dades = Array.isArray(r) ? r : [r]; return this; }
    update(r){ this.op = "update"; this.dades = r; return this; }
    delete(){ this.op = "delete"; return this; }
    then(ok, ko){ return Promise.resolve().then(() => this.exec()).then(ok, ko); }
    exec(){
      const db = ST.db, t = this.t;
      if(!db[t]) return { data: null, error: { message: "Taula desconeguda: " + t } };
      const coincideix = r => visible(t, r) && this.f.every(f => f(r));
      let files;
      if(this.op === "insert"){
        if(ROL !== "admin") return { data: null, error: { message: "permission denied" } };
        files = this.dades.map(d => ({ ...(PER_DEFECTE[t] ? PER_DEFECTE[t]() : {}), ...(SENSE_ID.includes(t) ? {} : { id: id() }), ...d }));
        db[t].push(...files);
      }else if(this.op === "update"){
        if(ROL !== "admin") return { data: null, error: { message: "permission denied" } };
        files = db[t].filter(coincideix);
        files.forEach(r => Object.assign(r, this.dades, t === "an_viatges" ? { updated_at: ara() } : {}));
      }else if(this.op === "delete"){
        if(ROL !== "admin") return { data: null, error: { message: "permission denied" } };
        files = db[t].filter(coincideix);
        const ids = new Set(files.map(r => r.id));
        db[t] = db[t].filter(r => !files.includes(r));
        if(t === "an_viatges"){
          ["an_viatge_clients", "an_serveis", "an_documents", "an_pagaments", "an_desti"].forEach(x => db[x] = db[x].filter(r => !ids.has(r.viatge_id)));
          const dies = new Set(db.an_dies.filter(r => ids.has(r.viatge_id)).map(r => r.id));
          db.an_dies = db.an_dies.filter(r => !dies.has(r.id));
          db.an_activitats = db.an_activitats.filter(r => !dies.has(r.dia_id));
        }
        if(t === "an_dies") db.an_activitats = db.an_activitats.filter(r => !ids.has(r.dia_id));
        if(t === "an_clients") db.an_viatge_clients = db.an_viatge_clients.filter(r => !ids.has(r.client_id));
      }else{
        files = db[t].filter(coincideix);
      }
      if(this.op !== "select"){
        if(!desar()) return { data: null, error: { message: "La demostració està plena: torna a l'exemple inicial." } };
        if(!this.selRet) return { data: null, error: null };
      }
      // ordre i límit
      if(this.ord.length){
        files = [...files].sort((a, b) => {
          for(const [k, asc, nullsFirst] of this.ord){
            const x = a[k], y = b[k];
            if(x == null && y == null) continue;
            if(x == null) return nullsFirst ? -1 : 1;
            if(y == null) return nullsFirst ? 1 : -1;
            if(x < y) return asc ? -1 : 1;
            if(x > y) return asc ? 1 : -1;
          }
          return 0;
        });
      }
      if(this.lim != null) files = files.slice(0, this.lim);
      const n = files.length;
      if(this.cap) return { data: null, error: null, count: n };
      let data = files.map(r => projectar(t, r, this.op === "select" ? this.sel : this.selRet));
      if(this.un){
        if(!data.length) return this.un === "maybe" ? { data: null, error: null } : { data: null, error: { message: "No s'ha trobat" } };
        data = data[0];
      }
      return { data, error: null, count: this.compte ? n : null };
    }
  }

  // ---------- fitxers ----------
  const llegir = blob => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(blob); });
  function urlDe(ruta, perObrir){
    const d = ST.fitxers[ruta];
    if(!d) return null;
    if(!perObrir || d.startsWith("data:image/")) return d;
    try{
      const [cap, cos] = d.split(",");
      const tipus = (cap.match(/data:([^;,]+)/) || [])[1] || "application/octet-stream";
      const bytes = /;base64/.test(cap) ? Uint8Array.from(atob(cos), c => c.charCodeAt(0)) : new TextEncoder().encode(decodeURIComponent(cos));
      return URL.createObjectURL(new Blob([bytes], { type: tipus }));
    }catch{ return d; }
  }
  const emmagatzematge = { from(){ return {
    async upload(ruta, blob){
      if(ROL !== "admin") return { data: null, error: { message: "permission denied" } };
      if(blob.size > 1.5 * 1024 * 1024) return { data: null, error: { message: "A la demostració només es poden pujar fitxers petits (fins a 1,5 MB)." } };
      ST.fitxers[ruta] = await llegir(blob);
      if(!desar()){ delete ST.fitxers[ruta]; return { data: null, error: { message: "La demostració està plena: torna a l'exemple inicial." } }; }
      return { data: { path: ruta }, error: null };
    },
    async createSignedUrls(rutes){ return { data: rutes.map(p => ({ path: p, signedUrl: urlDe(p, false) })), error: null }; },
    async createSignedUrl(ruta){ const u = urlDe(ruta, true); return u ? { data: { signedUrl: u }, error: null } : { data: null, error: { message: "no trobat" } }; },
    async remove(rutes){ rutes.forEach(p => { if(!p.startsWith("demo/")) delete ST.fitxers[p]; }); desar(); return { data: null, error: null }; },
    async list(prefix){ return { data: Object.keys(ST.fitxers).filter(k => k.startsWith(prefix + "/")).map(k => ({ id: k, name: k.slice(prefix.length + 1) })), error: null }; }
  }; } };

  // ---------- funcions del servidor ----------
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const IA = {
    ca: [
      ["info", "Moneda i efectiu", "La moneda és el ien. Molts establiments petits només accepten efectiu, així que porteu-ne sempre una mica.", ""],
      ["info", "Clima", "Consulteu la previsió uns dies abans de marxar i porteu roba per capes: entre el matí i la nit hi pot haver diferència de temperatura.", ""],
      ["consell", "Silenci al transport públic", "Al metro i als trens es parla fluix i no es parla per telèfon. Poseu el mòbil en silenci.", ""],
      ["consell", "Sabates fàcils de treure", "En temples, ryokans i alguns restaurants us haureu de treure les sabates.", ""],
      ["visita", "Temple Kinkaku-ji", "El Pavelló Daurat, envoltat d'un jardí amb estany. Un dels llocs més fotografiats de Kyoto.", "Kinkaku-ji, Kyoto"],
      ["visita", "Bosc de bambú d'Arashiyama", "Un passeig entre bambús altíssims. Millor a primera hora del matí.", "Arashiyama Bamboo Grove, Kyoto"],
      ["restaurant", "Mercat de Nishiki", "Un carrer cobert ple de parades on tastar productes locals. Ideal per anar picant.", "Nishiki Market, Kyoto"],
      ["restaurant", "Dotonbori", "El barri més animat d'Osaka per menjar takoyaki i okonomiyaki.", "Dotonbori, Osaka"],
      ["compres", "Botigues de cent iens", "Hi trobareu records petits i curiosos a molt bon preu.", ""],
      ["transport", "Japan Rail Pass", "Recordeu activar-lo a la primera estació i reservar seient als trens bala quan pugueu.", ""]
    ],
    es: [
      ["info", "Moneda y efectivo", "La moneda es el yen. Muchos establecimientos pequeños solo aceptan efectivo, así que llevad siempre un poco.", ""],
      ["info", "Clima", "Consultad la previsión unos días antes de salir y llevad ropa por capas.", ""],
      ["consell", "Silencio en el transporte público", "En el metro y los trenes se habla bajo y no se habla por teléfono.", ""],
      ["visita", "Templo Kinkaku-ji", "El Pabellón Dorado, rodeado de un jardín con estanque.", "Kinkaku-ji, Kyoto"],
      ["restaurant", "Mercado de Nishiki", "Una calle cubierta llena de puestos donde probar productos locales.", "Nishiki Market, Kyoto"],
      ["transport", "Japan Rail Pass", "Recordad activarlo en la primera estación y reservar asiento en los trenes bala.", ""]
    ]
  };
  const CAMPS_TR = { an_viatges: ["titol", "desti", "pais", "descripcio"], an_serveis: ["titol", "descripcio"], an_documents: ["nom"],
    an_pagaments: ["concepte"], an_dies: ["titol", "descripcio"], an_activitats: ["nom", "lloc", "descripcio"], an_desti: ["titol", "descripcio"] };
  const funcions = { async invoke(nom, { body } = {}){
    if(nom === "anonta-traduir"){
      await espera(250);
      const t = {};
      if(body.idioma === "es"){
        const ids = new Set(body.viatges || []);
        const dies = new Set(ST.db.an_dies.filter(d => ids.has(d.viatge_id)).map(d => d.id));
        Object.entries(CAMPS_TR).forEach(([taula, camps]) => ST.db[taula]
          .filter(r => visible(taula, r) && (taula === "an_viatges" ? ids.has(r.id) : taula === "an_activitats" ? dies.has(r.dia_id) : ids.has(r.viatge_id)))
          .forEach(r => {
            camps.forEach(c => { if(r[c] && ES[r[c]]) t[`${taula}:${r.id}:${c}`] = ES[r[c]]; });
            if(taula === "an_serveis") Object.entries(r.extra || {}).forEach(([k, val]) => { if(typeof val === "string" && ES[val]) t[`an_serveis:${r.id}:x_${k}`] = ES[val]; });
          }));
      }
      return { data: { t }, error: null };
    }
    await espera(nom === "anonta-desti" ? 1500 : 400);
    if(ROL !== "admin") return { data: null, error: { message: "permission denied" } };
    if(nom === "anonta-comptes"){
      const c = ST.db.an_clients.find(x => x.id === body.client_id);
      if(!c) return { data: { error: "CLIENT_NO_EXISTEIX" }, error: null };
      if(body.accio === "crear") c.user_id = "u-" + c.id;
      if(body.accio === "treure") c.user_id = null;
      desar();
      return { data: { ok: true }, error: null };
    }
    if(nom === "anonta-desti"){
      const cats = body.categories || [];
      const items = (IA[body.idioma === "es" ? "es" : "ca"]).filter(x => cats.includes(x[0]))
        .map(([categoria, titol, descripcio, adreca]) => ({ categoria, titol, descripcio, adreca }));
      return { data: { items }, error: null };
    }
    return { data: null, error: { message: "Funció desconeguda" } };
  } };

  const rpc = async (nom, p = {}) => {
    const db = ST.db;
    if(nom === "an_es_admin") return { data: ROL === "admin", error: null };
    const marca = () => ({ ...db.agencies[0], propia: true });
    if(nom === "perfil_actual") return { data: { email: "demo", superadmin: false, agencia: db.agencies[0] }, error: null };
    if(nom === "an_perfil") return { data: ROL === "admin" ? { email: "agencia@exemple.com", superadmin: false,
      agencia: { ...marca(), pla: "premium", prova_fins: null, email_avis: null } } : null, error: null };
    if(nom === "an_marca") return { data: p.p_agencia === db.agencies[0].id ? marca() : null, error: null };
    if(nom === "an_pot_crear") return { data: true, error: null };
    if(nom === "an_marcar_avis_prova") return { data: false, error: null };
    if(nom === "an_veu_pagaments") return { data: titularDe(p.p_viatge), error: null };
    if(nom === "an_companys"){
      if(ROL !== "admin" && !meusViatges().has(p.p_viatge)) return { data: [], error: null };
      const d = db.an_viatge_clients.filter(x => x.viatge_id === p.p_viatge)
        .map(x => { const c = db.an_clients.find(k => k.id === x.client_id) || {}; return { nom: c.nom, cognoms: c.cognoms, titular: x.titular }; })
        .sort((a, b) => b.titular - a.titular || String(a.nom).localeCompare(String(b.nom)));
      return { data: d, error: null };
    }
    return { data: null, error: { message: "Funció desconeguda" } };
  };

  const usuari = ROL === "admin" ? { id: "u-admin", email: "agencia@exemple.com" } : { id: USUARI_CLIENT, email: "marta@exemple.com" };
  const auth = {
    async getSession(){ return { data: { session: { user: usuari } } }; },
    async getUser(){ return { data: { user: usuari } }; },
    async signInWithPassword(){ return { data: { user: usuari }, error: null }; },
    async signOut(){ return { error: null }; },
    async updateUser(){ await espera(300); return { data: { user: usuari }, error: null }; },
    onAuthStateChange(){ return { data: { subscription: { unsubscribe(){} } } }; }
  };

  const client = { from: t => new Consulta(t), rpc, storage: emmagatzematge, functions: funcions, auth };
  window.supabase = { createClient: () => client };

  // ---------- banda de demostració (només si la pàgina s'obre sola, fora de demo.html) ----------
  if(window.top === window){
    document.addEventListener("DOMContentLoaded", () => {
      const b = document.createElement("div");
      b.style.cssText = "background:#22313F;color:#fff;text-align:center;font-size:13.5px;padding:9px 14px";
      const es = (localStorage.getItem("anonta-idioma") || navigator.language || "").startsWith("es");
      b.innerHTML = es
        ? `👀 <strong style="color:#FFD58A">Modo demostración</strong> · Los cambios solo se guardan en este navegador. <a href="demo.html" style="color:#fff;font-weight:700">Ver la demo completa</a>`
        : `👀 <strong style="color:#FFD58A">Mode demostració</strong> · Els canvis només es guarden en aquest navegador. <a href="demo.html" style="color:#fff;font-weight:700">Veure la demo completa</a>`;
      document.body.prepend(b);
    });
  }
})();
