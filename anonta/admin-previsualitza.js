// Anonta · Panell: botó per previsualitzar un viatge tal com el veurà el client
(function(){
  const base = vistaViatge;
  vistaViatge = async function(id, sub){
    await base(id, sub);
    const cap = pantalla.querySelector(".fila.entre");
    if(!cap || cap.querySelector("[data-prev]")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "boto sec petit"; b.dataset.prev = "1";
    b.textContent = "👁️ " + L("Veure com ho veu el client", "Ver cómo lo ve el cliente");
    b.onclick = () => {
      if(DEMO){
        try{ if(window.parent !== window && window.parent.anar){ window.parent.anar("client"); return; } }catch{}
        window.open("index.html?demo", "_blank"); return;
      }
      window.open("preview.html?v=" + encodeURIComponent(id), "_blank");
    };
    const xip = cap.querySelector(".xip");
    const grup = document.createElement("span"); grup.className = "fila";
    if(xip) cap.replaceChild(grup, xip);
    else cap.appendChild(grup);
    if(xip) grup.appendChild(xip);
    grup.appendChild(b);
  };
})();
