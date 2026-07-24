(function () {
    try {
        try { if (!CyadLib) var CyadLib = {}; CyadLib.hasOwnProperty("prefixUrl") || (CyadLib.prefixUrl = function (t) { var r = location.protocol; return /^http[s]?:/.test(r) && (t = t.replace(/http:/g, r).replace(/https:/g, r)), /^\/\/\w+?/.test(t) && (t = r + t), /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, r + "//").replace(/https\/\//g, r + "//")), t }) } catch (t) { }

        var $ad_container = document.getElementById('adContainer');
        var $ad_layer2 = document.getElementById('ad_layer2');
        var $ad_id = 'criteo-1575878'

        var $script = document.createElement('script');
        $script.type = 'text/javascript';
        $script.src = CyadLib.prefixUrl('https://static.criteo.net/js/ld/publishertag.js');
        $script.async = true;

        var $div = document.createElement('div');
        $div.id = $ad_id

        $script.onload = function () {
            try {
                window.Criteo = window.Criteo || {}; window.Criteo.events = window.Criteo.events || [];
            } catch (e) { }
            try {
                function renderCriteo(json) {
                    // Custom function to render the native ad.
                    // console.log(json)
                    var div = document.getElementById($ad_id);
                    var htmlcode = '';
                    var products_count = 1;
                    htmlcode += '<div style="position:absolute;right:0;top:0;">';
                    htmlcode += '<a href="' + json.privacy.optout_click_url + '" target="_blank">'
                    htmlcode += '<img src="https://static.criteo.net/flash/icon/privacy_small.svg" onmouseover="this.src=\'https://static.criteo.net/flash/icon/adchoices_en.svg\'" onmouseout="this.src=\'https://static.criteo.net/flash/icon/privacy_small.svg\'" alt="adchoice" />';
                    htmlcode += '</a>';
                    htmlcode += '</div>';
                    htmlcode += '<div style="padding:15px 16px 14px;">';
                    for (var i in json.products) {
                        if (i >= products_count) break;
                        htmlcode += '<div style="height:160px;">';
                        htmlcode += '<a href="' + json.products[i].click_url + '" target="_blank" style="display:block;height:100%;">';
                        htmlcode += '<span style="float:left;width:150px;height:160px;margin-right:20px;font-size:0;text-align:center;line-height:160px;overflow:hidden;">';
                        htmlcode += '<img src="' + json.products[i].image.url + '" style="max-width:100%;max-height:100%;vertical-align:middle;" alt="상품 광고 이미지" />';
                        htmlcode += '</span>';
                        htmlcode += '<span>';
                        htmlcode += '<strong style="display:block;display:-webkit-box;padding-top:30px;overflow:hidden;text-overflow:ellipsis;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-wrap:break-word;line-height:1.2em;height:2.4em;font-size:15px;color:#222;">' + json.products[i].title + '</strong>';
                        htmlcode += '<span style="display:block;margin:12px 0;font-size:13px;color:#222;">' + json.products[i].price + '</span>';
                        htmlcode += '</span>';
                        htmlcode += '</a>';
                        htmlcode += '<a href="' + json.advertiser.logo_click_url + '" target="_blank" style="position:absolute;left:186px;bottom:49px;font-size:11px;color:#a3a3a3;">' + json.advertiser.domain + '</a>';
                        htmlcode += '</div>';
                    }
                    htmlcode += '</div>';
                    for (i in json.impression_pixels) {
                        htmlcode += '<img src="' + json.impression_pixels[i].url + '" width="0px" height="0px" style="display:none" >';
                    }
                    div.innerHTML = htmlcode;
                    div.style.display = 'block';
                    div.style.border = '1px solid #e2e2e2';
                    div.style.position = 'relative';

                    var countScript = document.createElement('script');
                    countScript.type = 'text/javascript';
                    countScript.src = CyadLib.prefixUrl('http://cyad1.nate.com/js.kti/nate/test2@main2_Right1');

                    $ad_layer2.appendChild(countScript);
                }
                Criteo.events.push(function () {
                    var adUnits = {
                        "placements": [
                            {
                                "slotid": $ad_id,
                                "zoneId": 1575878,
                                "nativeCallback": renderCriteo
                            }
                        ]
                    }
                    Criteo.Passback.RequestBids(adUnits, 1500);
                });
            } catch (e) { }

            try {
                Criteo.Passback.RenderAd($ad_id, function (adunit) {
                    var div = document.getElementById(adunit);
                    var script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.async = true;
                    script.src = CyadLib.prefixUrl('https://cyad1.nate.com/js.kti/nate/cri@main2_Right1');

                    $ad_container.appendChild(script);
                });
            } catch (e) { }
        }

        $ad_container.appendChild($script);
        $ad_layer2.appendChild($div);
    } catch (e) { }
})()