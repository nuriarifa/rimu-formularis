# Genera la portada d'anonta.es per als cercadors (Google, Bing…):
#  - index.html (castellà) i ca/index.html (català) amb el text ja escrit dins l'HTML
#  - etiquetes SEO, hreflang i dades estructurades (JSON-LD)
# Ús: des de l'arrel del repositori, amb un servidor local al port 8767:
#   (python3 -m http.server 8767 >/dev/null 2>&1 &); python3 eines/seo-landing.py
# Cal tornar-lo a executar si es canvien els textos de la portada.
import asyncio, json, re, html
from playwright.async_api import async_playwright

DOMINI = "https://anonta.es"
IMATGE = "https://ewcrlyoiyfcbzjsqaqzr.supabase.co/functions/v1/og-anonta"  # funció de Supabase que dibuixa la imatge
SEO = {
  "es": dict(url=DOMINI + "/", locale="es_ES",
    title="Anonta · App y software para agencias de viajes: itinerarios y datos de viajeros",
    desc="App de viaje con el logo de tu agencia, itinerarios y presupuestos con IA y formulario de datos de viajeros. Pensado por una agencia de viajes. 30 días gratis."),
  "ca": dict(url=DOMINI + "/ca/", locale="ca_ES",
    title="Anonta · App i programari per a agències de viatges: itineraris i dades de viatgers",
    desc="App de viatge amb el logo de la teva agència, itineraris i pressupostos amb IA i formulari de dades de viatgers. Pensat per una agència de viatges. 30 dies gratis."),
}

def bloc(l, d):
  s = SEO[l]; e = lambda x: html.escape(x, quote=True)
  ld = [
    {"@context": "https://schema.org", "@type": "Organization", "@id": DOMINI + "/#org", "name": "Anonta", "url": DOMINI + "/",
     "logo": DOMINI + "/anonta/icona-anonta.svg", "email": "admin@rimuviatges.com"},
    {"@context": "https://schema.org", "@type": "WebSite", "name": "Anonta", "url": s["url"], "inLanguage": l, "publisher": {"@id": DOMINI + "/#org"}},
  ] + [
    {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": a["nom"], "description": a["lema"],
     "applicationCategory": "BusinessApplication", "operatingSystem": "Web, iOS, Android", "url": s["url"] + "#apps", "inLanguage": l,
     "publisher": {"@id": DOMINI + "/#org"},
     "offers": [{"@type": "Offer", "name": p["nom"], "price": p["preu"], "priceCurrency": "EUR", "valueAddedTaxIncluded": True} for p in a["plans"]]}
    for a in d["apps"]
  ] + [
    {"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": l,
     "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": r}} for q, r in d["faq"]]}
  ]
  return "\n".join([
    "<!--SEO-->",
    f'<title>{e(s["title"])}</title>',
    f'<meta name="description" content="{e(s["desc"])}">',
    f'<link rel="canonical" href="{s["url"]}">',
    f'<link rel="alternate" hreflang="es" href="{DOMINI}/">',
    f'<link rel="alternate" hreflang="ca" href="{DOMINI}/ca/">',
    f'<link rel="alternate" hreflang="x-default" href="{DOMINI}/">',
    '<meta name="robots" content="index,follow,max-image-preview:large">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Anonta">',
    f'<meta property="og:locale" content="{s["locale"]}">',
    f'<meta property="og:url" content="{s["url"]}">',
    f'<meta property="og:title" content="{e(s["title"])}">',
    f'<meta property="og:description" content="{e(s["desc"])}">',
    f'<meta property="og:image" content="{IMATGE}{"?l=ca" if l == "ca" else ""}">',
    '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    f'<meta name="twitter:image" content="{IMATGE}{"?l=ca" if l == "ca" else ""}">',
    f'<link rel="apple-touch-icon" href="{IMATGE}?icona">',
    '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + "</script>",
    "<!--/SEO-->"])

LLEGIR = """() => {
  const W = TARIFES.web, t = s => s.trim();
  const noms = [...document.querySelectorAll('#llistaApps .app')].map(a => ({nom: t(a.querySelector('h3').textContent), lema: t(a.querySelector('.lema').textContent)}));
  const plaN = [...document.querySelectorAll('#taulaPreus .preu')].map(p => [...p.querySelectorAll('.pla .nom > span:first-child')].map(x => t(x.childNodes[0].textContent)));
  const preus = [[W.anonta.basic, W.anonta.premium], [W.itineraris.basic, W.itineraris.premium], [W.formularis]];
  noms.forEach((a, i) => a.plans = preus[i].map((p, j) => ({nom: plaN[i][j], preu: p})));
  const faq = [...document.querySelectorAll('#faq details')].map(d => [t(d.querySelector('summary').textContent), t(d.querySelector('p').textContent)]);
  return {apps: noms, faq, body: document.body.outerHTML};
}"""

async def main():
  font = open("index.html", encoding="utf-8").read()
  font = re.sub(r"<!--SEO-->.*?<!--/SEO-->", "<!--SEO-->\n<!--/SEO-->", font, flags=re.S)
  ca = font.replace('<html lang="es">', '<html lang="ca" data-idioma="ca">', 1)
  import os; os.makedirs("ca", exist_ok=True)
  open("ca/index.html", "w", encoding="utf-8").write(ca)
  async with async_playwright() as p:
    b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    for l, fitxer, src, url in [("es", "index.html", font, "/"), ("ca", "ca/index.html", ca, "/ca/")]:
      ctx = await b.new_context(locale="en-US"); pg = await ctx.new_page()
      await pg.route("**/gc.zgo.at/**", lambda r: r.abort())
      await pg.goto("http://localhost:8767" + url); await pg.wait_for_timeout(800)
      d = await pg.evaluate(LLEGIR); await ctx.close()
      cap = src[:src.index("<body>")].replace("<!--SEO-->\n<!--/SEO-->", bloc(l, d))
      cos = src[src.index("</body>") + len("</body>"):]
      cos_html = re.sub(r"\s+</body>$", "\n</body>", d["body"])
      open(fitxer, "w", encoding="utf-8").write(cap + cos_html + cos)
      print(l, "ok", len(d["apps"]), "apps,", len(d["faq"]), "preguntes")
    await b.close()
asyncio.run(main())
