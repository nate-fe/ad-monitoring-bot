(function () {
    var _adClient = 'ca-pub-8710503230568572'; // ad-client
    var _adSlot = '4907703165'; //ad-slot
    var _adLayoutKey = '+2t+rl+2h-1m-4u';
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    var _adArea = document.createElement('div');
    _adArea.classList.add('app-feed-ad-area');
    _adArea.style.width = '100%';
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

    // .feed-item.ad 를 시각적으로만 접어둠 (display:none 금지 → 너비 0 되면 fluid 광고 렌더 실패)
    // 너비는 유지하고 높이만 접어야 availableWidth 가 살아있음
    var _feedItem = _ins.closest('.feed-item.ad');
    if (_feedItem) {
        _feedItem.style.overflow = 'hidden';
        _feedItem.style.height = '0px';
        _feedItem.style.minHeight = '0px';
    }

    // data-ad-status 변화를 감시 → unfilled면 접힌 상태 유지 / filled면 노출
    var _observer = new MutationObserver(function () {
        var _status = _ins.getAttribute('data-ad-status');
        if (!_status) return; // 아직 값 없음
        if (_status === 'unfilled') {
            var _adloader = _ins.closest('.adloader');
            if (_adloader) {
                _adloader.style.height = '0px';
                _adloader.style.minHeight = '0px';
                _adloader.style.display = 'none';
            }
            // unfilled 이면 .feed-item.ad 는 접힌 상태(height:1px, margin-bottom:0) 유지
        } else {
            // filled 등 그 외 상태면 원복하여 노출
            if (_feedItem) {
                _feedItem.style.overflow = '';
                _feedItem.style.height = '';
                _feedItem.style.minHeight = '';
                _feedItem.style.marginBottom = '8px';
            }
        }
        _observer.disconnect(); // filled/unfilled 확정되면 감시 종료
    });
    _observer.observe(_ins, {
        attributes: true,
        attributeFilter: ['data-ad-status']
    });

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