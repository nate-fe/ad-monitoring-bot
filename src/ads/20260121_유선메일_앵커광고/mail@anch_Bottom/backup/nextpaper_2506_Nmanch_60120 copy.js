(function(){
    try {
        var _head = document.querySelectorAll('head')[0];
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _head.appendChild(_script);

        // [중요] 슬롯 객체와 광고 로드 상태를 함수 전체에서 공유하기 위해 상위에 선언
        var anchorSlot; 
        var isAdLoaded = false; 
        
        _script.onload = function() {
            window.googletag = window.googletag || {cmd: []};
            googletag.cmd.push(function()

            { var anchorSlot = googletag.defineOutOfPageSlot('/21682743634,22664242840/nate/nate_pc_mail_anchor_1x1', googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR); 
             if (anchorSlot) anchorSlot.setTargeting('ad_type', 'anchor').addService(googletag.pubads()); googletag.pubads().enableSingleRequest(); googletag.pubads().set('page_url', '//nate.com'); googletag.enableServices(); 
             if (location.href.indexOf('write') === -1) {
                 googletag.display(anchorSlot); 
                 isAdLoaded = true;
             }
             }
            );
            // [상태 저장 변수] cacheH: 직전 광고 높이, lastMode: 직전 페이지 모드
            var cacheH = 0, lastMode = '';

            setInterval(function() {
                var isWrite = location.href.indexOf('write') > -1;

                if (!isWrite && !isAdLoaded && anchorSlot) {
                    googletag.display(anchorSlot);
                    isAdLoaded = true; 
                    return; // 렌더링 시간 벌어주기 위해 이번 턴 종료
                }

                // [광고 감지] 마지막 ins 태그의 bottom이 0인지 확인
                var ins = document.getElementsByTagName('ins'), currH = 0;
                var ad = (ins.length > 0) ? ins[ins.length - 1] : null;

                if (ad && isAdLoaded) {
                    if (isWrite) {
                        ad.style.display = 'none';
                    } else {
                        ad.style.display = 'block';
                    }
                
                    var s = ad.currentStyle || window.getComputedStyle(ad); // IE호환 스타일 가져오기
                    if ((s.bottom === '0px' || parseInt(s.bottom) === 0) && ad.offsetHeight > 0) {
                        currH = ad.offsetHeight;
                    }
                }
                var isView = location.href.indexOf('view') > -1;
                var mode = isView ? 'view' : 'list';
                var el = document.getElementById(isView ? 'nmPageFooter' : 'nmListBody');
                
                // 요소가 없거나 모드가 바뀌면 초기화
                if (!el || mode !== lastMode || el !== lastEl) { 
                    cacheH = 0;        // 새 요소이므로 적용된 패딩이 없음 -> 0으로 리셋
                    lastMode = mode; 
                    lastEl = el;       // 현재 요소 저장
                    if (!el) return; 
                }

                // [높이 적용] 높이에 변화가 생겼을 때만 1회 실행
                if (currH !== cacheH) {
                    if (mode === 'list') {
                        el.style.height = (el.offsetHeight - (currH - cacheH)) + 'px';
                    }
                    else el.style.paddingBottom = currH + 'px';

                    cacheH = currH; // 현재 높이 기억
                }
            }, 500);
        }
    }catch (e) {console.log(e);}
})();