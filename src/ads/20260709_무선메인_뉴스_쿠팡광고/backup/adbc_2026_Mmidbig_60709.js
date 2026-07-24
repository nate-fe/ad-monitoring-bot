(function () {
    try {
        var _iframe = document.createElement('iframe');
        var _adArea = document.getElementById('top_main_banner');
        _iframe.src = '//vbcc.io/unit/?x=Nw==';
        _iframe.width = '320px';
        _iframe.height = '200px';
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('referrerpolicy', 'unsafe-url');
        _iframe.style.border = 'none';
        _adArea.style.margin = '0';
        _adArea.style.textAlign = 'center';
        _adArea.appendChild(_iframe);

        var _parent = parent.document.querySelector('#top_main_banner');
        if (_parent) {
            _parent.style.height = '200px';
        }

    } catch (err) { console.warn(err) }
})();