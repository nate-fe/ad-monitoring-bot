(function(){
    try {
        var _head = document.querySelectorAll('head')[0];
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _head.appendChild(_script);
        _script.onload = function() {
            window.googletag = window.googletag || {cmd: []};
            googletag.cmd.push(function()

            { var anchorSlot = googletag.defineOutOfPageSlot('/21682743634,22664242840/nate/nate_pc_mail_anchor_1x1', googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR); if (anchorSlot) anchorSlot.setTargeting('ad_type', 'anchor').addService(googletag.pubads()); googletag.pubads().enableSingleRequest(); googletag.pubads().set('page_url', '//nate.com'); googletag.enableServices(); googletag.display(anchorSlot); }
            );
            // [상태 저장 변수] cacheH: 직전 광고 높이, lastMode: 직전 페이지 모드
            var cacheH = 0, lastMode = '';

            setInterval(function() {
                var isView = location.href.indexOf('view') > -1;
                var mode = isView ? 'view' : 'list';
                var el = document.getElementById(isView ? 'nmPageFooter' : 'nmListBody');

                // 요소가 없거나 모드가 바뀌면 초기화
                if (!el || mode !== lastMode) { cacheH = 0; lastMode = mode; if (!el) return; }

                // [광고 감지] 마지막 ins 태그의 bottom이 0인지 확인
                var ins = document.getElementsByTagName('ins'), currH = 0;
                if (ins.length) {
                    var ad = ins[ins.length - 1];
                    var s = ad.currentStyle || window.getComputedStyle(ad); // IE호환 스타일 가져오기
                    if ((s.bottom === '0px' || parseInt(s.bottom) === 0) && ad.offsetHeight > 0) {
                        currH = ad.offsetHeight;
                    }
                }

                // [높이 적용] 높이에 변화가 생겼을 때만 1회 실행
                if (currH !== cacheH) {
                    if (mode === 'list') el.style.height = (el.offsetHeight - (currH - cacheH)) + 'px';
                    else el.style.paddingBottom = currH + 'px';
                    cacheH = currH; // 현재 높이 기억
                }
            }, 500);
        }
    }catch (e) {console.log(e);}
})();