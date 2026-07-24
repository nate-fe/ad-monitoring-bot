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

        function each(collection, callback) {
            for (var i = 0; i < collection.length; i++) { callback(collection[i]); }
        }

        function hasClass(element, className) {
            if (!element) return false;
            if (element.classList) return element.classList.contains(className);
            return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
        }

        function loadAnchorAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                if (anchorSlot) googletag.destroySlots([anchorSlot]);
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

        _script.onload = _script.onreadystatechange = function() {
            if (this.readyState && this.readyState !== "loaded" && this.readyState !== "complete") return;
            
            googletag.cmd.push(function() {
                googletag.pubads().enableSingleRequest();
                googletag.pubads().set('page_url', '//nate.com');
                googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                    if (event.slot === anchorSlot && !event.isEmpty) {
                        setTimeout(function() {
                            var ins = document.getElementsByTagName('ins');
                            var ad = (ins.length > 0) ? ins[ins.length - 1] : null;
                            if (ad && ad.offsetHeight > 0) {
                                detectedAdHeight = ad.offsetHeight;
                            }
                        }, 50);
                    }
                });
                googletag.enableServices();
            });

            if (location.href.indexOf('write') === -1) loadAnchorAd();

            setInterval(function() {
                var currentHref = location.href;
                var isWrite = currentHref.indexOf('write') > -1;
                var isView = currentHref.indexOf('view') > -1;

                // 1. URL 변경 감지
                if (currentHref !== lastHref) {
                    isWrite ? destroyAnchorAd() : loadAnchorAd();
                    lastHref = currentHref;
                }

                // 2. 예외 처리
                if (isWrite && anchorSlot) destroyAnchorAd();

                // 3. 광고 높이 및 접힘 상태 측정 (핵심 수정 부분)
                var currH = 0;
                if (!isWrite) {
                    var ins = document.querySelectorAll('ins');
                    var ad = (ins.length > 0) ? ins[ins.length - 1] : null;
                    if (ad && ad.offsetHeight > 0) {
                        // 광고의 실시간 스타일 확인
                        var adStyle = window.getComputedStyle ? getComputedStyle(ad) : ad.currentStyle;
                        var bottomVal = parseInt(adStyle.bottom) || 0;

                        // bottom이 0보다 작으면(접히는 중이거나 닫힘) 높이를 0으로 설정
                        if (bottomVal < 0) {
                            currH = 0;
                        } else {
                            detectedAdHeight = ad.offsetHeight;
                            currH = detectedAdHeight;
                        }
                    }
                }

                // 4. 클래스 변동 감지 및 리셋
                var viewModeEl = document.getElementById('nmViewMode');
                var currentClasses = viewModeEl ? viewModeEl.className : "";
                if (currentClasses !== lastClasses) {
                    var targets = document.querySelectorAll('#nmListBody, .nmViewContent');
                    each(targets, function(el){
                        el.removeAttribute('data-org-h');
                        el.removeAttribute('data-last-applied');
                    });
                    lastClasses = currentClasses;
                }

                // 5. 타겟 설정
                var heightTargets = [];
                if (viewModeEl) {
                    var isX = hasClass(viewModeEl, 'nmViewModeX');
                    var isY = hasClass(viewModeEl, 'nmViewModeY');
                    if (isX) {
                        each(document.querySelectorAll('.nmViewContent'), function(el) { heightTargets.push(el); });
                    } else if (isY) {
                        var lb = document.getElementById('nmListBody');
                        if (lb) heightTargets.push(lb);
                        each(document.querySelectorAll('.nmViewContent'), function(el) { heightTargets.push(el); });
                    } else {
                        var lb = document.getElementById('nmListBody');
                        if (lb) heightTargets.push(lb);
                        if (isView) each(document.querySelectorAll('.nmViewContent'), function(el) { heightTargets.push(el); });
                    }
                }

                // 6. 높이 적용
                for (var i = 0; i < heightTargets.length; i++) {
                    var el = heightTargets[i];
                    var currentInlineH = el.style.height;
                    var orgH = el.getAttribute('data-org-h');
                    var lastApplied = el.getAttribute('data-last-applied');

                    if (!orgH || (currentInlineH && currentInlineH !== lastApplied)) {
                        var rawH = (currentInlineH && currentInlineH !== lastApplied) ? parseInt(currentInlineH) : el.offsetHeight;
                        if (currentInlineH !== lastApplied) {
                            el.setAttribute('data-org-h', rawH);
                            orgH = rawH;
                        }
                    }

                    if (orgH) {
                        var targetH = (parseInt(orgH) - currH) + 'px';
                        if (currentInlineH !== targetH) {
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
        if (window.console) console.log(e);
    }
})();