var app_name = "nate_app";
var ua = navigator.userAgent;

// ���� ȣ��
var script = document.createElement("script");
script.src = "https://ssp.igaw.io/sdk/apsspads.js";
//script.async = true;


document.head.appendChild(script);

var cur_div = document.querySelector(".ad_box_text");
var ad_div = document.createElement("div");
var _ad_div_id = "ad_div_" + Date.now();
var _adid = getAgentValue("gadid", ua);
ad_div.id = _ad_div_id;
cur_div.appendChild(ad_div);

var _pubId = isAOS() ? "478759775" : "491772030";
var _plcmtId = isAOS() ? "Gaq1yiTjM8EVbzU" : "ZEcwhkTwIpEeJw3";
var _adUnitId = isAOS() ? "Nate_Pann_Bottom_WebBanner_Android-N256497692" : "Nate_Pann_Bottom_WebBanner_iOS-N256497692";

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

// ��
if (getAgentValue("ref", ua) == app_name) {

    console.log("���� ����  adid:" + _adid);
    apsspads.cmd.push(function () {
        if (isAOS()) {
            console.log("AOS");
            apsspads.setConfig({ pubId: _pubId, nam: true, adid: _adid }); // �ֵ����� ��Ű
            apsspads.defineAdUnits({
                code: _ad_div_id,  // ���� ���� ���� (HTML Element)�� Id (���� ���� ��ġ ���� ����)
                plcmtId: _plcmtId,  // �ֵ����� ���� Id
                fallback: {
                    nam: {
                        adUnitId: _adUnitId
                    }
                }
            });
        } else {
            console.log("iOS");
            apsspads.setConfig({ pubId: _pubId, nam: true, adid: _adid }); // �ֵ����� ��Ű
            apsspads.defineAdUnits({
                code: _ad_div_id,  // ���� ���� ���� (HTML Element)�� Id (���� ���� ��ġ ���� ����)
                plcmtId: _plcmtId,  // �ֵ����� ���� Id
                fallback: {
                    nam: {
                        adUnitId: _adUnitId
                    }
                }
            });
        }
        apsspads.addEventListener("error", function (obj) { // ���� �� ���� �� ȣ��
            // providerName: ���� �� ���� �����ڸ�
            // code: ���� ���� ���� (HTML Element)�� Id
            // stat: ���� �ڵ� (0: error (invalid ad unit id, ...), 2: no ad, 3: timeout)
            console.log(obj); // {providerName: "apssp|nam", code: "div-1", stat: 2}
        });
        apsspads.requestBids(); // ���� ��û
    });

}
// ��
else {

    apsspads.cmd.push(function () {
        apsspads.setConfig({ pubId: _pubId, nam: true, adid: _adid }); // �ֵ����� ��Ű
        apsspads.defineAdUnits({
            code: _ad_div_id,  // ���� ���� ���� (HTML Element)�� Id (���� ���� ��ġ ���� ����)
            plcmtId: _plcmtId,  // �ֵ����� ���� Id
            fallback: {
                nam: {
                    adUnitId: _adUnitId
                }
            }
        });
        apsspads.addEventListener("error", function (obj) { // ���� �� ���� �� ȣ��
            // providerName: ���� �� ���� �����ڸ�
            // code: ���� ���� ���� (HTML Element)�� Id
            // stat: ���� �ڵ� (0: error (invalid ad unit id, ...), 2: no ad, 3: timeout)
            console.log(obj); // {providerName: "apssp|nam", code: "div-1", stat: 2}
        });
        apsspads.requestBids(); // ���� ��û
    });
}