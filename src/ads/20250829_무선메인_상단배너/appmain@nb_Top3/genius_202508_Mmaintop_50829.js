(function () {
    try {
        var ad_container = document.querySelectorAll('#ad_big');
        ad_container.forEach(v => {
            if (!v.querySelector('iframe')) {
                var _iframe = document.createElement('iframe');
                _iframe.src = 'https://ads-partners.coupang.com/widgets.html?id=733352&template=carousel&trackingCode=AF2366072&subId=1268S142770&width=100%&height=150&tsource=';
                _iframe.setAttribute('width', '100%');
                _iframe.setAttribute('height', '150');
                _iframe.setAttribute('frameborder', '0');
                _iframe.setAttribute('scrolling', 'no');
                _iframe.setAttribute('referrerpolicy', 'unsafe-url');
                _iframe.setAttribute('browsingtopics', 'true');
                v.appendChild(_iframe);
            }
        });
    } catch (err) { console.warn(err); }
})();