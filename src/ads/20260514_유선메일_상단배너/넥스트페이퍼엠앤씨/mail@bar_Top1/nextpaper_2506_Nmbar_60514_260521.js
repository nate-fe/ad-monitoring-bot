(function() {
    try {
        // [수정] 중복 로드를 방지하기 위해 페이지 내 gpt.js 존재 여부 사전 체크
        var isGptExist = document.querySelector('script[src*="gpt.js"]');
        var _head = document.getElementsByTagName('head')[0];
        var _script = null;

        // gpt.js가 전역에 아예 없을 때만 스크립트 태그 생성 및 주입
        if (!isGptExist && !window.googletag) {
            _script = document.createElement('script');
            _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
            _script.setAttribute('crossorigin', 'anonymous');
            _script.setAttribute('async', true);
            _head.appendChild(_script);
        }

        var topAdSlot = null; // 상단 배너 슬롯 저장 객체
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

        // [수정] 상단 광고 생성 및 호출 함수
        function loadTopAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                var _topAd = document.getElementById('topAd');
                var _topBanner = document.createElement('div');
                if (!_topAd) return; // body 마크업이 아직 안 그려졌다면 패스
                _topBanner.setAttribute('id', 'topBanner');

                // 기존 마크업 청소 및 중복 방지용 gpt-passback div 생성
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

                // 기존에 생성된 상단 슬롯이 있다면 파괴 후 재생성 (SPA 페이지 전환 대응)
                if (topAdSlot) googletag.destroySlots([topAdSlot]);

                topAdSlot = googletag.defineSlot('/21682743634,22664242840/nate/nate_pc_mail_banner_728x90', [728, 90], 'gpt-passback').addService(googletag.pubads());
                googletag.display('gpt-passback');
            });
        }

        // [수정] 상단 광고 제거 함수
        function destroyTopAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                if (topAdSlot) {
                    googletag.destroySlots([topAdSlot]);
                    topAdSlot = null;
                }
                var _div = document.getElementById('gpt-passback');
                if (_div && _div.parentNode) {
                    _div.parentNode.removeChild(_div); // 광고 마크업 삭제
                }
            });
        }

        // 초기 실행 및 타이머 시작을 위한 래퍼 함수
        function initAdLogic() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                googletag.pubads().enableSingleRequest();
                googletag.pubads().set('page_url', '//nate.com');
                googletag.enableServices();
            });

            // 첫 로드 시 메일 쓰기가 아니면 광고 호출 시도
            if (location.href.indexOf('write') === -1) {
                loadTopAd();
            }

            // AngularJS SPA 대응을 위한 400ms 주기적 감시 타이머
            setInterval(function() {
                var currentHref = location.href;
                var isWrite = currentHref.indexOf('write') > -1;
                var isView = currentHref.indexOf('view') > -1;
                var _topAdExist = document.getElementById('topAd');

                // 1. URL 변경 감지 처리
                if (currentHref !== lastHref) {
                    if (isWrite) {
                        destroyTopAd();
                    } else {
                        // URL이 바뀌었는데 아직 body 마크업이 안 그려졌을 수 있으므로 있을 때만 호출
                        if (_topAdExist) loadTopAd();
                    }
                    lastHref = currentHref;
                }

                // 2. 예외 처리: 메일 쓰기 페이지인데 광고 슬롯이나 마크업이 남아있다면 강제 파괴
                if (isWrite && (topAdSlot || document.getElementById('gpt-passback'))) {
                    destroyTopAd();
                }

                // 3. [추가] 메일 쓰기가 아닌데, body 마크업은 생겼고 광고 div('gpt-passback')는 없는 상태라면 (동적 렌더링 순간 포착)
                if (!isWrite && _topAdExist && !document.getElementById('gpt-passback')) {
                    loadTopAd();
                }
            }, 400);
        }

        // 스크립트 로드 완료 시점 제어
        if (_script) {
            _script.onload = _script.onreadystatechange = function() {
                if (this.readyState && this.readyState !== "loaded" && this.readyState !== "complete") return;
                initAdLogic();
            };
        } else {
            // 이미 외부 스크립트가 로드되어 있던 상황이라면 즉시 실행
            initAdLogic();
        }

    } catch (e) {
        if (window.console) console.log(e);
    }
})();