var app_name = "nate_app";
var ua = navigator.userAgent;

function getAgentValue(key, u)
{
	var su = u.split(";");
	var d;
	for (i=0; i < su.length; i++) {
		d = su[i].split(":");
		if (d[0].toLowerCase() == key) return d[1];
	}
	return "";
}

function isAOS()
{
	if (/Android/i.test(ua)) return true;
	return false;
}

function request_passback(isApp) {
	var script = document.createElement("script");
	if (isApp) {
		script.src = "//cyad1.nate.com/js.kti/mnate/pannback@snb_Top2";
	} else {
		script.src = "//cyad1.nate.com/js.kti/mnate/pannback_w@snb_Top2";
	}
	document.body.appendChild(script);
}

if (getAgentValue("ref", ua) == app_name) {
	var adid = getAgentValue("gadid", ua);
	var ad_div_id = "ad_div_" + Date.now();
	if (adid == "") adid = "00000000-0000-0000-0000-000000000000";

	console.log("광고 노출  adid:" + adid);
	// 광고 호출
	var script = document.createElement("script");
	script.src = "https://ssp.igaw.io/sdk/apsspads.js";
	//script.async = true;


	document.head.appendChild(script);

	var cur_div = document.getElementById("ad_snb");

	var ad_div = document.createElement("div");
	ad_div.id = ad_div_id;
	cur_div.appendChild(ad_div);

	window.apsspads = window.apsspads || { cmd: [] };
	apsspads.cmd.push(function() {
		if (isAOS()) {
console.log("AOS");
			apsspads.setConfig({ pubId: "478759775", nam: true }); // 애드팝콘 앱키
			apsspads.defineAdUnits({
				code: ad_div_id,  // 광고 노출 영역 (HTML Element)의 Id (광고 게재 위치 지정 참고)
				plcmtId: "6O5fZeioeXlbV8F",  // 애드팝콘 지면 Id
				fallback: {
					nam: {
						adUnitId: "Nate_Pann_Top_Webnative_Android-N256497692"
					}
				}
			});
		} else {
console.log("iOS");
			apsspads.setConfig({ pubId: "491772030", nam: true }); // 애드팝콘 앱키
			apsspads.defineAdUnits({
				code: ad_div_id,  // 광고 노출 영역 (HTML Element)의 Id (광고 게재 위치 지정 참고)
				plcmtId: "J5eRsC0wiVYZIVB",  // 애드팝콘 지면 Id
				fallback: {
					nam: {
						adUnitId: "Nate_Pann_Top_Webnative_iOS-N256497692"
					}
				}
			});
		}
		apsspads.addEventListener("error", function(obj) { // 광고 미 노출 시 호출
			// providerName: 광고 미 노출 공급자명
			// code: 광고 노출 영역 (HTML Element)의 Id
			// stat: 에러 코드 (0: error (invalid ad unit id, ...), 2: no ad, 3: timeout)
			console.log(obj); // {providerName: "apssp|nam", code: "div-1", stat: 2}
			request_passback(true);
		});
		apsspads.requestBids(); // 광고 요청
	});

} else {
	console.log("패스백 호출");
	request_passback(false);
	// 패스백
}