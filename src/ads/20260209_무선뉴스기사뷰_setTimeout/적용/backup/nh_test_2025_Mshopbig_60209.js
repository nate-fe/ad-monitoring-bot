(function () {
  try {
    parent.document.getElementById('ad_big').height = 252;
    parent.document.getElementById('ad_big').style.height = '252px';
  } catch(e) {
    window.onload = function() {
      window.parent.postMessage({
        "method": "fnct",
        "name": "callCrossOriginAd",
        "property": {target: window.name, height: 250}
      }, '*');
    }
    console.log(window.name)
  }
  document.write('<script src="//ad.doorigo.co.kr/cgi-bin/PelicanC.dll?impr?pageid=0FlK&out=script"></script>');
})();
