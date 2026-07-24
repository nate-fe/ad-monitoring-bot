try {
    var _adWidth = 300;
    var _adHeight = 250;
    var _div = document.createElement('div');
    var _adArea = document.querySelector('#ifr_main_banner');
    try {
        var _iframe = document.createElement('iframe');
        _iframe.width = _adWidth;
        _iframe.height = _adHeight;
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('name', 'cozymangframe')
        _iframe.setAttribute('referrerpolicy', 'unsafe-url');
        _iframe.src = '//ad.planbplus.co.kr/adSb/?k=MzY2NQ==&pb=&di=&kwd=';
        _adArea.appendChild(_iframe);
        _adArea.style.textAlign = 'center';

        try {
            var isTv = location.href.indexOf('tv') > -1;
            var __parent = isTv ? parent.parent.document.querySelector('#m_rt_Middle1') : parent.parent.document.querySelector('#ifr_ad_shopbox');
            if (__parent) {
                __parent.height = _adHeight;
                __parent.style.height = _adHeight + 'px';
            }
        } catch (err) {
            window.onload = function () {
                var isTv = location.href.indexOf('tv') > -1;
                var isNews = location.href.indexOf('news') > -1;
                var isPann = location.href.indexOf('pann') > -1;

                if (isTv) {
                    window.parent.postMessage({
                        "method": "fnct",
                        "name": "callCrossOriginAd",
                        "property": { target: 'm_rt_Middle1', height: _adHeight }
                    }, '*');
                }

                if (isNews) {
                    window.parent.postMessage({
                        "method": "fnct",
                        "name": "callCrossOriginAd",
                        "property": { target: 'ifr_ad_shopbox', height: _adHeight }
                    }, '*');
                }
                if (isPann) {
                    window.parent.postMessage({
                        target: 'ifr_ad_shopbox',
                        params: {
                            height: _adHeight
                        }
                    }, '*');
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
} catch (err) {
    console.log(err);
}