try { if (!CyadLib) var CyadLib = {}; CyadLib.hasOwnProperty("prefixUrl") || (CyadLib.prefixUrl = function (t) { var r = location.protocol; return /^http[s]?:/.test(r) && (t = t.replace(/http:/g, r).replace(/https:/g, r)), /^\/\/\w+?/.test(t) && (t = r + t), /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, r + "//").replace(/https\/\//g, r + "//")), t }) } catch (t) { }

var bgcolor = '#f8f8f8';
var img_path = CyadLib.prefixUrl('https://adimg.nate.com/img/2025/05/cp/cp_google_0509_300x250.png');	//이미지 소재 경로
var alt_text = '광고';
var adsEl = '<a href="//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#" style="background:' + bgcolor + '" target="_top"><img alt="' + alt_text + '" src="' + img_path + '" width="300" height="250"></a>';
try {
    var target = document.getElementById('ad_innerView2');
    var _css = '#ad_innerView2{width:300px;height:auto;text-align:center;margin:0 auto;position:relative;}.ad_inner_view_box2{position:absolute;top:0;left:0;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}'
        , _style = document.createElement('style');
    _style.type = 'text/css';
    _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
    target.innerHTML = adsEl;
    var _adBox = document.createElement('div');
    _adBox.innerHTML = 'AD';
    _adBox.setAttribute('class', 'ad_inner_view_box2');
    target.appendChild(_style);
    target.appendChild(_adBox);
} catch (e) {
    document.write(adsEl);
}
