(function() {
    try{        
        var _adWidth = 320;
        var _adHeight = 200;
        var _adArea = document.getElementById('top_main_banner');
        var _companyUid = 'daf028e628fa3ca09a6a783e0f8301ab67747625';
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

        var _parent = parent.document.querySelector('#top_main_banner');
        if (_parent) {
            _parent.style.height = '200px';
        }

        var _adMid = parent.frameElement;
        if (_adMid && _adMid.name === 'ad_mid') {
            _adMid.style.height = '200px';
            _adMid.setAttribute('height', '200');
        }
    }catch(err){console.warn(err)}  
})();