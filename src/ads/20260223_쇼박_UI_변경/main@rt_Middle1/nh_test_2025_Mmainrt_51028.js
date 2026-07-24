(function () {
    var _div = document.createElement('div');
    var _libOfUtil = document.createElement('script');
    var _libOfMob = document.createElement('script');
    var _script = document.createElement('script');
    var _currentScript = document.currentScript;
    var _adArea = _currentScript.closest('.adloader');
    var _actionCode = `
        MobWithShopBox({
    		zone: "10889653", //ssp발급 지면
    		width: "360",     //가로 사이즈
    		height: "702",    //세로 사이즈
    		auid:"",	        //모비위드 사용자 고유 식별 key
    		adid:"",          //사용자 고유 식별 key(모바일)
    		adType: "shopBox" //배너 형태(고정)
    	});


    `
    _libOfUtil.src = 'https://img.mobon.net/js/common/HawkUtil.js?ver=251114000000';
    _libOfMob.src = 'https://test.mobwithad.com/static/js/mobwith_shopBox_dev.js?ver=251114000000';
    _div.appendChild(_libOfUtil);
    _div.appendChild(_libOfMob);
    _adArea.prepend(_div);
    _script.innerHTML = _actionCode;
    _script.type = 'text/javascript';
    _libOfMob.onload = function () {
        _div.prepend(_script);
        _adArea.style.display = 'block';
    }
})()