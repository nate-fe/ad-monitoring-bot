(function () {
    var _width = 300;
    var _height = 250;
    var _iframe = document.createElement('iframe');
    _iframe.src = '//ad.planbplus.co.kr/adSb/?k=MzY2NQ==&pb=&di=&kwd=';
    _iframe.setAttribute('width', _width);
    _iframe.setAttribute('height', _height);
    _iframe.setAttribute('frameborder', '0');
    _iframe.setAttribute('scrolling', 'no');
    _iframe.setAttribute('name', 'cozymangframe');

    var _div = document.createElement('div');
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    _div.setAttribute('id', 'ad_area_bt_position3');
    _div.style.textAlign = 'center';

    _div.appendChild(_iframe);
    _parent.insertBefore(_div, _currentScript);

})();