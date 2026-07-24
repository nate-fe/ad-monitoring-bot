(function () {
    try {
        var adHeight = 150;
        var _div = document.createElement('div');
        var _script = document.createElement('script');
        var _topMainBanner = document.getElementById('top_main_banner');
        _div.setAttribute('name', 'today_ad');
        _div.setAttribute('id', 'today_ad');
        _div.style.width = 'auto';
        _div.style.minHeight = '150px';
        _div.style.maxHeight = adHeight + 'px';
        _script.src = '//ads.shople.kr/js/today_doc_write.js?app_code=EpcL0YG50C&tsource=www.nate.com&width=100%&height=150&dom_id=today_ad'

        window.parent.postMessage({
            target: 'ad_mid',
            params: {
                height: adHeight
            }
        }, '*');

        _div.appendChild(_script);
        _topMainBanner.appendChild(_div);
    } catch (err) { consolw.warn(err) }
})();
