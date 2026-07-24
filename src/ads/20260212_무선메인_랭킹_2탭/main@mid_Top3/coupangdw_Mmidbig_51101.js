(function () {
    try {
        var adHeight = 200;
        var ua = navigator.userAgent;
        var _adid = getAgentValue("gadid", ua);
        function getAgentValue(key, u) {
            var su = u.split(";");
            var d;
            for (i = 0; i < su.length; i++) {
                d = su[i].split(":");
                if (d[0].toLowerCase() == key) return d[1];
            }
            return "";
        }
        window.parent.postMessage({
            target: 'ad_mid',
            params: {
                height: adHeight
            }
        }, '*');

        if (_adid == "") _adid = "";
        var script = document.createElement('script');
        script.src = '//ads-partners.coupang.com/g.js';
        script.onload = function () {
            new PartnersCoupang.G({ "id": 830545, "template": "carousel", "trackingCode": "AF3118407", "width": "320", "height": "200", "tsource": "", "deviceId": _adid });
        }
        var myFrame = window.frameElement; 
        if (myFrame && myFrame.name === "ad_mid") {
            myFrame.height = adHeight;
        }
        document.getElementById('top_main_banner').appendChild(script);
    } catch (err) { consolw.warn(err) }
})();
