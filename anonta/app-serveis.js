// Anonta · App del client: serveis amb els camps propis de cada tipus (vol, allotjament, excursió, assegurança)
tabServeis = function(cos, v, d){
  const trS = (s, camp) => camp.startsWith("x_")
    ? (S.tr[`an_serveis:${s.id}:${camp}`] ?? (s.extra || {})[camp.slice(2)])
    : tr("an_serveis", s, camp);
  cos.innerHTML = `<div class="targeta">${d.serveis.map(s => SRV.htmlClient(s, S.idioma, trS, esc, text)).join("")}</div>`;
};
// si la pàgina s'ha obert directament a la pestanya de serveis, es torna a pintar amb la versió nova
if(/\/serveis$/.test(location.hash) && document.querySelector(".pestanyes .actiu[data-t=serveis]")) route(true);
