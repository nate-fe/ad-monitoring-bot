(function() {
    try{
        var _adWidth = 300;
        var _adHeight = 250;
        var _mainBanner = document.getElementById('main_banner');
        var _companyUid = 'd4a8c1a6c23bbf85719ea77c82cdf57eb92702ec';
        var _iframe = document.createElement('iframe');
        if (_mainBanner) {
            _iframe.src = 'https://ad.3dpop.kr/web_ad/?company_uid=' + _companyUid + '&position=center&isCloseBtn=N';
            _iframe.width = _adWidth;
            _iframe.height = _adHeight;
            _iframe.setAttribute('frameborder', 0);
            _iframe.setAttribute('scrolling', 'no');
            _iframe.setAttribute('topmargin', '0');
            _iframe.setAttribute('leftmargin', '0');
            _iframe.setAttribute('marginwidth', '0');
            _iframe.setAttribute('marginheight', '0');
            _iframe.setAttribute('frameborder', '0');
            _mainBanner.appendChild(_iframe);
        }
        var _parent = parent.document.querySelector('#ad_big2');
        if( _parent ) {
            _parent.style.height = _adHeight + 'px';
        }
    }catch(err){console.warn(err)}  
  })();