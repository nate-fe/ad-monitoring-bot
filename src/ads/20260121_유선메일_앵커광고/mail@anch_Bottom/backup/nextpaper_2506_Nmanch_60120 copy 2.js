(function(){
    try {
        var _head = document.querySelectorAll('head')[0];
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _head.appendChild(_script);

        // [변수 공유]
        var anchorSlot; 
        var isAdLoaded = false; 
        
        _script.onload = function() {
            window.googletag = window.googletag || {cmd: []};
            googletag.cmd.push(function() {
                anchorSlot = googletag.defineOutOfPageSlot('/21682743634,22664242840/nate/nate_pc_mail_anchor_1x1', googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR); 
                if (anchorSlot) anchorSlot.setTargeting('ad_type', 'anchor').addService(googletag.pubads());
                googletag.pubads().enableSingleRequest(); 
                googletag.pubads().set('page_url', '//nate.com'); 
                googletag.enableServices(); 
                
                // [초기 로드] 쓰기 화면이 아니면 광고 로드
                if (location.href.indexOf('write') === -1) {
                    googletag.display(anchorSlot); 
                    isAdLoaded = true;
                }
            });

            // [상태 관리 변수]
            var lastEl = null;      // 마지막으로 조작한 요소
            var lastMode = '';      // 마지막 모드 (list/view)

            setInterval(function() {
                var isWrite = location.href.indexOf('write') > -1;

                // 1. [광고 호출] (목록 화면이고 + 아직 로드 안 됐다면)
                if (!isWrite && !isAdLoaded && anchorSlot) {
                    googletag.display(anchorSlot);
                    isAdLoaded = true; 
                    return; 
                }

                // 2. [광고 표시/숨김 및 높이 측정]
                var ins = document.getElementsByTagName('ins');
                var ad = (ins.length > 0) ? ins[ins.length - 1] : null;
                var currH = 0; // 광고 높이 (숨겨지면 0)

                if (ad && isAdLoaded) {
                    if (isWrite) {
                        ad.style.display = 'none'; // 쓰기화면: 숨김
                    } else {
                        ad.style.display = 'block'; // 목록화면: 보임
                    }
                    
                    // 광고의 실제 높이 계산
                    var s = ad.currentStyle || window.getComputedStyle(ad); 
                    if ((s.bottom === '0px' || parseInt(s.bottom) === 0) && ad.offsetHeight > 0) {
                        currH = ad.offsetHeight;
                    }
                }

                // 3. [본문 요소 가져오기]
                var isView = location.href.indexOf('view') > -1;
                var mode = isView ? 'view' : 'list';
                var el = document.getElementById(isView ? 'nmPageFooter' : 'nmListBody');

                // 요소가 없으면 패스
                if (!el) return;

                // 4. [핵심 로직] 요소가 바뀌었거나(AJAX), 높이 초기화가 필요할 때
                if (el !== lastEl || mode !== lastMode) {
                    lastEl = el;
                    lastMode = mode;
                    
                    // 새 요소가 나타나면, 현재 설정된 높이(순수 높이)를 저장해둡니다.
                    // data-org-h 속성에 저장하여 나중에도 참고합니다.
                    var rawH = el.style.height ? parseInt(el.style.height) : el.offsetHeight;
                    el.setAttribute('data-org-h', rawH); 
                    el.setAttribute('data-last-applied', ''); // 아직 조작 안 함 표시
                }

                // 5. [외부 변경 감지] 브라우저 리사이즈 등으로 사이트가 높이를 강제로 바꿨는지 체크
                var currentStyleH = el.style.height; // 예: "800px"
                var lastApplied = el.getAttribute('data-last-applied'); // 예: "671px" (우리가 지난번에 줄인 값)

                // 현재 높이가 우리가 마지막으로 수정한 값과 다르다면? -> 사이트가 리사이즈를 한 것!
                // 단, 우리가 줄이기 전의 '원본 높이'를 다시 갱신해야 함
                if (currentStyleH && currentStyleH !== lastApplied) {
                    el.setAttribute('data-org-h', parseInt(currentStyleH));
                }

                // 6. [높이 최종 적용] (원본 높이 - 광고 높이)
                var orgH = parseInt(el.getAttribute('data-org-h')); // 저장해둔 원본 높이 (예: 781)
                if (!isNaN(orgH)) {
                    var targetH = 0;
                    
                    if (mode === 'list') {
                        // 리스트 화면: 원본 높이에서 광고 높이를 뺌
                        targetH = orgH - currH; 
                        
                        // 계산된 높이가 현재 스타일과 다를 때만 적용 (DOM 부하 방지)
                        if (el.style.height !== targetH + 'px') {
                            el.style.height = targetH + 'px';
                            el.setAttribute('data-last-applied', targetH + 'px'); // 내가 적용한 값 기억
                        }
                    } else {
                        // 뷰 화면: 기존처럼 패딩 처리 (height 건드리면 깨질 수 있음)
                        // 필요시 여기도 height 로직으로 통일 가능
                        el.style.paddingBottom = currH + 'px';
                    }
                }

            }, 500);
        }
    }catch (e) {console.log(e);}
})();