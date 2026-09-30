try {
    parent.document.getElementById('ad_big').style.width = '100%';
    parent.document.getElementById('ad_big').style.height = '100px';
    parent.document.getElementById('ad_big').style.margin = '0 auto';
  } catch(e) {
	window.onload = function() {
	  var isNews = location.href.indexOf('news') > -1;
	  var isPann = location.href.indexOf('pann') > -1;
	  if(isNews) {
		window.parent.postMessage({
		  "method": "fnct",
		  "name": "callCrossOriginAd",
		  "property": {target: window.name, width: 320, height: 100}
		}, '*');
	  }
	  if(isPann) {
		window.parent.postMessage({
		  target: 'ad_big',
		  params: {
			height: 100
		  }
		}, '*');
	  }
	}
  }
  
  var PASSBACK_URL = location.protocol + '//cyad1.nate.com/js.kti/mnate/wider@nlist_Top3';
  WiderPlanetAdRendererVar = {
	  type: "script",
	  passback: PASSBACK_URL,
	  category: "PAGE_CATEGORY",
	  width: "320",
	  height: "100",
	  zoneid: "29410"
  };
  document.write('<script src="//cdn-aitg.widerplanet.com/js/adr.js" type="text/javascript"><\/script>');