(function () {
    var DISP_ID = 'NDg3Nw==', MAX_H = 2000;

    var area = document.getElementById('ifr_main_banner');
    if (!area) return;

    document.documentElement.style.height = 'auto';
    document.body.style.cssText += ';height:auto;margin:0';
    area.style.height = 'auto';

    var box = document.createElement('div');
    box.id = 'cozy_shopbox_' + DISP_ID;
    box.setAttribute('data-disp_id', DISP_ID);
    area.appendChild(box);

    var lib = document.createElement('script');
    lib.src = 'https://quickcast.co.kr/adSbox/sbox.js?k=' + DISP_ID;
    lib.setAttribute('charset', 'utf-8');
    lib.async = true;
    area.appendChild(lib);

    var frame = null, ro = null, last = 0;
    var busy = false, dead = false, hits = 0, since = 0;

    function innerDoc() {
        try { return frame.contentDocument; } catch (e) { return null; }
    }

    // iframe을 잠깐 접어 뷰포트 바닥을 없앤 뒤 콘텐츠 실제 높이를 읽는다
    function measure() {
        var doc = innerDoc();
        if (!doc || !doc.body) return Math.round(frame.getBoundingClientRect().height);

        doc.documentElement.style.height = 'auto';
        doc.body.style.cssText += ';height:auto;margin:0';

        busy = true;                       // 이 조작이 부른 옵저버 콜백은 무시
        var prev = frame.style.height;
        frame.style.height = '0px';
        var h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
        frame.style.height = prev;
        requestAnimationFrame(function () { busy = false; });
        return h;
    }

    function push() {
        if (!frame || busy || dead) return;

        if (Date.now() - since > 1000) { hits = 0; since = Date.now(); }
        if (++hits > 30) {                 // 1초 30회 초과 = 진동으로 판단
            dead = true;
            if (ro) ro.disconnect();
            return console.warn('[shopbox] 높이 진동 감지, 동기화 중단');
        }

        var h = measure();
        if (!h || h > MAX_H || Math.abs(h - last) < 2) return;
        last = h;

        var els = [frame];
        try {
            var holder = parent.document.getElementById('ifr_main_banner');
            els.push(holder, holder && holder.querySelector('iframe'));
            parent.document.body.style.backgroundColor = 'rgba(255,255,255,0)';
            els.push(parent.parent.document.getElementById('ifr_ad_shopbox'));
        } catch (e) { console.warn('[shopbox]', e); }

        els.forEach(function (el) {
            if (!el) return;
            el.height = h;
            el.style.height = h + 'px';
        });
    }

    function attach() {
        var doc = innerDoc();
        if (doc && doc.body && window.ResizeObserver) {
            if (ro) ro.disconnect();
            ro = new ResizeObserver(push);
            ro.observe(doc.body);
        }
        push();
    }

    function watch() {
        var f = box.querySelector('iframe');
        if (!f || f === frame) return;
        frame = f;
        f.style.cssText += ';display:block;width:100%';
        f.addEventListener('load', attach);
        attach();
    }

    if (window.MutationObserver) {
        new MutationObserver(watch).observe(box, { childList: true, subtree: true });
    }

    var d;
    window.addEventListener('resize', function () {
        clearTimeout(d);
        d = setTimeout(function () { last = 0; push(); }, 150);
    });
})();