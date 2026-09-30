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
        var _adWidth = 320;
        var _adHeight = 200;
        var _adArea = document.querySelector('#main_banner');
        var _companyUid = 'ef6f3d1ba380b39957b6f95ba68f113ee4988795';
        var _iframe = document.createElement('iframe');
        _iframe.src = 'https://ad.3dpop.kr/web_ad/?company_uid=' + _companyUid + '&position=center&isCloseBtn=N';
        _iframe.width = _adWidth;
        _iframe.height = _adHeight;
        _iframe.style.width = _adWidth + 'px';
        _iframe.style.height = _adHeight + 'px';
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('topmargin', '0');
        _iframe.setAttribute('leftmargin', '0');
        _iframe.setAttribute('marginwidth', '0');
        _iframe.setAttribute('marginheight', '0');
        _iframe.setAttribute('frameborder', '0');
        _adArea.appendChild(_iframe);
    }catch (e) {}
  })();