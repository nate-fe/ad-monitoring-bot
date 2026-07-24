(function () {
    try {
        var script = document.createElement('script');
        script.src = '//ads-partners.coupang.com/g.js';
        script.onload = function () {
            new PartnersCoupang.G({ "id": 755773, trackingCode: 'AF0700373', subId: 'natem320x200', width: '320', height: '200', template: 'trending-keyword' });
        }
        document.getElementById('main_banner').appendChild(_script);
    } catch (err) { console.warn(err) }
})();
