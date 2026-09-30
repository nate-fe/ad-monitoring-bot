(function () {
    var DISP_ID = 'NDc5OQ==';
    var MAX_H = 816;
    var _adArea = document.getElementById('shopitemMall');
    var _div = document.createElement('div');
    var _lib = document.createElement('script');
    _div.setAttribute('id', 'cozy_shopbox_'+DISP_ID);
    _div.setAttribute('data-disp_id', DISP_ID);
    
    _lib.src = '//quickcast.co.kr/adSbox/sbox.js?k='+DISP_ID;
    _lib.type = 'text/javascript';
    _lib.setAttribute('charset', 'utf-8');
    _lib.async = 'true';
    _div.appendChild(_lib);
    _adArea.prepend(_div);
    
    _lib.onload = function () {
        _div.prepend(_lib);
        setTimeout(checkIframeExists, 1500);
        fixHeight();
    }
    /* Error */
    function checkIframeExists() {
        var _iframeExists = _adArea.querySelector('iframe') !== null;
        if (!_iframeExists) {
            errorFn();
        }
    }
    function errorFn() {
        var _scriptInError = document.createElement('script');
        _scriptInError.src = 'https://cyad1.nate.com/js.kti/nate/mob@shouse_x01';
        _div.prepend(_scriptInError)
    }
    /* _lib Error */
    _lib.onerror = function () {
        errorFn();
    }
    /* 느린 네트워크에서 iframe 높이 0 보정 */
    function fixHeight() {
        var n = 0;
        var t = setInterval(function () {
            var f = _div.querySelector('iframe');
            var d = f && f.contentDocument;
            if (d && d.body && d.body.childNodes.length) {
            clearInterval(t);
            var fit = function () {
                var h = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
                if (h > 1) { f.style.height = Math.min(h, MAX_H) + 'px'; }
            };
                fit();
                                  
                if (window.ResizeObserver) { new ResizeObserver(fit).observe(d.body); }
            } else if (++n > 150) { clearInterval(t); }
        }, 200);
    }
})()