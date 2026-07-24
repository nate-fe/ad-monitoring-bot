(function () {
    var _adClient = 'ca-pub-8710503230568572'; // ad-client
    var _adSlot = '7196949458'; //ad-slot
    var _adWidth = 300;
    var _adHeight = 250;
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    var _adArea = document.createElement('div');

    _adArea.classList.add('cbc_ad_area');
    _adArea.style.textAlign = 'center';

    var _cssOfcbc = document.createElement('style');
    _cssOfcbc.innerHTML = `
        .cbc_ad_area  {
            display: none;
        }
        /* 광고가 로드되면 표시 */
        .cbc_ad_area ins[data-ad-status="filled"] {
            display: block;
        }
    `
    document.head.appendChild(_cssOfcbc);
    var _script = document.createElement('script');
    _script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + _adClient;
    _script.async = true;
    _script.crossorigin = 'anonymous';
    _script.onload = function () {
        (adsbygoogle = window.adsbygoogle || []).push({});
    }

    var _ins = document.createElement('ins');
    _ins.className = 'adsbygoogle';
    _ins.style.display = 'inline-block';
    _ins.style.width = _adWidth + 'px';
    _ins.style.height = _adHeight + 'px';
    _ins.setAttribute('data-ad-client', _adClient);
    _ins.setAttribute('data-ad-slot', _adSlot);
    
    _adArea.appendChild(_ins);
    _adArea.appendChild(_script);
    _parent.insertBefore(_adArea, _currentScript);

    if (self !== top) {
        var _parentIframe = window.frameElement;
        if (_parentIframe) {
            _parentIframe.height = _adHeight;
            _parentIframe.style.height = _adHeight + 'px';
        }  
    } 
})();