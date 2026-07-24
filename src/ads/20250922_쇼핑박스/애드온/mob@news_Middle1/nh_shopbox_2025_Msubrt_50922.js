(function () {
    var adHeight = 702;
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
        var _parentBody = parent.document.querySelector('body');
        var isNews = location.href.indexOf('news') > -1;
        if (_parentIfr) {
            _parentIfr.style.width = '100%';
            _parentIfr.style.height = adHeight + 'px';
            _parentIfr.frameBorder = 0;
        }
        // 뉴스일 경우 다크모드 대응
        if (isNews) {
            _parentBody.style.background = 'none';
        }
    }
    var _me = document.querySelector('#ifr_main_banner');
    if (_me) {
        _me.style.width = '100%';
        _me.style.height = '100%';
    }
    var _adArea = document.getElementById('ifr_main_banner');
    var _div = document.createElement('div');
    var _libOfUtil = document.createElement('script');
    var _libOfMob = document.createElement('script');
    var _script = document.createElement('script');
    var _actionCode = `
        MobWithShopBox({
            zone: "10891083", //ssp발급 지면
            width: "360",     //가로 사이즈
            height: "702",    //세로 사이즈
            auid:"",	        //모비위드 사용자 고유 식별 key
            adid:"",          //사용자 고유 식별 key(모바일)
            adType: "shopBox" //배너 형태(고정)
        });
    `;
    _libOfUtil.src = 'https://img.mobon.net/js/common/HawkUtil.js';
    _libOfMob.src = 'https://img.mobwithad.com/ad/imgfile/js/mobwith_shopBox.js';
    _div.appendChild(_libOfUtil);
    _div.appendChild(_libOfMob);
    _adArea.prepend(_div);
    _script.innerHTML = _actionCode;
    _script.type = 'text/javascript';
    _libOfMob.onload = function () {
        _adArea.prepend(_script)
    }
})()