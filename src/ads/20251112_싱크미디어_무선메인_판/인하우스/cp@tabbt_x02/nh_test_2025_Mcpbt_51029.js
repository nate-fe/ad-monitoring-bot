(function () {
    var _iframe = document.createElement('iframe');
    var _div = document.createElement('div');
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    var _companyUid = 'e8f12999b2db1ccc5f61df55964f321ec4370d24';

    _div.setAttribute('id', 'ad_area_media');
    _div.style.textAlign = 'center';

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
    _iframe.setAttribute('id', 'ad_area_media_iframe');

    _div.appendChild(_iframe);

    // 광고가 없을 때
    window.addEventListener('message', function (event) {
        if (event.data === 'no_ad') {
            var _adAreaMediaIframe = document.getElementById('ad_area_media_iframe');
            if (_adAreaMediaIframe && event.source === _adAreaMediaIframe.contentWindow) {
                _adAreaMediaIframe.style.height = '0px';
                _adAreaMediaIframe.style.minHeight = '0';
                _adAreaMediaIframe.style.margin = '0';
                _adAreaMediaIframe.style.padding = '0';
                _parent.style.display = 'none';
            }
        } else return;
    });
})()
