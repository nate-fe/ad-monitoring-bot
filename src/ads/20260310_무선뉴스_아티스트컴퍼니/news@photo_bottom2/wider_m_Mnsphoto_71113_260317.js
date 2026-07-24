(function() {
  WiderPlanetAdRendererVar = {
    type: "script",
    passback: "PASSBACK_URL",
    category: "PAGE_CATEGORY",
    width: "100%",
    height: "150",
    zoneid: "24158",
    adElementId: 'wp_adr_area'
  };

  const adId = WiderPlanetAdRendererVar.adElementId;

  if (!document.getElementById(adId)) {
    const _div = document.createElement('div');
    _div.id = adId;
    document.body.appendChild(_div);
  }

  const _script = document.createElement('script');
  _script.src = '//cdn-aitg.widerplanet.com/js/adr.js';
  _script.type = 'text/javascript';
  _script.async = true; 
  
  _script.onerror = function() {
    console.error("WiderPlanet script failed to load.");
  };

  document.head.appendChild(_script);
})();