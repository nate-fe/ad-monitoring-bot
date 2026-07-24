(function () {
    var ad_height = 200;
    var ad_id = '#ad_mid';
    var sub_id = '1268S142182';
    try {
        var ifm_wrap = top.document.querySelectorAll(ad_id);
        ifm_wrap.forEach(v => {
            v.style.height = ad_height + 'px';
            var ifm = v.querySelector('iframe');
            if (ifm) {
                ifm.height = ad_height;
            }
        });
        parent.document.querySelector('#top_main_banner iframe').width = '320px';
        document.getElementById('top_main_banner').style.width = '100%';
    } catch (err) { consolw.warn(err) }
    try {
        var script = document.createElement('script');
        script.src = '//ads.shople.kr/js/doc_write.js?app_code=vOI4JK0faB&cnt=2&type=COUPANG_DNY_1&sub_id=' + sub_id + '&coupang_param=&use_cnt=&tsource=www.nate.com&url_action=&rpum_click=&cp_dny_id=&cp_dny_code=&width=320&height=' + ad_height;
        document.getElementById('top_main_banner').appendChild(script);
    } catch (err) { consolw.warn(err) }
})();
