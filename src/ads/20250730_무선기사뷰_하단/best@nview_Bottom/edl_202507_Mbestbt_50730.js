(function () {
    try {
        var _iframe = document.createElement('iframe');
        var _adArea = document.getElementById('main_banner');
        _iframe.src = '//ads-partners.coupang.com/widgets.html?id=755773&trackingCode=AF0700373&subId=natem320x200&width=320&height=200&template=trending-keyword';
        _iframe.width = '320px';
        _iframe.height = '200px';
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('referrerpolicy', 'unsafe-url');
        _adArea.style.margin = '0';
        _adArea.style.textAlign = 'center';
        _adArea.appendChild(_iframe);

        var _parent = parent.document.querySelector('#ad_big2');
        if (_parent) {
            _parent.style.height = '200px';
        }

    } catch (err) { console.warn(err) }
})();