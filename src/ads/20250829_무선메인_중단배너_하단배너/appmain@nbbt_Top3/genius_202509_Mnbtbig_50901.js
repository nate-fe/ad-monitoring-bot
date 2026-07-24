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
        iframe.src = 'https://ads-partners.coupang.com/widgets.html?id=733352&template=carousel&trackingCode=AF2366072&subId=1268S144860&width=640&height=500&tsource=www.nate.com';
        document.body.appendChild(iframe);
    } catch (err) { }
})();