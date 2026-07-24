(function() {
    var _adWidth = 300;
    var _adHeight = 250;
    var _ifrMainBanner = document.getElementById('ifr_main_banner');
    if(_ifrMainBanner) {
      var _parent = parent.parent.document.querySelector('#ifr_ad_shopbox');
      if( _parent ) {
        _parent.style.width = _adWidth + 'px';
        _parent.style.height = _adHeight + 'px';
        _parent.style.marginBottom = '10px';
      }
      
      var _iframe = document.createElement('iframe');
      _iframe.setAttribute('width', _adWidth);
      _iframe.setAttribute('height', _adHeight);
      _iframe.setAttribute('src', '//ad.doorigo.co.kr/cgi-bin/PelicanC.dll?impr?pageid=0GS7&out=iframe');
      _iframe.setAttribute('allowTransparency', 'true');
      _iframe.setAttribute('marginwidth', '0');
      _iframe.setAttribute('marginheight', '0');
      _iframe.setAttribute('hspace', '0');
      _iframe.setAttribute('vspace', '0');
      _iframe.setAttribute('frameborder', '0');
      _iframe.setAttribute('scrolling', 'no');
      _iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups')
      _iframe.style.width = _adWidth + 'px';
      _iframe.style.height = _adHeight + 'px';
      _ifrMainBanner.appendChild(_iframe);
      _ifrMainBanner.style.textAlign = 'center';
    }
  })();