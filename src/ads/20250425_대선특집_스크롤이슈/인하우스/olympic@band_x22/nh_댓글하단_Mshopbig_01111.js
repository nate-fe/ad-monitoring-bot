try {
	document.domain = 'nate.com';
}catch(e){}
try {
	var ad_big = parent.document.querySelectorAll('#ad_big');
	for (var i=0; i<ad_big.length; i++) {
		ad_big[i].style.width="320px";
		ad_big[i].style.height="100px";
	}
}catch (e) {}
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