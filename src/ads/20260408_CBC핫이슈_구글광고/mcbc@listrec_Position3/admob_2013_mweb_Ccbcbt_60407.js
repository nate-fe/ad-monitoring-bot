(function () {
    var _adClient = 'ca-pub-8710503230568572'; // ad-client
    var _adSlot = '8394481058'; //ad-slot
    var _adWidth = 300;
    var _adHeight = 250;
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    var _adArea = document.createElement('div');

    _adArea.classList.add('cbc_ad_area');
    _adArea.style.textAlign = 'center';

    var _cssOfcbc = document.createElement('style');
    _cssOfcbc.innerHTML = `
        /* hr 태그 초기에는 숨김 처리 */
        .cbc_ad_area, .cbc_ad_area + hr.componentDivision {
            display: none;
        }
        /* 광고가 로드되어 'show-hr' 클래스가 붙으면 표시 */
        .cbc_ad_area.show-hr, .cbc_ad_area.show-hr + hr.componentDivision {
            display: block;
        }
        .cbc_ad_area ins.adsbygoogle[data-ad-status="unfilled"] {
            display:none !important;
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

    var _hr = document.createElement('hr');
    _hr.classList.add('componentDivision');
    
    _adArea.appendChild(_ins);
    _adArea.appendChild(_script);
    _parent.insertBefore(_hr, _currentScript);
    _parent.insertBefore(_adArea, _hr);

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // data-ad-status 속성이 변경되었는지 확인
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-ad-status') {
                var status = _ins.getAttribute('data-ad-status');
                if (status === 'filled') {
                    _adArea.classList.add('show-hr'); // 광고가 있으면 hr 노출
                } else {
                    _adArea.classList.remove('show-hr'); // 광고가 없으면 hr 숨김
                }
            }
        });
    });

    // _div 내부의 자식 요소 변화를 감시
    observer.observe(_ins, { attributes: true, attributeFilter: ['data-ad-status'] });

    if (self !== top) {
        var _parentIframe = window.frameElement;
        if (_parentIframe) {
            _parentIframe.height = _adHeight;
            _parentIframe.style.height = _adHeight + 'px';
        }  
    } 
})();