(function () {
    var DISP_ID = 'NDc5OA==';
    var BASE_ID = 'cozy_shopbox_' + DISP_ID;
    var SRC = 'https://quickcast.co.kr/adSbox/sbox.js?k=' + DISP_ID;
    var MAX_H = 2000;
    var REUSE = true;   // true면 이미 소재가 있는 슬롯은 재요청하지 않는다

    // currentScript는 비동기 콜백 안에서 null이 되므로 지금 잡아둔다
    var slot = document.currentScript && document.currentScript.closest('.adloader');
    if (!slot) return;

    // 슬라이드 복귀: 이미 채워져 있으면 아무것도 하지 않는다
    if (REUSE && slot.querySelector('[data-shopbox-filled] iframe')) {
        slot.style.display = 'block';
        return;
    }

    // 진행 중이던 이전 요청 취소 (정식 id를 붙들고 있는 미완성 div 제거)
    var PENDING = window.__cozyShopboxPending;
    if (PENDING) PENDING.cancel();
    [].forEach.call(document.querySelectorAll('[id="' + BASE_ID + '"]'), function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
    });

    var div = document.createElement('div');
    div.id = BASE_ID;
    div.setAttribute('data-disp_id', DISP_ID);
    slot.prepend(div);

    var mo = new MutationObserver(function () {
        var f = div.querySelector('iframe');
        if (!f) return;
        mo.disconnect();
        window.__cozyShopboxPending = null;
        div.removeAttribute('id');                   // id 반납
        div.setAttribute('data-shopbox-filled', '1');
        sync(f);
    });
    mo.observe(div, { childList: true, subtree: true });

    window.__cozyShopboxPending = {
        cancel: function () {
            mo.disconnect();
            if (div.parentNode) div.parentNode.removeChild(div);
            window.__cozyShopboxPending = null;
        }
    };

    var lib = document.createElement('script');
    lib.src = SRC;
    lib.setAttribute('charset', 'utf-8');
    lib.async = true;
    div.appendChild(lib);

    slot.style.display = 'block';

    /* ---- 높이 동기화 ---- */
    function sync(frame) {
        var ro = null, last = 0, busy = false, dead = false, hits = 0, since = 0;

        frame.style.cssText += ';display:block;width:100%';
        frame.addEventListener('load', attach);
        attach();

        function doc() {
            try { return frame.contentDocument; } catch (e) { return null; }
        }

        // iframe을 잠깐 접어 뷰포트 바닥을 없앤 뒤 콘텐츠 실제 높이를 읽는다
        function measure() {
            var d = doc();
            if (!d || !d.body) return 0;
            d.documentElement.style.height = 'auto';
            d.body.style.cssText += ';height:auto;margin:0';

            busy = true;                             // 이 조작이 부른 콜백은 무시
            var prev = frame.style.height;
            frame.style.height = '0px';
            var h = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
            frame.style.height = prev;
            requestAnimationFrame(function () { busy = false; });
            return h;
        }

        function push() {
            if (busy || dead) return;
            if (!frame.isConnected) {                // 슬롯이 사라지면 스스로 정리
                dead = true;
                if (ro) ro.disconnect();
                window.removeEventListener('resize', onResize);
                return;
            }
            if (Date.now() - since > 1000) { hits = 0; since = Date.now(); }
            if (++hits > 30) {                       // 1초 30회 초과 = 진동으로 판단
                dead = true;
                if (ro) ro.disconnect();
                return console.warn('[shopbox] 높이 진동 감지, 동기화 중단');
            }
            var h = measure();
            if (!h || h > MAX_H || Math.abs(h - last) < 2) return;
            last = h;
            frame.height = h;
            frame.style.height = h + 'px';
        }

        function attach() {
            var d = doc();
            if (!d) return console.warn('[shopbox] 소재가 다른 도메인이라 높이를 읽을 수 없습니다');
            if (d.body && window.ResizeObserver) {
                if (ro) ro.disconnect();
                ro = new ResizeObserver(push);
                ro.observe(d.body);
            }
            push();
        }

        var t;
        function onResize() {
            clearTimeout(t);
            t = setTimeout(function () { last = 0; push(); }, 150);
        }
        window.addEventListener('resize', onResize);
    }
})();