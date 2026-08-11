(function() {
    try {
        var isGptExist = document.querySelector('script[src*="gpt.js"]');
        var _head = document.getElementsByTagName('head')[0];
        var _adWidth = 320;
        var _adHeight = 100;
        var _script = null;
        var _currentScript = document.currentScript;
        var _adArea = _currentScript.closest('div');
        var _customStyle = document.createElement('style');
        var topAdSlot = null;
        var _topBannerArea = null;

        _customStyle.innerHTML = ` 
            .top-banner-area {width:100%; border-bottom:1px solid #ededed;}
            #topBanner {width:${_adWidth}px; height: ${_adHeight}px; margin:0 auto;}
            @media (prefers-color-scheme: dark) {
                .top-banner-area {border-bottom:1px solid #393939;}
            }
        `;

        if (!isGptExist && !window.googletag) {
            _script = document.createElement('script');
            _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
            _script.setAttribute('crossorigin', 'anonymous');
            _script.setAttribute('async', true);
            _head.appendChild(_script);
        }

        function loadTopAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                var _topBanner = document.createElement('div');
                _topBanner.setAttribute('id', 'topBanner');
                _topBannerArea = document.createElement('div');
                _topBannerArea.setAttribute('class', 'top-banner-area');

                var _div = document.getElementById('gpt-passback');
                if (!_div) {
                    _div = document.createElement('div');
                    _div.setAttribute('id', 'gpt-passback');
                    _topBanner.appendChild(_div);
                    _topBannerArea.appendChild(_topBanner);
                    _adArea.appendChild(_topBannerArea);
                    _head.appendChild(_customStyle);
                }

                topAdSlot =  googletag.defineSlot('/21682743634,22664242840/nate/nate_mo_newslist_banner_320x100', [_adWidth, _adHeight], 'gpt-passback').addService(googletag.pubads()); 

                // 광고 렌더링 결과 감지 (No Ad 체크)
                googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                    if (event.slot !== topAdSlot) return;

                    if (event.isEmpty) {
                        // 광고가 없을 때 처리
                        if (_topBannerArea) {
                            _topBannerArea.style.display = 'none';
                        }
                        var replaceScript = document.createElement('script');
                        replaceScript.src = '//cyad1.nate.com/js.kti/mnate/nextback@house_x01';
                        _adArea.appendChild(replaceScript);
                    } 
                });

                googletag.enableServices();
                googletag.display('gpt-passback');
            });
        }

        function initAdLogic() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                googletag.enableServices();
            });

            loadTopAd();
        }

        if (_script) {
            _script.onload = _script.onreadystatechange = function() {
                if (this.readyState && this.readyState !== "loaded" && this.readyState !== "complete") return;
                initAdLogic();
            };
        } else {
            initAdLogic();
        }

    } catch (e) {
        if (window.console) console.log(e);
    }
})();