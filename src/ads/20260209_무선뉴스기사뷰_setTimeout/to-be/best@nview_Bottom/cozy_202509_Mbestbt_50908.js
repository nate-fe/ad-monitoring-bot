(function () {
    var mainBanner = document.getElementById('main_banner');
    var _iframe = document.createElement('iframe');
    var _adWidth = 300;
    var _adHeight = 250;

    _iframe.src = '//ad.planbplus.co.kr/adSb/?k=MzY2NQ==&pb=&di=&kwd=';
    _iframe.setAttribute('width', _adWidth);
    _iframe.setAttribute('height', _adHeight);
    _iframe.setAttribute('frameborder', '0');
    _iframe.setAttribute('scrolling', '0');
    _iframe.setAttribute('name', 'cozymagframe');
    // 0.3초 후 광고 부착
    setTimeout(function(){
        mainBanner.appendChild(_iframe);
    }, 300);

    var _parent = parent.document.querySelector('#ad_big2');
    if (_parent) {
        var _parentIfr = parent.document.querySelector('#ad_big2');
        if (_parentIfr) {
            _parentIfr.style.height = _adHeight + 'px';
            _parentIfr.frameBorder = 0;
        }
    }
})();