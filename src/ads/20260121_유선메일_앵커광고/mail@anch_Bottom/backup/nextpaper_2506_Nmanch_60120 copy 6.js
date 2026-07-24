(function() {
    try {
        var _head = document.getElementsByTagName('head')[0];
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _head.appendChild(_script);

        var anchorSlot = null;
        var lastHref = location.href;
        var lastClasses = "";
        var detectedAdHeight = 0;

        // [헬퍼 함수 1] NodeList를 배열로 변환 없이 순회하기 위한 for문 대체 함수
        function each(collection, callback) {
            for (var i = 0; i < collection.length; i++) {
                callback(collection[i]);
            }
        }

        // [헬퍼 함수 2] 클래스 포함 여부 확인 (classList 미지원 브라우저 대응)
        function hasClass(element, className) {
            if (!element) return false;
            if (element.classList) {
                return element.classList.contains(className);
            }
            return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
        }

        // [광고 로드 함수]
        function loadAnchorAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                if (anchorSlot) {
                    googletag.destroySlots([anchorSlot]);
                }
                anchorSlot = googletag.defineOutOfPageSlot(
                    '/21682743634,22664242840/nate/nate_pc_mail_anchor_1x1',
                    googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR
                );
                if (anchorSlot) {
                    anchorSlot.setTargeting('ad_type', 'anchor').addService(googletag.pubads());
                    googletag.display(anchorSlot);
                }
            });
        }

        // [광고 완전 파괴 함수]
        function destroyAnchorAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                if (anchorSlot) {
                    googletag.destroySlots([anchorSlot]);
                    anchorSlot = null;
                    detectedAdHeight = 0;
                }
            });
        }

        _script.onload = _script.onreadystatechange = function() { // IE 구버전 대응(onreadystatechange)
            if (this.readyState && this.readyState !== "loaded" && this.readyState !== "complete") return;
            
            googletag.cmd.push(function() {
                googletag.pubads().enableSingleRequest();
                googletag.pubads().set('page_url', '//nate.com');

                googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                    if (event.slot === anchorSlot && !event.isEmpty) {
                        setTimeout(function() {
                            var ins = document.getElementsByTagName('ins'); // querySelectorAll 대신 호환성 위해 사용 가능하나 querySelectorAll도 IE8+ 지원함
                            var ad = (ins.length > 0) ? ins[ins.length - 1] : null;
                            if (ad && ad.offsetHeight > 0) {
                                detectedAdHeight = ad.offsetHeight;
                            }
                        }, 50);
                    }
                });
                googletag.enableServices();
            });

            if (location.href.indexOf('write') === -1) {
                loadAnchorAd();
            }

            setInterval(function() {
                var currentHref = location.href;
                var isWrite = currentHref.indexOf('write') > -1;
                var isView = currentHref.indexOf('view') > -1;

                // 1. URL 변경 감지
                if (currentHref !== lastHref) {
                    if (isWrite) {
                        destroyAnchorAd();
                    } else {
                        loadAnchorAd();
                    }
                    lastHref = currentHref;
                }

                // 2. 예외 처리
                if (isWrite && anchorSlot) {
                    destroyAnchorAd();
                }

                // 3. 광고 높이 측정
                var currH = 0;
                if (!isWrite) {
                    var ins = document.querySelectorAll('ins');
                    var ad = (ins.length > 0) ? ins[ins.length - 1] : null;
                    if (ad && ad.offsetHeight > 0) {
                        detectedAdHeight = ad.offsetHeight;
                    }
                    currH = detectedAdHeight;
                }

                // 4. 클래스 변동 감지 및 리셋
                var viewModeEl = document.getElementById('nmViewMode');
                var currentClasses = viewModeEl ? viewModeEl.className : "";
                if (currentClasses !== lastClasses) {
                    // querySelectorAll의 결과를 for문으로 순회
                    var listBodyTargets = document.querySelectorAll('#nmListBody');
                    each(listBodyTargets, function(el){
                        el.removeAttribute('data-org-h');
                        el.removeAttribute('data-last-applied');
                    });
                    
                    var contentTargets = document.querySelectorAll('.nmViewContent');
                    each(contentTargets, function(el){
                         el.removeAttribute('data-org-h');
                         el.removeAttribute('data-last-applied');
                    });
                    
                    lastClasses = currentClasses;
                }

                // 5. 타겟 설정 (Array.from 제거 및 일반 배열 push 사용)
                var heightTargets = [];
                if (viewModeEl) {
                    var isX = hasClass(viewModeEl, 'nmViewModeX');
                    var isY = hasClass(viewModeEl, 'nmViewModeY');

                    if (isX) {
                        var contents = document.querySelectorAll('.nmViewContent');
                        each(contents, function(el) { heightTargets.push(el); });
                    } else if (isY) {
                        var listBody = document.getElementById('nmListBody');
                        if (listBody) heightTargets.push(listBody);
                        
                        var contents = document.querySelectorAll('.nmViewContent');
                        each(contents, function(el) { heightTargets.push(el); });
                    } else {
                        var listBody = document.getElementById('nmListBody');
                        if (listBody) heightTargets.push(listBody);
                        
                        if (isView) {
                            var contents = document.querySelectorAll('.nmViewContent');
                            each(contents, function(el) { heightTargets.push(el); });
                        }
                    }
                }

                // 6. 높이 적용 (forEach 대신 일반 for문 사용)
                for (var i = 0; i < heightTargets.length; i++) {
                    var el = heightTargets[i];
                    var currentInlineH = el.style.height;
                    var orgH = el.getAttribute('data-org-h');
                    var lastApplied = el.getAttribute('data-last-applied');

                    var finalSubtract = isWrite ? 0 : currH;

                    if (!orgH || (currentInlineH && currentInlineH !== lastApplied)) {
                        var rawH = (currentInlineH && currentInlineH !== lastApplied) 
                                   ? parseInt(currentInlineH) : el.offsetHeight;
                        
                        if (currentInlineH !== lastApplied) {
                            el.setAttribute('data-org-h', rawH);
                            orgH = rawH;
                        }
                    }

                    if (orgH) {
                        var targetH = (parseInt(orgH) - finalSubtract) + 'px';
                        if (currentInlineH !== targetH) {
                            // setProperty는 IE9+ 지원. IE8 이하는 style.height = targetH 로 처리되나 !important 적용이 어려움.
                            // 최신 IE 호환성을 위해 try-catch로 감싸거나 일반 할당 병행
                            try {
                                el.style.setProperty('height', targetH, 'important');
                            } catch(e) {
                                el.style.height = targetH;
                            }
                            el.setAttribute('data-last-applied', targetH);
                        }
                    }
                }
                document.body.style.setProperty('padding-bottom', '0px');
            }, 400);
        };
    } catch (e) {
        // console 객체가 없는 구형 브라우저(IE9 이하)에서 오류 방지
        if (window.console && console.log) console.log(e);
    }
})();