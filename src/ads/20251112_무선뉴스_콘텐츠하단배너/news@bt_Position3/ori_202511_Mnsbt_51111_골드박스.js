(function () {
    try { if (!CyadLib) var CyadLib = {}; CyadLib.hasOwnProperty("prefixUrl") || (CyadLib.prefixUrl = function (t) { var r = location.protocol; return /^http[s]?:/.test(r) && (t = t.replace(/http:/g, r).replace(/https:/g, r)), /^\/\/\w+?/.test(t) && (t = r + t), /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, r + "//").replace(/https\/\//g, r + "//")), t }) } catch (t) { }

    var bgcolor = '#ffea3d';
    var img_path = CyadLib.prefixUrl('https://adimg.nate.com/img/2025/04/cp/cp_a_0421_640x400_ffea3d.png');	//이미지 소재 경로
    var click_path = CyadLib.prefixUrl('http://cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#');
    var alt_text = '광고';
    var adsEl = '<a href="' + click_path + '" style="display:block; background:' + bgcolor + ';" target="_top"><img alt="' + alt_text + '" src="' + img_path + '" width="320" height="200"></a>';
    try {
        parent.document.getElementById('ifr_ad_bottom').height = 200;
        parent.document.getElementById('ifr_ad_bottom').style.height = '200px';
    } catch (e) {
        window.onload = function () {
            var isNews = location.href.indexOf('news') > -1;
            var isPann = location.href.indexOf('pann') > -1;
            if (isNews) {
                window.parent.postMessage({
                    "method": "fnct",
                    "name": "callCrossOriginAd",
                    "property": { target: window.name, height: 200 }
                }, '*');
            }
            if (isPann) {
                window.parent.postMessage({
                    target: 'ifr_ad_bottom',
                    params: {
                        height: 200
                    }
                }, '*');
            }
        }
    }
    document.write(adsEl);
})();