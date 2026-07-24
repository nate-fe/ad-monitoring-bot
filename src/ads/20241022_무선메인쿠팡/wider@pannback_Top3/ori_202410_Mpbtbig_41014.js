(function () {
    try {
      var pass_url = !!ad_type && ad_type === 'app' ? 'appmain@nb_Top3?exception_ads=231385' : 'main@nb_Top3?exception_ads=231385';
      var ad_container = document.querySelectorAll('#ad_big');
      ad_container.forEach(v => {
        var ad_script = document.createElement('script');
        ad_script.src = '//api.dnxad.com/coupang/coupang_script_v1.php?subId=natefoursub1&layerId=ad_big';
        ad_script.onerror = function() {
          var replace_script = document.createElement('script');
          replace_script.src = '//cyad1.nate.com/js.kti/mnate/' + pass_url;
          v.appendChild(replace_script);
          throw new Error('network ad error');
        }
        ad_script.onload = function() {
          v.style.maxHeight = '150px';
          v.querySelector('iframe').style.maxHeight = '150px'
        }
        v.appendChild(ad_script);
      });
    }catch(err){console.warn(err);}
})();




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
        var _adBig = document.querySelector('#ad_big');
        var _script = document.createElement('script');
        _script.src = '//api.dnxad.com/coupang/coupang_script_v1.php?subId=natefoursub1&layerId=ad_big';
        _body.appendChild(_script);
        _script.onload = function() {
          var _iframe = _adBig.querySelector('iframe');
          _iframe.style.width = '100%';
          _iframe.style.height = '200px';
        }
    }catch (e) {}
})();


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
        var _listBanner = document.getElementById('list_banner');
        var _script = document.createElement('script');
        _script.src = '//api.dnxad.com/coupang/coupang_script_v1.php?subId=natefoursub1&layerId=list_banner';
        _body.appendChild(_script);
        _script.onload = function(){
          var _iframe = _listBanner.querySelector('iframe');
          _iframe.style.height = '200px';
        }
    }catch (e) {}
})();