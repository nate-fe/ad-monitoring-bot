(function () {
    var _banner = document.querySelector('.ad_box_text');
    var _iframe = document.createElement('iframe');
    var _adWidth = 300;
    var _adHeight = 250;
    _iframe.src = '//ad.planbplus.co.kr/adSb/?k=MzY1MA==&pb=&di=&kwd=';
    _iframe.setAttribute('width', _adWidth);
    _iframe.setAttribute('height', _adHeight);
    _iframe.setAttribute('frameborder', '0');
    _iframe.setAttribute('scrolling', '0');
    _iframe.setAttribute('name', 'cozymagframe');
    _banner.appendChild(_iframe);
})();