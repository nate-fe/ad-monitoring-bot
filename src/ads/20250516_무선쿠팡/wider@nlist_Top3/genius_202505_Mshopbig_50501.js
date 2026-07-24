(function () {
    var ad_height = 200;
    var ad_id = 'ad_big';
    var sub_id = '1268S142128';
    try {
        parent.document.getElementById(ad_id).height = ad_height;
        parent.document.getElementById(ad_id).style.height = ad_height + 'px';
    } catch (e) {
        window.onload = function () {
            window.parent.postMessage({
                method: 'fnct',
                name: 'callCrossOriginAd',
                property: {
                    target: window.name,
                    height: ad_height
                }
            }, '*');
        }
    }
    try {
        var _el = document.getElementById('main_banner');
        var script = document.createElement('script');
        script.src = '//ads.shople.kr/js/doc_write.js?app_code=pYk0RmzztE&cnt=2&type=COUPANG_DNY_1&sub_id=' + sub_id + '&coupang_param=&use_cnt=&tsource=www.nate.com&url_action=&rpum_click=&cp_dny_id=&cp_dny_code=&width=640&height=' + ad_height;
        _el.appendChild(script);
    } catch (e) { }
})();