; (function () {
    var adWidth = 300;
    var adHeight = 250;

    // top level iframe
    try {
        parent.document.getElementById('ad_big2').height = adHeight;
        parent.document.getElementById('ad_big2').style.height = adHeight + 'px';
    } catch (err) {
        window.onload = function () {
            var isNews = location.href.indexOf('news') > -1;
            var isPann = location.href.indexOf('pann') > -1;

            if (isNews) {
                window.parent.postMessage({
                    "method": "fnct",
                    "name": "callCrossOriginAd",
                    "property": { target: 'main_banner', height: adHeight }
                }, '*');
            }
            if (isPann) {
                window.parent.postMessage({
                    target: 'main_banner',
                    params: {
                        height: adHeight
                    }
                }, '*');
            }
        }
    }
    var _adArea = document.getElementById('main_banner');
    var _script = document.createElement('script');
    _script.src = 'https://ootoo.ad4989.or.kr/cou/api_reco.php?code=edlrtb02&adid=&type=js&click_log=1&load_type=1';
    
    setTimeout(function(){
        if (_adArea) {
            _adArea.style.display = 'flex';
            _adArea.style.justifyContent = 'center';
            _adArea.appendChild(_script);
        }
    }, 300)
})()