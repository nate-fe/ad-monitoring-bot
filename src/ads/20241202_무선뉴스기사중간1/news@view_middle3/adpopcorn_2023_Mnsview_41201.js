var app_name = "nate_app";
var ua = navigator.userAgent;

// 광고 호출
var script = document.createElement("script");
script.src = "https://ssp.igaw.io/sdk/apsspads.js";
//script.async = true;


document.head.appendChild(script);

var cur_div = document.querySelector("#ad_innerView");
var ad_div = document.createElement("div");
var _ad_div_id = "ad_div_" + Date.now();
var _adid = getAgentValue("gadid", ua);
ad_div.id = _ad_div_id;
cur_div.appendChild(ad_div);

var _pubId = isAOS() ? "478759775" : "491772030";
var _plcmtId = isAOS() ? "3pCvQcNM15xRjUW" : "pxsho3U1IkhVREY";
var _adUnitId = isAOS() ? "Nate_News_TOP_WebBanner_Android-N256497692" : "Nate_News_TOP_WebBanner_iOS-N256497692";

function getAgentValue(key, u) {
    var su = u.split(";");
    var d;
    for (i = 0; i < su.length; i++) {
        d = su[i].split(":");
        if (d[0].toLowerCase() == key) return d[1];
    }
    return "";
}

function isAOS() {
    if (/Android/i.test(ua)) return true;
    return false;
}

window.apsspads = window.apsspads || { cmd: [] };
if (_adid == "") _adid = "00000000-0000-0000-0000-000000000000";

// 앱
if (getAgentValue("ref", ua) == app_name) {

    console.log("광고 노출  adid:" + _adid);
    apsspads.cmd.push(function () {
        if (isAOS()) {
            console.log("AOS");
            apsspads.setConfig({ pubId: _pubId, nam: true, adid: _adid }); // 애드팝콘 앱키
            apsspads.defineAdUnits({
                code: _ad_div_id,  // 광고 노출 영역 (HTML Element)의 Id (광고 게재 위치 지정 참고)
                plcmtId: _plcmtId,  // 애드팝콘 지면 Id
                fallback: {
                    nam: {
                        adUnitId: _adUnitId
                    }
                }
            });
        } else {
            console.log("iOS");
            apsspads.setConfig({ pubId: _pubId, nam: true, adid: _adid }); // 애드팝콘 앱키
            apsspads.defineAdUnits({
                code: _ad_div_id,  // 광고 노출 영역 (HTML Element)의 Id (광고 게재 위치 지정 참고)
                plcmtId: _plcmtId,  // 애드팝콘 지면 Id
                fallback: {
                    nam: {
                        adUnitId: _adUnitId
                    }
                }
            });
        }
        apsspads.addEventListener("error", function (obj) { // 광고 미 노출 시 호출
            // providerName: 광고 미 노출 공급자명
            // code: 광고 노출 영역 (HTML Element)의 Id
            // stat: 에러 코드 (0: error (invalid ad unit id, ...), 2: no ad, 3: timeout)
            console.log(obj); // {providerName: "apssp|nam", code: "div-1", stat: 2}
            cur_div.remove();
        });
        apsspads.requestBids(); // 광고 요청
    });

}
// 웹
else {

    apsspads.cmd.push(function () {
        apsspads.setConfig({ pubId: _pubId, nam: true, adid: _adid }); // 애드팝콘 앱키
        apsspads.defineAdUnits({
            code: _ad_div_id,  // 광고 노출 영역 (HTML Element)의 Id (광고 게재 위치 지정 참고)
            plcmtId: _plcmtId,  // 애드팝콘 지면 Id
            fallback: {
                nam: {
                    adUnitId: _adUnitId
                }
            }
        });
        apsspads.addEventListener("error", function (obj) { // 광고 미 노출 시 호출
            // providerName: 광고 미 노출 공급자명
            // code: 광고 노출 영역 (HTML Element)의 Id
            // stat: 에러 코드 (0: error (invalid ad unit id, ...), 2: no ad, 3: timeout)
            console.log(obj); // {providerName: "apssp|nam", code: "div-1", stat: 2}
            cur_div.remove();
        });
        apsspads.requestBids(); // 광고 요청
    });
}