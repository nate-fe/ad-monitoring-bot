(function () {
    var ad_height = 250;
    var ad_id = '#ad_small';
    var sub_id = '1268S142110';
    try {
        var ifm_wrap = parent.document.querySelectorAll(ad_id);
        ifm_wrap.forEach(v => {
            var ifm = v.querySelector('iframe');
            if (ifm) {
                ifm.height = ad_height;
            }
        });
    } catch (err) { }
    try {
        var _el = document.getElementById('top_main_banner')
        var script = document.createElement('script');
        script.src = '//ads.shople.kr/js/doc_write.js?app_code=15EIX8YJlq&cnt=2&type=COUPANG_DNY_1&sub_id=' + sub_id + '&coupang_param=&use_cnt=&tsource=www.nate.com&url_action=&rpum_click=&cp_dny_id=&cp_dny_code=&width=640&height=' + ad_height;
        _el.appendChild(script);
        script.onload = function () {
            _el.querySelector('& > div').style.display = 'inline-block';
        }
    } catch (err) { }
})();