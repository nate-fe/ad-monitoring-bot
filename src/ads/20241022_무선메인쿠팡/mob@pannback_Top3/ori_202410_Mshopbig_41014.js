(function(){
    try {
      parent.document.getElementById('ad_big').height = 200;
      parent.document.getElementById('ad_big').style.height = '200px';
    } catch(e) {
      window.onload = function() {
        var isNews = location.href.indexOf('news') > -1;
        var isPann = location.href.indexOf('pann') > -1;
        if(isNews) {
          window.parent.postMessage({
            "method": "fnct",
            "name": "callCrossOriginAd",
            "property": {target: window.name, height: 200}
          }, '*');
        }
        if(isPann) {
          window.parent.postMessage({
            target: 'ad_big',
            params: {
              height: 200
            }
          }, '*');
        }
      }
    }
  
    try {
        var _body = document.querySelector('body');
        var _mainBanner = document.querySelector('#main_banner');
        var _script = document.createElement('script');
        _script.src = '//api.dnxad.com/coupang/coupang_script_v1.php?subId=natefoursub2&layerId=main_banner';
        _body.appendChild(_script);
        _script.onload = function() {
          var _iframe = _mainBanner.querySelector('iframe');
          _iframe.style.width = '100%';
          _iframe.style.height = '200px';
        }
    }catch (e) {}
  })();