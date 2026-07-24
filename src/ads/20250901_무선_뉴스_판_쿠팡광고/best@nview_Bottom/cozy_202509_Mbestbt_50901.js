(function () {
    var mainBanner = document.getElementById('main_banner');
    var _iframe = document.createElement('iframe');
    var _adWidth = 300;
    var _adHeight = 250;

    _iframe.src = '//ad.planbplus.co.kr/adSb/?k=MzY1MA==&pb=&di=&kwd=';
    _iframe.setAttribute('width', _adWidth);
    _iframe.setAttribute('height', _adHeight);
    _iframe.setAttribute('frameborder', '0');
    _iframe.setAttribute('scrolling', '0');
    _iframe.setAttribute('name', 'cozymagframe');
    mainBanner.appendChild(_iframe);

    var _parent = parent.document.querySelector('#ad_big2');
    if (_parent) {
        var _parentIfr = parent.document.querySelector('#ad_big2');
        if (_parentIfr) {
            _parentIfr.style.height = _adHeight + 'px';
            _parentIfr.frameBorder = 0;
        }
    }
})();