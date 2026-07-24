(function () {
    var _width = 300;
    var _height = 250;
    var _iframe = document.createElement('iframe');
    _iframe.src = '//ap.smartigy.biz/adReq/?k=Mzkx&pb=&di=';
    _iframe.setAttribute('width', _width);
    _iframe.setAttribute('height', _height);
    _iframe.setAttribute('frameborder', 0);
    _iframe.setAttribute('scrolling', 'no');
    _iframe.setAttribute('name', 'smartigyframe');

    var _adArea = document.getElementById('ad_innerView');
    if (!_adArea) return;
    
    _adArea.style.width = _width + 'px';
    _adArea.appendChild(_iframe);
})();