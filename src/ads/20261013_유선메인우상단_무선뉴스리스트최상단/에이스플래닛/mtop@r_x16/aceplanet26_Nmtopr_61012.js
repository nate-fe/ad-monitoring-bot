(function () {
    try {
      var _adWidth = 320;
      var _adHeight = 100;
  
      var _script = document.currentScript;
      var _adArea = _script && _script.parentNode;
      if (!_adArea || _adArea === document.head) return;
  
      var _box = document.createElement('div');
      _box.style.textAlign = 'center';
  
      var _iframe = document.createElement('iframe');
      _iframe.src = '//ad.aceplanet.co.kr/cgi-bin/PelicanC.dll?impr?pageid=07n5&out=iframe';
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
      _box.appendChild(_iframe);
      _adArea.appendChild(_box);
    } catch (e) {
      console.warn('[AD]', e);
    }
  })();
  