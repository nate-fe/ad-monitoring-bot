(function () {
    try {
      var _adWidth = 320;
      var _adHeight = 100;
  
      var _script = document.currentScript;
      var _adArea = _script && _script.parentNode;
      if (!_adArea || _adArea === document.head) return;
  
      var _box = document.createElement('div');
      _box.style.textAlign = 'center';
      _adArea.appendChild(_box);
  
      var _iframe = document.createElement('iframe');
      _iframe.src = '//ad.aceplanet.co.kr/cgi-bin/PelicanC.dll?impr?pageid=07n6&out=iframe';
      _iframe.width = _adWidth;
      _iframe.height = _adHeight;
      _iframe.setAttribute('frameborder', '0');
      _iframe.setAttribute('scrolling', 'no');
      _iframe.setAttribute('allowtransparency', 'true');
      _iframe.setAttribute('marginwidth', '0');
      _iframe.setAttribute('marginheight', '0');
      _iframe.setAttribute('hspace', '0');
      _iframe.setAttribute('vspace', '0');
      _iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups allow-modals allow-top-navigation-by-user-activation');
      _iframe.style.cssText = 'border:0;vertical-align:top;max-width:100%';
      _iframe.style.width = _adWidth + 'px';
      _iframe.style.height = _adHeight + 'px';

      // 광고 렌더링 결과 감지 (No Ad 체크)
      // iframe이 다른 도메인이라 slotRenderEnded를 직접 못 받으므로, 업체 페이지가 보내는 postMessage로 받는다
      // 업체 자체광고는 iframe 안의 iframe에서 뜨므로, 우리 iframe의 하위 프레임에서 온 메시지까지 받는다
      function isFromAdFrame(source) {
        try {
          for (var w = source; w && w !== window; w = w.parent) {
            if (w === _iframe.contentWindow) return true;
            if (w === w.parent) break;
          }
        } catch (e) {}
        return false;
      }

      var _isPassedBack = false;
      window.addEventListener('message', function (event) {
        if (_isPassedBack) return;
        if (!isFromAdFrame(event.source)) return;
        if (!event.data || event.data.type !== 'nate-ad-noad') return;

        _isPassedBack = true;
        _box.style.display = 'none';
        var replaceScript = document.createElement('script');
        replaceScript.src = '//cyad1.nate.com/js.kti/mnate/nextback@house_x01';
        _adArea.appendChild(replaceScript);
      });

      _box.appendChild(_iframe);
    } catch (e) {
      console.warn('[AD]', e);
    }
  })();
  