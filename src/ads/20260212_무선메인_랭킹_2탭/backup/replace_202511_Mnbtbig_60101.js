(function () {
    var ad_height = 250;
    var ad_id = '#ad_small';
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
        var iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = ad_height;
        iframe.setAttribute('frameborder', 0);
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('referrerpolicy', 'unsafe-url');
        iframe.src = '//ads-partners.coupang.com/widgets.html?id=661012&template=carousel&trackingCode=AF1185740&subId=ntm640400&width=640&height=250&tsource=www.nate.com';
        document.body.appendChild(iframe);
    } catch (err) { }
})();