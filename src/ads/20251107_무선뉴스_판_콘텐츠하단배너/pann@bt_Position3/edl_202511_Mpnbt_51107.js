; (function () {
    var adHeight = 250;
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
    }

    ; (function () {
        document.write('<iframe width="300" height="250" src="//ad.doorigo.co.kr/cgi-bin/PelicanC.dll?impr?pageid=0GS7&out=iframe" allowTransparency = "true" marginwidth="0" marginheight="0" hspace="0" vspace="0" frameborder="0" scrolling="no" sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups allow-modals allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox" style="display:block;margin:0 auto;"></iframe>')
    })()
})()