(function() {
    var _adWidth = 300;
    var _adHeight = 250;
    var $main_banner = document.getElementById('main_banner');
    if($main_banner) {
      var _iframe = document.createElement('iframe');
      _iframe.setAttribute('width', _adWidth);
      _iframe.setAttribute('height', _adHeight);
      _iframe.setAttribute('src', '//ad.doorigo.co.kr/cgi-bin/PelicanC.dll?impr?pageid=0FlK&out=iframe');
      _iframe.setAttribute('allowTransparency', 'true');
      _iframe.setAttribute('marginwidth', '0');
      _iframe.setAttribute('marginheight', '0');
      _iframe.setAttribute('hspace', '0');
      _iframe.setAttribute('vspace', '0');
      _iframe.setAttribute('frameborder', '0');
      _iframe.setAttribute('scrolling', 'no');
      _iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups');
      _iframe.style.width = _adWidth + 'px';
      _iframe.style.height = _adHeight + 'px';
      $main_banner.appendChild(_iframe);

      // ad_big에 높이 지정
      var _parentWindowName = 'ad_big';
      try {
        var _parentOfIframe = window.parent.document.getElementById(_parentWindowName);
        if (_parentOfIframe) {
          _parentOfIframe.style.height = _adHeight + 'px';
        }
      } catch(err) {
        var _url = location.href;
        var _parentWindow = window.parent;
        if (url.includes('news')) {
            parentWindow.postMessage({
                method: "fnct",
                name: "callCrossOriginAd",
                property: { target: window.name, height: _adHeight }
            }, '*');
        } else if (url.includes('pann')) {
            parentWindow.postMessage({
                target: _parentWindowName,
                params: { height: _adHeight }
            }, '*');
        }
      }
    }
  })();