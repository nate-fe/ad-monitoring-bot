(function() {
    try {
        var isGptExist = document.querySelector('script[src*="gpt.js"]');
        var _head = document.getElementsByTagName('head')[0];
        var _script = null;

        if (!isGptExist && !window.googletag) {
            _script = document.createElement('script');
            _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
            _script.setAttribute('crossorigin', 'anonymous');
            _script.setAttribute('async', true);
            _head.appendChild(_script);
        }

        var topAdSlot = null;
        var lastHref = location.href;
        var lastClasses = "";

        function each(collection, callback) {
            for (var i = 0; i < collection.length; i++) { callback(collection[i]); }
        }

        function hasClass(element, className) {
            if (!element) return false;
            if (element.classList) return element.classList.contains(className);
            return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
        }

        // 광고 높이 > 0이면 #Header에 top-banner-on 추가 + #Wrapper height +40px
        // 광고 높이 = 0이면 #Header에 top-banner-on 제거 + #Wrapper height -40px
        function setHeaderBannerClass(isActive) {
            var _header = document.getElementById('Header');
            var _wrapper = document.getElementById('Wrapper');
            if (!_header) return;

            if (isActive) {
                if (!hasClass(_header, 'top-banner-on')) {
                    _header.classList.add('top-banner-on');
                    if (_wrapper) {
                        _wrapper.style.height = (_wrapper.offsetHeight + 40) + 'px';
                    }
                }
            } else {
                if (hasClass(_header, 'top-banner-on')) {
                    _header.classList.remove('top-banner-on');
                    if (_wrapper) {
                        _wrapper.style.height = (_wrapper.offsetHeight - 40) + 'px';
                    }
                }
            }
        }

        function loadTopAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                var _topAd = document.getElementById('topAd');
                if (!_topAd) return;

                var existingTopBanner = document.getElementById('topBanner');
                if (existingTopBanner && existingTopBanner.parentNode) {
                    existingTopBanner.parentNode.removeChild(existingTopBanner);
                }

                var _topBanner = document.createElement('div');
                _topBanner.setAttribute('id', 'topBanner');

                var _div = document.getElementById('gpt-passback');
                if (!_div) {
                    _div = document.createElement('div');
                    _div.setAttribute('id', 'gpt-passback');
                    _topBanner.style.width = '728px';
                    _topBanner.style.height = '90px';
                    _topBanner.style.margin = '0 auto';
                    _topBanner.appendChild(_div);
                    _topAd.appendChild(_topBanner);
                }

                if (topAdSlot) googletag.destroySlots([topAdSlot]);

                topAdSlot = googletag.defineSlot('/21682743634,22664242840/nate/nate_pc_mail_banner_728x90', [728, 90], 'gpt-passback').addService(googletag.pubads());
                googletag.display('gpt-passback');
            });
        }

        function destroyTopAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                if (topAdSlot) {
                    googletag.destroySlots([topAdSlot]);
                    topAdSlot = null;
                }
                var _div = document.getElementById('gpt-passback');
                if (_div && _div.parentNode) {
                    _div.parentNode.removeChild(_div);
                }

                // 광고 제거 시 클래스 및 height도 함께 초기화
                setHeaderBannerClass(false);
            });
        }

        function initAdLogic() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                googletag.pubads().enableSingleRequest();
                googletag.pubads().set('page_url', '//nate.com');
                googletag.enableServices();

                // 광고 렌더링 완료 시 gpt-passback의 실제 높이값으로 클래스 제어
                googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                    if (event.slot === topAdSlot) {
                        var _passback = document.getElementById('gpt-passback');
                        var isActive = !!_passback && _passback.offsetHeight > 0;
                        setHeaderBannerClass(isActive);
                    }
                });
            });

            if (location.href.indexOf('write') === -1) {
                loadTopAd();
            }

            // AngularJS SPA 대응을 위한 400ms 주기적 감시 타이머
            setInterval(function() {
                var currentHref = location.href;
                var isWrite = currentHref.indexOf('write') > -1;
                var _topAdExist = document.getElementById('topAd');

                // 1. URL 변경 감지 처리
                if (currentHref !== lastHref) {
                    if (isWrite) {
                        destroyTopAd();
                    } else {
                        if (_topAdExist) loadTopAd();
                    }
                    lastHref = currentHref;
                }

                // 2. 메일 쓰기 페이지인데 광고 슬롯이나 마크업이 남아있다면 강제 파괴
                if (isWrite && (topAdSlot || document.getElementById('gpt-passback'))) {
                    destroyTopAd();
                }

                // 3. 메일 쓰기가 아닌데 body 마크업은 생겼고 광고 div는 없는 상태라면 (동적 렌더링 순간 포착)
                if (!isWrite && _topAdExist && !document.getElementById('gpt-passback')) {
                    loadTopAd();
                }
            }, 100);
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