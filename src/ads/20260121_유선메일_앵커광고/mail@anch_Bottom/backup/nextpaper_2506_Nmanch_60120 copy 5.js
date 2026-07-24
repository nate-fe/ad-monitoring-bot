(function() {
    try {
        var _head = document.querySelectorAll('head')[0];
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _head.appendChild(_script);

        var anchorSlot;
        var lastHref = location.href;
        var lastClasses = ""; // 클래스 변동 감지용

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

        _script.onload = function() {
            googletag.cmd.push(function() {
                googletag.pubads().enableSingleRequest();
                googletag.pubads().set('page_url', '//nate.com');
                googletag.enableServices();
            });

            if (location.href.indexOf('write') === -1) loadAnchorAd();

            setInterval(function() {
                var currentHref = location.href;
                var isWrite = currentHref.indexOf('write') > -1;
                var isView = currentHref.indexOf('view') > -1;

                if (currentHref !== lastHref) {
                    if (!isWrite) loadAnchorAd();
                    lastHref = currentHref;
                }

                var ins = document.querySelectorAll('ins');
                var ad = (ins.length > 0) ? ins[ins.length - 1] : null;
                var currH = 0;

                if (ad) {
                    if (isWrite) {
                        ad.style.setProperty('display', 'none', 'important');
                    } else {
                        if (ad.style.display === 'none') {
                            ad.style.setProperty('display', 'block', 'important');
                        }
                        var s = window.getComputedStyle(ad);
                        if ((s.bottom === '0px' || parseInt(s.bottom) === 0) && ad.offsetHeight > 0) {
                            currH = ad.offsetHeight;
                        }
                    }
                }

                // --- [클래스 변동 감지 및 리셋 로직] ---
                var viewModeEl = document.getElementById('nmViewMode');
                var currentClasses = viewModeEl ? viewModeEl.className : "";

                // 클래스가 바뀌었다면(버튼 클릭 등) 기존에 저장된 높이 데이터 리셋
                if (currentClasses !== lastClasses) {
                    var allPotentialTargets = document.querySelectorAll('#nmListBody, .nmViewContent');
                    allPotentialTargets.forEach(function(el) {
                        el.removeAttribute('data-org-h');
                        el.removeAttribute('data-last-applied');
                    });
                    lastClasses = currentClasses;
                }

                // --- [본문 레이아웃 조정 타겟 설정] ---
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

                // --- [높이 적용] ---
                heightTargets.forEach(function(el) {
                    var currentInlineH = el.style.height;
                    var orgH = el.getAttribute('data-org-h');

                    // 기준 높이가 없거나 사이트 스크립트가 높이를 새로 설정한 경우 갱신
                    if (!orgH || (currentInlineH && currentInlineH !== el.getAttribute('data-last-applied'))) {
                        // 기준 높이를 잡을 때 현재 inline height가 있다면 그것을, 없다면 실제 높이를 사용
                        var rawH = (currentInlineH && currentInlineH !== el.getAttribute('data-last-applied')) 
                                   ? parseInt(currentInlineH) : el.offsetHeight;
                        
                        // 현재 광고가 이미 적용된 높이일 수 있으므로, 
                        // 만약 이전에 적용했던 높이와 같다면 갱신하지 않음 (무한 루프 방지)
                        if (currentInlineH !== el.getAttribute('data-last-applied')) {
                            el.setAttribute('data-org-h', rawH);
                            orgH = rawH;
                        }
                    }

                    if (orgH) {
                        var targetH = (parseInt(orgH) - currH) + 'px';
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