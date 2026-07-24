(function() {
    try {
        var _head = document.querySelectorAll('head')[0];
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _head.appendChild(_script);

        var anchorSlot = null; // 슬롯 관리를 위해 초기값을 null로 설정
        var lastHref = location.href;
        var lastClasses = ""; 
        var detectedAdHeight = 0;

        // [광고 로드 함수]
        function loadAnchorAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                // 기존 슬롯이 있다면 파괴하고 시작
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
                    anchorSlot = null; // 참조 초기화
                    detectedAdHeight = 0;
                }
            });
        }

        _script.onload = function() {
            googletag.cmd.push(function() {
                googletag.pubads().enableSingleRequest();
                googletag.pubads().set('page_url', '//nate.com');
                
                googletag.pubads().addEventListener('slotRenderEnded', function(event) {
                    if (event.slot === anchorSlot && !event.isEmpty) {
                        setTimeout(function() {
                            var ins = document.querySelectorAll('ins');
                            var ad = (ins.length > 0) ? ins[ins.length - 1] : null;
                            if (ad && ad.offsetHeight > 0) {
                                detectedAdHeight = ad.offsetHeight;
                            }
                        }, 50);
                    }
                });
                googletag.enableServices();
            });

            // 초기 로드 시 체크
            if (location.href.indexOf('write') === -1) {
                loadAnchorAd();
            }

            setInterval(function() {
                var currentHref = location.href;
                var isWrite = currentHref.indexOf('write') > -1;
                var isView = currentHref.indexOf('view') > -1;

                // 1. https://support.google.com/admanager/answer/79203?hl=ko
                if (currentHref !== lastHref) {
                    if (isWrite) {
                        destroyAnchorAd(); // 쓰기 모드 진입 시 즉시 파괴
                    } else {
                        loadAnchorAd();    // 그 외 모드 진입 시 로드
                    }
                    lastHref = currentHref;
                }

                // 2. [강제 예외 처리] URL은 안 변했는데 쓰기 모드인 경우 대비
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

                // 4. [클래스 변동 감지 및 리셋]
                var viewModeEl = document.getElementById('nmViewMode');
                var currentClasses = viewModeEl ? viewModeEl.className : "";
                if (currentClasses !== lastClasses) {
                    var allPotentialTargets = document.querySelectorAll('#nmListBody, .nmViewContent');
                    allPotentialTargets.forEach(function(el) {
                        el.removeAttribute('data-org-h');
                        el.removeAttribute('data-last-applied');
                    });
                    lastClasses = currentClasses;
                }

                // 5. [타겟 설정 및 높이 적용]
                var heightTargets = [];
                if (viewModeEl) {
                    var isX = viewModeEl.classList.contains('nmViewModeX');
                    var isY = viewModeEl.classList.contains('nmViewModeY');

                    if (isX) {
                        heightTargets = Array.from(document.querySelectorAll('.nmViewContent'));
                    } else if (isY) {
                        var listBody = document.getElementById('nmListBody');
                        if (listBody) heightTargets.push(listBody);
                        var contents = document.querySelectorAll('.nmViewContent');
                        heightTargets = heightTargets.concat(Array.from(contents));
                    } else {
                        var listBody = document.getElementById('nmListBody');
                        if (listBody) heightTargets.push(listBody);
                        if (isView) {
                            var contents = document.querySelectorAll('.nmViewContent');
                            heightTargets = heightTargets.concat(Array.from(contents));
                        }
                    }
                }

                heightTargets.forEach(function(el) {
                    var currentInlineH = el.style.height;
                    var orgH = el.getAttribute('data-org-h');
                    var lastApplied = el.getAttribute('data-last-applied');

                    // 쓰기 모드일 때는 원래 높이(orgH)로 복구
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
                            el.style.setProperty('height', targetH, 'important');
                            el.setAttribute('data-last-applied', targetH);
                        }
                    }
                });

            }, 400);
        };
    } catch (e) { console.log(e); }
})();