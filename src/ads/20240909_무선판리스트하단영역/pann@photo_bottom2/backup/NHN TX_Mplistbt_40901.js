(function() {
    var _div = document.createElement('div');
    var adBoxText = document.querySelector('.ad_box_text');    
    var _script = document.createElement('script');
    var _data = new Object();
    var _ua = navigator.userAgent;
    var _app_name = "nate_app";
    
    _div.id = 'pannBottomAd';

    _script.src = 'https://ssp.igaw.io/sdk/apsspads.js';
    _script.async = true;

    adBoxText.appendChild(_script);
    adBoxText.appendChild(_div)

    function checkMobile() {
        var _mobileType = navigator.userAgent.toLowerCase();
        if (_mobileType.indexOf('android') > -1) {
            return 'aos'
        } else if (_mobileType.indexOf('iphone') > -1 || _mobileType.indexOf('ipad') > -1 || _mobileType.indexOf('ipod') > -1) {
            return 'ios';
        } else {
            return 'pc';
        }
    }
    function getAdid(u) {
        var su = u.split(";");
        var d;
        for (i=0; i < su.length; i++) {
        d = su[i].split(":");
        if (d[0].toLowerCase() == "gadid") return d[1];
        }
        return "";
    }
    function getRef(u) {
        var su = u.split(";");
        var d;
        for (i=0; i < su.length; i++) {
            d = su[i].split(":");
            if (d[0].toLowerCase() == "ref") return d[1];
        }
        return "";
    }
    var valueOfMobileType = checkMobile();
    var adid = getAdid(_ua); 
    var valueOfAdid;
    if (getRef(_ua) == _app_name) {
        _data["channel"] = "app";
        if (/Android/i.test(_ua)) {
            _data["gaid"] = adid;
            valueOfAdid = _data["gaid"];
        } else if (/Mac OS/i.test(_ua)){
            _data["idfa"] = adid;
            valueOfAdid = _data["idfa"];
        }
    } else {
        _data["channel"] = "web";
        valueOfAdid = '00000000-0000-0000-0000-000000000000';
    }

    _script.onload = function() {
        window.apsspads = window.apsspads || { cmd: [] }; 
        apsspads.cmd.push(function() {
            apsspads.setConfig({ 
                pubId: "TEST_APP_KEY",  // 애드팝콘 앱키
                adid: valueOfAdid,
            });
            apsspads.defineAdUnits({
                code: "pannBottomAd",  // 광고 노출 영역 (HTML Element)의 Id (광고 게재 위치 지정 참고)
                plcmtId: valueOfMobileType === 'aos' ? 'Nate_Pann_Bottom_WebBanner_Android-N256497692' : 'Nate_Pann_Bottom_WebBanner_iOS-N256497692',  // 애드팝콘 지면 Id
                size: [300, 250],  // 크기 (네이티브 광고일 경우 정의하지 않습니다)
            });
            apsspads.addEventListener("error", function(obj) { // 광고 미 노출 시 호출
				// providerName: 광고 미 노출 공급자명
				// code: 광고 노출 영역 (HTML Element)의 Id
				// stat: 에러 코드 (0: error (invalid ad unit id, ...), 2: no ad, 3: timeout)
				console.log(obj); // {providerName: "apssp|nam", code: "div-1", stat: 2}
			});
            apsspads.requestBids(); // 광고 요청
        });
        console.log('test')
    }
    
  })();