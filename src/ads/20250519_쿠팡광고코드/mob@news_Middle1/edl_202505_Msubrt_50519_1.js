; (function () {
    var adHeight = 250;
    var ua = navigator.userAgent;
    var _adid = getAgentValue("gadid", ua);
    function getAgentValue(key, u) {
        var su = u.split(";");
        var d;
        for (i = 0; i < su.length; i++) {
            d = su[i].split(":");
            if (d[0].toLowerCase() == key) return d[1];
        }
        return "";
    }

    if (_adid == "") _adid = "00000000-0000-0000-0000-000000000000";
    // top level iframe
    try {
        var __parent = parent.parent.document.querySelector('#ifr_ad_shopbox');
        if (__parent) {
            __parent.height = adHeight;
            __parent.style.height = adHeight + 'px';
        }
    } catch (err) {
        window.onload = function () {
            var isNews = location.href.indexOf('news') > -1;
            var isPann = location.href.indexOf('pann') > -1;

            if (isNews) {
                window.parent.postMessage({
                    "method": "fnct",
                    "name": "callCrossOriginAd",
                    "property": { target: 'ifr_ad_shopbox', height: adHeight }
                }, '*');
            }
            if (isPann) {
                window.parent.postMessage({
                    target: 'ifr_ad_shopbox',
                    params: {
                        height: adHeight
                    }
                }, '*');
            }
        }
    }

    var _parent = parent.document.querySelector('#ifr_main_banner');
    if (_parent) {
        _parent.style.height = '100%';
        var _parentIfr = parent.document.querySelector('#ifr_main_banner iframe');
        if (_parentIfr) {
            _parentIfr.style.width = '100%';
            _parentIfr.style.height = adHeight + 'px';
            _parentIfr.frameBorder = 0;
        }
    }
    var _me = document.querySelector('#ifr_main_banner');
    if (_me) {
        _me.style.width = '100%';
        _me.style.height = '100%';
        _me.style.textAlign = 'center';
        _me.style.transform = 'scale(0.893) translateY(-15px)';
    }

    ; (function () {
        document.write('<script src="https://api.ootoo.co.kr/cou/api_reco.php?code=280x2803hi&adid=&type=js&click_log=&click_type="></script>')
    })()
})()
