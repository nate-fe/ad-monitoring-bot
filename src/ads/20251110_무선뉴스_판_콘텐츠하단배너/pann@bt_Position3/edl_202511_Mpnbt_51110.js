(function () {
    try { if (!CyadLib) var CyadLib = {}; CyadLib.hasOwnProperty("prefixUrl") || (CyadLib.prefixUrl = function (t) { var r = location.protocol; return /^http[s]?:/.test(r) && (t = t.replace(/http:/g, r).replace(/https:/g, r)), /^\/\/\w+?/.test(t) && (t = r + t), /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, r + "//").replace(/https\/\//g, r + "//")), t }) } catch (t) { }

    var bgcolor = '#ffc300';
    var img_path = CyadLib.prefixUrl('https://adimg.nate.com/img/2025/11/cp/cp_1110_640x100_ffc300.jpg');	//이미지 소재 경로
    var click_path = CyadLib.prefixUrl('http://cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#');
    var alt_text = '광고';
    var adsEl = '<a href="' + click_path + '" style="display:block; background:' + bgcolor + ';" target="_top"><img alt="' + alt_text + '" src="' + img_path + '" width="320" height="50"></a>';

    var _div = document.createElement('div');
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    _div.setAttribute('id', 'ad_area_bt_position3');
    _div.style.textAlign = 'center';

    _div.innerHTML = adsEl;
    _parent.insertBefore(_div, _currentScript);

})();