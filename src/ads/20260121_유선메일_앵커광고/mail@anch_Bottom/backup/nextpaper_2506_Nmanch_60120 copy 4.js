(function() {
    try {
        var _head = document.querySelectorAll('head')[0];
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _head.appendChild(_script);

        var anchorSlot;
        var lastHref = location.href;

        // [광고 정의 및 호출 함수]
        function loadAnchorAd() {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function() {
                // 1. 기존 슬롯이 있다면 제거 (닫기 버튼 상태 등을 완전히 초기화)
                if (anchorSlot) {
                    googletag.destroySlots([anchorSlot]);
                }

                // 2. 슬롯 재정의
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

            // 초기 로드
            if (location.href.indexOf('write') === -1) {
                loadAnchorAd();
            }

            var lastEl = null;
            var lastMode = '';

            setInterval(function() {
                var currentHref = location.href;
                var isWrite = currentHref.indexOf('write') > -1;
                var isPageChanged = currentHref !== lastHref;

                // [핵심: 페이지 이동 시 광고 완전 재로드]
                if (isPageChanged) {
                    if (!isWrite) {
                        // 쓰기 페이지가 아니면 광고를 파괴 후 재생성 (화살표 버튼 복구)
                        loadAnchorAd();
                    }
                    lastHref = currentHref;
                }

                // [광고 높이 측정 및 표시 제어]
                var ins = document.getElementsByTagName('ins');
                var ad = (ins.length > 0) ? ins[ins.length - 1] : null;
                var currH = 0;

                if (ad) {
                    ad.style.transform = 'translateX(calc(-50% + 100px)';
                    if (isWrite) {
                        ad.style.display = 'none';
                    } else {
                        // 억지로 bottom:0을 주지 않아도 새로 생성되었으므로 정상이지만, 
                        // 만약의 경우를 위해 display만 보장합니다.
                        if (ad.style.display === 'none') {
                            ad.style.display = 'block';
                        }
                    }

                    var s = ad.currentStyle || window.getComputedStyle(ad);
                    // 광고가 화면에 보이고(bottom:0), 높이가 있을 때만 높이값 추출
                    if ((s.bottom === '0px' || parseInt(s.bottom) === 0) && ad.offsetHeight > 0) {
                        currH = ad.offsetHeight;
                    }
                }

                // [본문 레이아웃 조정]
                var isView = currentHref.indexOf('view') > -1;
                var mode = isView ? 'view' : 'list';
                var el = document.getElementById(isView ? 'nmPageFooter' : 'nmListBody');

                if (!el) return;

                if (el !== lastEl || mode !== lastMode) {
                    lastEl = el;
                    lastMode = mode;
                    var rawH = el.style.height ? parseInt(el.style.height) : el.offsetHeight;
                    el.setAttribute('data-org-h', rawH);
                    el.setAttribute('data-last-applied', '');
                }

                var currentStyleH = el.style.height;
                var lastApplied = el.getAttribute('data-last-applied');
                if (currentStyleH && currentStyleH !== lastApplied) {
                    el.setAttribute('data-org-h', parseInt(currentStyleH));
                }

                var orgH = parseInt(el.getAttribute('data-org-h'));
                if (!isNaN(orgH)) {
                    if (mode === 'list') {
                        var targetH = orgH - currH;
                        if (el.style.height !== targetH + 'px') {
                            el.style.height = targetH + 'px';
                            el.setAttribute('data-last-applied', targetH + 'px');
                        }
                    } else {
                        el.style.paddingBottom = currH + 'px';
                    }
                }
            }, 500);
        };
    } catch (e) {
        console.log(e);
    }
})();