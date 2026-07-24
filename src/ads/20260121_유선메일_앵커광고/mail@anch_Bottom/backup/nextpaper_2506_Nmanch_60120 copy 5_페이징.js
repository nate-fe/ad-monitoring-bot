(function() {
    try {
        var _head = document.querySelectorAll('head')[0];
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _head.appendChild(_script);

        var anchorSlot;
        var lastNormalizedHref = ""; 

        // [핵심: page 파라미터만 제거하는 함수]
        // 이 함수를 거친 주소가 다르다는 것은 '단순 페이징'이 아닌 다른 이동이 일어났다는 뜻입니다.
        function normalizeUrl(url) {
            return url.replace(/([?&])page=[^&]*/g, '$1') // page=N 제거
                      .replace(/[?&]$/, '')               // 끝에 남은 ? 또는 & 제거
                      .replace(/([?&])&+/g, '$1');        // 중복 & 제거
        }

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

            // 초기 실행
            lastNormalizedHref = normalizeUrl(location.href);
            if (location.href.indexOf('write') === -1) loadAnchorAd();

            var lastEl = null;
            var lastMode = '';

            setInterval(function() {
                var currentHref = location.href;
                var currentNormalized = normalizeUrl(currentHref);
                var isWrite = currentHref.indexOf('write') > -1;
                var isView = currentHref.indexOf('view') > -1;

                // 1. [광고 로드 판단]
                // page만 바뀐 게 아니라면 (즉, #list -> #view가 되었거나 다른 메뉴라면) 무조건 새로 로드
                if (currentNormalized !== lastNormalizedHref) {
                    if (!isWrite) {
                        loadAnchorAd();
                    }
                    lastNormalizedHref = currentNormalized;
                }

                // 2. [광고 제어 및 Transform]
                var ins = document.getElementsByTagName('ins');
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

                // 3. [본문 스타일 조정]
                var mode = isView ? 'view' : 'list';
                var targetId = isView ? 'nmPageFooter' : 'nmListBody';
                var el = document.getElementById(targetId);

                if (el) {
                    if (el !== lastEl || mode !== lastMode) {
                        lastEl = el;
                        lastMode = mode;
                        var rawH = el.style.height ? parseInt(el.style.height) : el.offsetHeight;
                        el.setAttribute('data-org-h', rawH);
                        el.setAttribute('data-last-applied', '');
                    }

                    // 사이트 자체 스크립트가 높이를 변경했는지 감시
                    var currentInlineH = el.style.height;
                    var lastApplied = el.getAttribute('data-last-applied');
                    if (currentInlineH && currentInlineH !== lastApplied) {
                        el.setAttribute('data-org-h', parseInt(currentInlineH));
                    }

                    var orgH = parseInt(el.getAttribute('data-org-h'));
                    if (!isNaN(orgH)) {
                        if (mode === 'list') {
                            var targetH = (orgH - currH) + 'px';
                            if (el.style.height !== targetH) {
                                el.style.setProperty('height', targetH, 'important');
                                el.setAttribute('data-last-applied', targetH);
                            }
                        } else {
                            // 상세 화면 padding-bottom 강제 적용
                            el.style.setProperty('padding-bottom', currH + 'px', 'important');
                        }
                    }
                }
            }, 500);
        };
    } catch (e) { console.log(e); }
})();