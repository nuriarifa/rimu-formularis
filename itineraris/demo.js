// Dades de la DEMOSTRACIÓ (admin.html?demo i index.html?demo).
// Res d'això va a la base de dades: es guarda només al navegador de qui prova la demo.
window.IT_DEMO = (function(){
  const CLAU = "it_demo_v1";
  const AGENCIA = {
    id: "rimu", nom: "Rimu Viatges", idioma_fix: null,
    color: "#3D698E", color_fosc: "#2C5274", color_clar: "#EAF1F7", accent: "#E79893", accent_clar: "#FBEDEC",
    lema_ca: "El teu pròxim destí comença aquí", lema_es: "Tu próximo destino empieza aquí", logo_fitxer: "logo.js"
  };

  // Data d'inici: d'aquí a uns dos mesos, perquè sempre sembli un viatge futur
  function dataFutura(dies){ const d = new Date(); d.setDate(d.getDate() + dies); return d.toISOString().slice(0, 10); }
  const fa = minuts => new Date(Date.now() - minuts * 60000).toISOString();

  function estatNou(lang){
    const t = (ca, es) => lang === "es" ? es : ca;
    const ini = dataFutura(60), fi = dataFutura(63);
    const it = {
      id: "demo-roma", token: "demo", titol: t("Escapada a Roma", "Escapada a Roma"), client_nom: "Marta i Jordi",
      destinacio: "Roma", data_inici: ini, data_fi: fi, num_persones: 2, idioma: lang, mostrar_preus: true,
      introduccio: t("Hola Marta i Jordi! Us hem preparat quatre dies a Roma per gaudir de la ciutat amb calma: història, bon menjar i passejades pels barris amb més encant. Podeu treure els serveis opcionals que no us interessin i el preu s'actualitza sol.",
        "¡Hola Marta y Jordi! Os hemos preparado cuatro días en Roma para disfrutar de la ciudad con calma: historia, buena comida y paseos por los barrios con más encanto. Podéis quitar los servicios opcionales que no os interesen y el precio se actualiza solo."),
      notes: t("Recomanem calçat còmode: Roma es visita sobretot a peu.", "Recomendamos calzado cómodo: Roma se visita sobre todo a pie."),
      info: {
        inclou: t("Vols d'anada i tornada amb maleta facturada\n3 nits d'hotel amb esmorzar\nTrasllat d'arribada\nVisita guiada al Colosseu", "Vuelos de ida y vuelta con maleta facturada\n3 noches de hotel con desayuno\nTraslado de llegada\nVisita guiada al Coliseo"),
        no_inclou: t("Taxa turística de Roma (es paga a l'hotel)\nÀpats no especificats", "Tasa turística de Roma (se paga en el hotel)\nComidas no especificadas"),
        documentacio: t("DNI o passaport en vigor.", "DNI o pasaporte en vigor."),
        pagament: t("30% a la reserva i la resta 30 dies abans de la sortida, per transferència o targeta.", "30% en la reserva y el resto 30 días antes de la salida, por transferencia o tarjeta."),
        cancelacio: t("Fins a 30 dies abans: 10%. De 29 a 15 dies: 50%. Menys de 15 dies: 100%.", "Hasta 30 días antes: 10%. De 29 a 15 días: 50%. Menos de 15 días: 100%.")
      },
      imatge_portada: null, seleccio: {}, seleccio_at: null, updated_at: fa(90)
    };
    const dies = [
      { id: "demo-d1", ordre: 1, titol: t("Arribada a Roma", "Llegada a Roma"), descripcio: t("Arribada a Roma i trasllat a l'hotel. A la tarda, primera passejada per la Fontana di Trevi i la Piazza di Spagna.", "Llegada a Roma y traslado al hotel. Por la tarde, primer paseo por la Fontana di Trevi y la Piazza di Spagna.") },
      { id: "demo-d2", ordre: 2, titol: t("La Roma antiga", "La Roma antigua"), descripcio: t("Dia dedicat a la Roma dels emperadors: Colosseu, Fòrum Romà i Palatí. Al vespre, sopar al Trastevere.", "Día dedicado a la Roma de los emperadores: Coliseo, Foro Romano y Palatino. Por la noche, cena en el Trastevere.") },
      { id: "demo-d3", ordre: 3, titol: t("El Vaticà", "El Vaticano"), descripcio: t("Matí als Museus Vaticans i la Capella Sixtina. Tarda lliure per descobrir el Panteó i la Piazza Navona.", "Mañana en los Museos Vaticanos y la Capilla Sixtina. Tarde libre para descubrir el Panteón y la Piazza Navona.") },
      { id: "demo-d4", ordre: 4, titol: t("Tornada a casa", "Vuelta a casa"), descripcio: t("Últim esmorzar a Roma, temps lliure i vol de tornada.", "Último desayuno en Roma, tiempo libre y vuelo de vuelta.") }
    ].map(d => ({ ...d, itinerari_id: it.id }));
    const vol = (extra) => ({ cabina: true, cabina_kg: 10, facturada: true, facturada_kg: 23, companyia: "Vueling", ...extra });
    const serveis = [
      { id: "demo-s1", dia_id: null, ordre: 1, tipus: "hotel", nom: "Hotel Artemide", detalls: t("3 nits · Habitació doble", "3 noches · Habitación doble"),
        descripcio: t("Hotel elegant a la Via Nazionale, a pocs minuts a peu de la Fontana di Trevi.", "Hotel elegante en la Via Nazionale, a pocos minutos a pie de la Fontana di Trevi."),
        preu: 240, preu_unitat: "persona", extra: { allotjament: "hotel", estrelles: 4, regim: "ad", tot_viatge: true } },
      { id: "demo-s2", dia_id: null, ordre: 2, tipus: "asseguranca", nom: t("Assegurança de viatge i cancel·lació", "Seguro de viaje y cancelación"), detalls: t("Cobertura mèdica i despeses de cancel·lació", "Cobertura médica y gastos de cancelación"),
        descripcio: "", preu: 25, preu_unitat: "persona", opcional: true, extra: { tot_viatge: true } },
      { id: "demo-s3", dia_id: "demo-d1", ordre: 1, tipus: "vol", nom: "", detalls: "", descripcio: "", preu: 95, preu_unitat: "persona",
        extra: vol({ numero: "VY6104", data: ini, origen: "Barcelona (BCN)", desti: "Roma (FCO)", sortida: "07:05", arribada: "08:50", abans: true }) },
      { id: "demo-s4", dia_id: "demo-d1", ordre: 1, tipus: "trasllat", nom: t("Trasllat aeroport – hotel", "Traslado aeropuerto – hotel"), detalls: t("Vehicle privat", "Vehículo privado"),
        descripcio: "", preu: 60, preu_unitat: "grup", extra: { hora: "09:15" } },
      { id: "demo-s5", dia_id: "demo-d2", ordre: 1, tipus: "excursio", nom: t("Visita guiada al Colosseu i Fòrum", "Visita guiada al Coliseo y Foro"), detalls: t("3 hores · Guia en castellà", "3 horas · Guía en castellano"),
        descripcio: t("Entrada sense cues i guia expert per entendre la vida a l'antiga Roma.", "Entrada sin colas y guía experto para entender la vida en la antigua Roma."),
        preu: 55, preu_unitat: "persona", extra: { hora: "09:30" } },
      { id: "demo-s6", dia_id: "demo-d2", ordre: 2, tipus: "altre", nom: t("Sopar al Trastevere", "Cena en el Trastevere"), detalls: t("Menú de degustació", "Menú degustación"),
        descripcio: "", preu: 90, preu_unitat: "grup", opcional: true, extra: {} },
      { id: "demo-s7", dia_id: "demo-d3", ordre: 1, tipus: "excursio", nom: t("Museus Vaticans i Capella Sixtina", "Museos Vaticanos y Capilla Sixtina"), detalls: t("Entrada amb guia", "Entrada con guía"),
        descripcio: "", preu: 65, preu_unitat: "persona", opcional: true, opcional_per_persones: true, extra: { hora: "08:30" } },
      { id: "demo-s8", dia_id: "demo-d4", ordre: 1, tipus: "vol", nom: "", detalls: "", descripcio: "", preu: 95, preu_unitat: "persona",
        extra: vol({ numero: "VY6107", data: fi, origen: "Roma (FCO)", desti: "Barcelona (BCN)", sortida: "18:40", arribada: "20:25" }) }
    ].map(s => ({ itinerari_id: it.id, opcional: false, opcional_per_persones: false, imatge_url: null, ...s }));
    const docs = [{ id: "demo-doc1", itinerari_id: it.id, nom: t("Condicions de l'assegurança.pdf", "Condiciones del seguro.pdf"), path: "" }];
    const events = [
      { itinerari_id: it.id, tipus: "obert", created_at: fa(30), detall: { dispositiu: t("Mòbil · iPhone/iPad", "Móvil · iPhone/iPad") } },
      { itinerari_id: it.id, tipus: "seleccio", servei_id: "demo-s6", created_at: fa(28), detall: { actiu: false } },
      { itinerari_id: it.id, tipus: "seleccio", servei_id: "demo-s6", created_at: fa(27), detall: { actiu: true } },
      { itinerari_id: it.id, tipus: "pdf", created_at: fa(25), detall: {} },
      { itinerari_id: it.id, tipus: "obert", created_at: fa(60 * 26), detall: { dispositiu: t("Ordinador · Windows", "Ordenador · Windows") } }
    ];
    const bib = [
      { id: "demo-b1", tipus: "hotel", nom: "Hotel Artemide", detalls: t("Roma · 4★ · Esmorzar inclòs", "Roma · 4★ · Desayuno incluido"), descripcio: "", preu: 80, preu_unitat: "persona", imatge_url: null, extra: { allotjament: "hotel", estrelles: 4, regim: "ad" } },
      { id: "demo-b2", tipus: "trasllat", nom: t("Trasllat aeroport – hotel", "Traslado aeropuerto – hotel"), detalls: t("Vehicle privat", "Vehículo privado"), descripcio: "", preu: 60, preu_unitat: "grup", imatge_url: null, extra: {} },
      { id: "demo-b3", tipus: "asseguranca", nom: t("Assegurança de viatge bàsica", "Seguro de viaje básico"), detalls: "", descripcio: "", preu: 18, preu_unitat: "persona", imatge_url: null, extra: {} }
    ];
    return { lang, its: [{ it, dies, serveis, docs }], events, bib };
  }

  function carregar(lang){
    try{
      const e = JSON.parse(localStorage.getItem(CLAU) || "null");
      if(e && e.its && (!lang || e.lang === lang || e.tocat)) return e;
    }catch(err){}
    const e = estatNou(lang || "ca"); desar(e); return e;
  }
  function desar(e){ try{ localStorage.setItem(CLAU, JSON.stringify(e)); }catch(err){} }
  function reiniciar(lang){ const e = estatNou(lang || "ca"); desar(e); return e; }

  // Les mateixes dades que veuria el client (com it_public_get)
  function publica(id){
    let e = carregar(null);
    if(!e.its.length) e = reiniciar(e.lang);
    const x = e.its.find(i => i.it.id === id) || e.its[0];
    const it = x.it;
    return {
      titol: it.titol, client_nom: it.client_nom, destinacio: it.destinacio, data_inici: it.data_inici, data_fi: it.data_fi,
      num_persones: it.num_persones, idioma: it.idioma, mostrar_preus: it.mostrar_preus, introduccio: it.introduccio,
      notes: it.notes, info: it.info || {}, imatge_portada: it.imatge_portada, seleccio: it.seleccio || {},
      dies: [...x.dies].sort((a, b) => a.ordre - b.ordre).map(d => ({ id: d.id, ordre: d.ordre, titol: d.titol, descripcio: d.descripcio })),
      serveis: [...x.serveis].sort((a, b) => a.ordre - b.ordre).map(s => ({ ...s, preu: it.mostrar_preus ? s.preu : null })),
      documents: (x.docs || []).map(d => ({ id: d.id, nom: d.nom })), agencia: AGENCIA, _id: it.id
    };
  }
  // El client de la demo canvia un opcional: es guarda al navegador
  function desarSeleccio(id, seleccio, servei, detall){
    const e = carregar(null);
    const x = e.its.find(i => i.it.id === id); if(!x) return;
    x.it.seleccio = seleccio; x.it.seleccio_at = new Date().toISOString(); e.tocat = true;
    if(servei) e.events.unshift({ itinerari_id: id, tipus: "seleccio", servei_id: servei, created_at: new Date().toISOString(), detall });
    desar(e);
  }
  function afegirEvent(id, tipus, detall){
    const e = carregar(null);
    e.events.unshift({ itinerari_id: id, tipus, created_at: new Date().toISOString(), detall: detall || {} });
    desar(e);
  }

  // Textos d'exemple per al botó «Redactar amb IA» de la demo
  function textIA(que, lang, ctx){
    const t = (ca, es) => lang === "es" ? es : ca;
    const lloc = (ctx && (ctx.destinacio || ctx.titol)) || t("la destinació", "el destino");
    if(que === "intro") return t(`Us hem preparat un viatge a ${lloc} pensat perquè només us hàgiu de preocupar de gaudir. Aquí teniu el detall dia a dia, amb tots els serveis inclosos i alguns d'opcionals que podeu treure si no us interessen.`,
      `Os hemos preparado un viaje a ${lloc} pensado para que solo os tengáis que preocupar de disfrutar. Aquí tenéis el detalle día a día, con todos los servicios incluidos y algunos opcionales que podéis quitar si no os interesan.`);
    if(que === "dia") return t(`Dia per descobrir ${lloc} amb calma: passejada pels llocs imprescindibles, temps per dinar amb tranquil·litat i una tarda lliure per perdre's pels carrers amb més encant.`,
      `Día para descubrir ${lloc} con calma: paseo por los lugares imprescindibles, tiempo para comer con tranquilidad y una tarde libre para perderse por las calles con más encanto.`);
    return t("Una experiència pensada perquè la recordeu: tot organitzat, sense cues i amb el temps just per gaudir-la.",
      "Una experiencia pensada para que la recordéis: todo organizado, sin colas y con el tiempo justo para disfrutarla.");
  }

  return { AGENCIA, carregar, desar, reiniciar, publica, desarSeleccio, afegirEvent, textIA };
})();
