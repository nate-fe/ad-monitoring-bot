(function () {
    try {
        var adHeight = 200;
        var _div = document.createElement('div');
        var _script = document.createElement('script');
        var _mainBanner = document.getElementById('main_banner');
        _div.setAttribute('name', 'today_ad');
        _div.setAttribute('id', 'today_ad');
        _div.style.width = '320px';
        _div.style.minHeight = '200px';
        _div.style.maxHeight = '200px';
        _div.style.margin = '0 auto';
        _script.src = '//ads.shople.kr/js/today_doc_write.js?app_code=1NPezMeFv8&tsource=www.nate.com&width=100%&height=200&dom_id=today_ad'

        _div.appendChild(_script);
        _mainBanner.appendChild(_div);

        // ad_big 높이 조정
        parent.document.getElementById('ad_big').height = adHeight;
        parent.document.getElementById('ad_big').style.height = adHeight + 'px';
        window.parent.postMessage({
            target: 'ad_big',
            params: {
                height: adHeight
            }
        }, '*');
    } catch (err) { consolw.warn(err) }
})();
