// Anonta · Tarifes dels plans (preus sense IVA) i qui pot fer servir la IA
const PREU = { basic: 20, premium: 25 };
const textTarifes = () => L(`<b>Bàsic</b> ${PREU.basic} €/mes (logo d'Anonta, sense IA) o <b>Prèmium</b> ${PREU.premium} €/mes (el teu logo i colors, amb IA). Preus sense IVA.`,
  `<b>Básico</b> ${PREU.basic} €/mes (logo de Anonta, sin IA) o <b>Prémium</b> ${PREU.premium} €/mes (tu logo y colores, con IA). Precios sin IVA.`);
// La IA només és al pla Prèmium i durant el mes de prova
function teIA(){
  if(DEMO) return true;
  const ag = A.agencia;
  return !!ag && (ag.pla === "premium" || (ag.pla === "prova" && !!ag.prova_fins && diesFins(ag.prova_fins) >= 0));
}
// A la banda del mes de prova s'hi afegeixen les tarifes
(function(){
  const base = comprovarProva;
  comprovarProva = async function(){
    const r = base();
    const ag = A.agencia, banda = $("bandaProva");
    if(!DEMO && ag && ag.pla === "prova" && ag.prova_fins && !banda.classList.contains("amagat")){
      const acabada = diesFins(ag.prova_fins) < 0;
      banda.insertAdjacentHTML("beforeend", acabada
        ? `<div style="margin-top:6px">${textTarifes()}</div>`
        : `<div class="meta" style="margin-top:4px">${L("Després podràs triar:", "Después podrás elegir:")} ${textTarifes()}</div>`);
    }
    return r;
  };
})();
