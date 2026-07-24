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
        
        _customStyle.innerHTML = ` 
            .top-banner-area {width:100%; border-bottom:1px solid #ededed;}
            #topBanner {width:${_adWidth}px; height: ${_adHeight}px; margin:-1px auto 0;}
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

        var topAdSlot = null;
        var lastHref = location.href;

        function loadTopAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {

                var _topBanner = document.createElement('div');
                _topBanner.setAttribute('id', 'topBanner');
                var _topBannerArea = document.createElement('div');
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
                googletag.enableServices();
                googletag.display('gpt-passback');
            });
        }

        function initAdLogic() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                googletag.pubads().enableSingleRequest();
                googletag.pubads().set('page_url', '//nate.com');
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