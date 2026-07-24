(function () {
    var _adClient = 'ca-pub-8710503230568572'; // ad-client
    var _adSlot = '7134411254'; //ad-slot
    var _adLayoutKey = '+2t+rl+2h-1m-4u';
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    var _adArea = document.createElement('div');
    _adArea.classList.add('app-feed-ad-area');
    _adArea.style.textAlign = 'center';

    var _ins = document.createElement('ins');
    _ins.className = 'adsbygoogle';
    _ins.style.display = 'block';
    _ins.setAttribute('data-ad-format', 'fluid');
    _ins.setAttribute('data-ad-layout-key', _adLayoutKey);
    _ins.setAttribute('data-ad-client', _adClient);
    _ins.setAttribute('data-ad-slot', _adSlot);

    _adArea.appendChild(_ins);
    _parent.insertBefore(_adArea, _currentScript); // ← ins 먼저 DOM에 삽입

    // adsbygoogle.js는 한 번만 로드
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
        var _script = document.createElement('script');
        _script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + _adClient;
        _script.setAttribute('crossorigin', 'anonymous');
        _script.async = true;
        document.getElementsByTagName('head')[0].appendChild(_script);
    }

    // 항상 push - adsbygoogle.js 로드 전이어도 큐에 쌓였다가 일괄 처리됨
    (window.adsbygoogle = window.adsbygoogle || []).push({});
})();