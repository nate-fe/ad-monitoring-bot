; (function () {
    var browserDetect = {
        isIE: function (userAgent) {
            userAgent = userAgent || navigator.userAgent;
            return /trident|msie/i.test(userAgent);
        },
        ieVersion: function (userAgent) {
            userAgent = userAgent || navigator.userAgent;
            var uaRules = [
                /trident\/7\.0.*rv\:([0-9\.]+).*\).*gecko$/i
                , /msie\s([0-9\.]+);.*trident\/[4-7].0/i
            ];
            var ver = 0;
            for (var i = 0; i < uaRules.length; i++) {
                var uaMatch = uaRules[i].exec(userAgent);
                if (uaMatch && uaMatch.length) {
                    ver = parseInt(uaMatch[1]);
                    break;
                }
            }
            return ver;
        }
    };
    if (browserDetect.isIE() && browserDetect.ieVersion() < 11) {
        //house
        document.write('<script src="//cyad1.nate.com/js.kti/%#publisher%#/%#section%#@%#location%#?exception_ads=%#ads_no%#" type="text/javascript" ><\/script>');
    } else {
        // google
        google_ad_client = "ca-pub-8710503230568572";
        google_ad_slot = "4509422150";
        google_ad_width = 970;
        google_ad_height = 90;
        google_page_url = location.protocol + '//news.nate.com';
        google_alternate_ad_url = location.protocol + '//cyad1.nate.com/html.kti/nate/google@house_x06';
        var script = '<script src="//pagead2.googlesyndication.com/pagead/show_ads.js"><\/script>';
        document.write(script);
    }

    try {
        parent.parent.document.querySelector('#adDiv iframe').style.height = '90px'
    } catch (e) {
        window.onload = function () {
            window.top.postMessage({
                "method": "fnct",
                "name": "callCrossOriginAd",
                "property": { target: 'ad02IFrame', height: 90 }
            }, '*');
        }
    }
})();