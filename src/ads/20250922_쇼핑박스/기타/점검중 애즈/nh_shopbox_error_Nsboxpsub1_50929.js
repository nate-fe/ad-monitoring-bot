try { if (!CyadLib) var CyadLib = {}; CyadLib.hasOwnProperty("prefixUrl") || (CyadLib.prefixUrl = function (t) { var r = location.protocol; return /^http[s]?:/.test(r) && (t = t.replace(/http:/g, r).replace(/https:/g, r)), /^\/\/\w+?/.test(t) && (t = r + t), /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, r + "//").replace(/https\/\//g, r + "//")), t }) } catch (t) { }

try {
  var img_path = CyadLib.prefixUrl('https://adimg.nate.com/img/2025/09/mob/mob_house02_290x763.png');	//이미지 소재 경로  
  var adsEl = '<a href="javascript:void(0);" style="cursor:default">\
  <img src="'+ img_path + '" style="width:100%;" border="0" alt="광고"></a>';
  var _currentScript = document.currentScript;
  var _adArea = _currentScript.closest('#shopitemMall');

  _adArea.innerHTML = adsEl;
} catch (e) { }