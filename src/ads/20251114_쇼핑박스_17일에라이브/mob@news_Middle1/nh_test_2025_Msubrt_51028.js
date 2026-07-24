(function () {
    var _adArea = document.getElementById('ifr_main_banner');

    // 반응형 높이 조절
    function changeHeight() {
        var _parent = parent.document.querySelector('#ifr_main_banner');
        var _bodyOfParent = parent.document.querySelector('body');
        var _iframeOfParent = _parent.querySelector('iframe');
        var __parent = parent.parent.document.querySelector('#ifr_ad_shopbox');
        var _iframeOfadArea = _adArea.querySelector('iframe');
        if (_parent && _iframeOfParent && __parent) {
            setTimeout(function () {
                _parent.height = _iframeOfadArea.getBoundingClientRect().height;
                _parent.style.height = _iframeOfadArea.getBoundingClientRect().height + 'px';
                _iframeOfParent.height = _iframeOfadArea.getBoundingClientRect().height;
                _iframeOfParent.style.height = _iframeOfadArea.getBoundingClientRect().height + 'px';
                __parent.height = _iframeOfadArea.getBoundingClientRect().height;
                __parent.style.height = _iframeOfadArea.getBoundingClientRect().height + 'px';
                _bodyOfParent.style.backgroundColor = 'rgba(255,255,255,0)';
            }, 100);
        }
    }

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
    _libOfUtil.src = 'https://img.mobon.net/js/common/HawkUtil.js?ver=251114000000';
    _libOfMob.src = 'https://img.mobwithad.com/ad/imgfile/js/mobwith_shopBox.js?ver=251114000000';
    _div.appendChild(_libOfUtil);
    _div.appendChild(_libOfMob);
    _adArea.prepend(_div);
    _script.innerHTML = _actionCode;
    _script.type = 'text/javascript';
    _libOfMob.onload = function () {
        _adArea.prepend(_script)
        // 반응형 높이 조절
        changeHeight();
    }
    // 이벤트리스너 resize
    window.addEventListener('resize', changeHeight)
})()