(function () {
    var _iframe = document.createElement('iframe');
    var _div = document.createElement('div');
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    var _companyUid = '0dfda80d0473293f6371c7147fac9e2597f9bdb5';

    _div.setAttribute('id', 'ad_area_media');
    _div.style.textAlign = 'center';
    _div.style.backgroundColor = '#fff';
    _div.style.marginBottom = '10px';

    _parent.insertBefore(_div, _currentScript);

    _iframe.src = 'https://ad.3dpop.kr/web_ad/?company_uid=' + _companyUid + '&position=center&isCloseBtn=N';
    _iframe.setAttribute('width', '320');
    _iframe.setAttribute('height', '100');
    _iframe.setAttribute('scrolling', 'no');
    _iframe.setAttribute('topmargin', 0);
    _iframe.setAttribute('leftmargin', 0);
    _iframe.setAttribute('marginwidth', 0);
    _iframe.setAttribute('marginheight', 0);
    _iframe.setAttribute('frameborder', 0);
    _div.appendChild(_iframe);
})()
