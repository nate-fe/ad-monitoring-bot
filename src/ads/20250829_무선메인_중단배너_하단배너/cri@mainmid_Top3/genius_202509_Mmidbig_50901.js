(function () {
    var ad_height = 200;
    var ad_id = '#ad_mid';
    try {
        var ifm_wrap = top.document.querySelectorAll(ad_id);
        ifm_wrap.forEach(v => {
            v.style.height = ad_height + 'px';
            var ifm = v.querySelector('iframe');
            if (ifm) {
                ifm.height = ad_height;
            }
        });
        document.getElementById('top_main_banner').style.width = '100%';
    } catch (err) { console.warn(err) }
    try {
        var _iframe = document.createElement('iframe');
        _iframe.src = '//ads-partners.coupang.com/widgets.html?id=733352&template=carousel&trackingCode=AF2366072&subId=1268S144859&width=640&height=400&tsource=www.nate.com';
        _iframe.setAttribute('width', '100%');
        _iframe.setAttribute('height', '200');
        _iframe.setAttribute('frameborder', '0');
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('referrerpolicy', 'unsafe-url');
        _iframe.setAttribute('browsingtopics', 'true');
        document.getElementById('top_main_banner').appendChild(_iframe);
    } catch (err) { console.warn(err) }
})();
