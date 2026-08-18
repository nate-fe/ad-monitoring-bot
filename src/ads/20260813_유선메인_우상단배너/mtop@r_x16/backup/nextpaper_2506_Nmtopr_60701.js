(function() {
    try {
        var isGptExist = document.querySelector('script[src*="gpt.js"]');
        var _head = document.getElementsByTagName('head')[0];
        var _adWidth = 320;
        var _adHeight = 100;
        var _script = null;
        var _currentScript = document.currentScript;
        var _adArea = _currentScript.closest('div');

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

                var _div = document.getElementById('gpt-passback1');
                if (!_div) {
                    _div = document.createElement('div');
                    _div.setAttribute('id', 'gpt-passback1');
                    _topBanner.style.width = _adWidth + 'px';
                    _topBanner.style.height = _adHeight + 'px';
                    _topBanner.style.overflow = 'hidden';
                    _topBanner.style.margin = '0 auto';
                    _topBanner.appendChild(_div);
                    _adArea.appendChild(_topBanner);
                }

                topAdSlot =  googletag.defineSlot('/21682743634,22664242840/nate/nate_pc_main_banner_top_320x100', [[320, 100],[320, 50]], 'gpt-passback1').addService(googletag.pubads()); 
                googletag.enableServices();
                googletag.display('gpt-passback1');
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