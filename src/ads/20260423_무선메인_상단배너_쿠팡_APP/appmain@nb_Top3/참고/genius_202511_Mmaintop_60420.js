(function () {
    var _currentScript = document.currentScript;
    var ua = navigator.userAgent;
    var _adid = getAgentValue("gadid", ua);
    var _style = document.createElement('style');
    function getAgentValue(key, u) {
        var su = u.split(";");
        var d;
        for (i = 0; i < su.length; i++) {
            d = su[i].split(":");
            if (d[0].toLowerCase() == key) return d[1];
        }
        return "";
    }
    if (_adid == "") _adid = "00000000-0000-0000-0000-000000000000";
    var _script = document.createElement('script');
    _script.src = '//ads.shople.kr/js/sk_doc_write_reco.js?app_code=RgNaAybdxh&app_bundleId=com.nate.android.portalmini&app_domain=&app_id=&imp_imageSize=640X300&imp_adType=2&imp_placementId=&imp_pos=1&device_id=' + _adid + '&device_lmt=0&device_ua=&device_ip=&user_puid=user_unique_id&dom_id=ad_big';

    _css = '#ad_big .head.element-to-disable-drag img {width:100% !important;}';
    _style.type = 'text/css';
    _style.appendChild(document.createTextNode(_css))

    var _adBigElement = _currentScript.closest('#ad_big');
    _adBigElement.appendChild(_script);
    _adBigElement.appendChild(_style);
    _adBigElement.style.minHeight = '135px';
})()