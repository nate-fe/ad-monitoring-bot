(function () {
    try { if (!CyadLib) var CyadLib = {}; CyadLib.hasOwnProperty("prefixUrl") || (CyadLib.prefixUrl = function (t) { var r = location.protocol; return /^http[s]?:/.test(r) && (t = t.replace(/http:/g, r).replace(/https:/g, r)), /^\/\/\w+?/.test(t) && (t = r + t), /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, r + "//").replace(/https\/\//g, r + "//")), t }) } catch (t) { }

    var $ad_container = document.getElementById('adContainer');
    var $ad_layer2 = document.getElementById('ad_layer2');
    var $ad_id = 'criteo-1575878';

    var $script = document.createElement('script');
    $script.type = 'text/javascript';
    $script.src = CyadLib.prefixUrl('https://static.criteo.net/js/ld/publishertag.standalone.js');
    $script.async = true;

    var $div = document.createElement('div');
    $div.id = $ad_id;

    var $done = false;
    $script.onload = $script.onreadystatechange = function () {
        if (!$done && (!this.readyState ||
            this.readyState === 'loaded' || this.readyState === 'complete')) {
            $done = true;
            getAds($done);

            $script.onload = $script.onreadystatechange = null;
        }
    };

    var getAds = function (bool) {
        if (bool) {
            try {
                window.Criteo = window.Criteo || {}; window.Criteo.events = window.Criteo.events || [];
            } catch (e) { console.log(e) }

            function renderCriteo(json) {
                // Custom function to render the native ad.
                console.log(json)
                var div = document.getElementById($ad_id);
                var htmlcode = '';
                var products_count = 1;
                htmlcode += '<div style="position:absolute;right:0;top:0;">';
                htmlcode += '<a href="' + json.privacy.optout_click_url + '" target="_blank">';
                htmlcode += '<img src="https://static.criteo.net/flash/icon/privacy_small.svg" onmouseover="this.src=\'https://static.criteo.net/flash/icon/adchoices_en.svg\'" onmouseout="this.src=\'https://static.criteo.net/flash/icon/privacy_small.svg\'" alt="adchoice" />';
                htmlcode += '</a>';
                htmlcode += '</div>';
                htmlcode += '<div style="padding:19px 15px;">';
                for (var i in json.products) {
                    if (i >= products_count) break;
                    htmlcode += '<div style="height:192px;">';
                    htmlcode += '<a href="' + json.products[i].click_url + '" target="_blank" style="display:block;height:100%;">';
                    htmlcode += '<span style="float:left;width:150px;height:192px;margin-right:20px;font-size:0;text-align:center;line-height:192px;overflow:hidden;">';
                    htmlcode += '<img src="' + json.products[i].image.url + '" style="max-width:100%;max-height:100%;vertical-align:middle;" alt="' + json.products[i].title + '" />';
                    htmlcode += '</span>';
                    htmlcode += '<span>';
                    htmlcode += '<strong style="display:block;display:-webkit-box;padding-top:30px;overflow:hidden;text-overflow:ellipsis;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-wrap:break-word;line-height:1.2em;height:2.4em;font-size:15px;color:#222;">' + json.products[i].title + '</strong>';
                    htmlcode += '<span style="display:block;margin:12px 0;min-height:22px;font-size:15px;color:#ae0000;">' + json.products[i].price + '</span>';
                    htmlcode += '<span style="display:block;margin:44px 0 0;font-size:13px;color:#118eff;">클릭하기</span>';
                    htmlcode += '</span>';
                    htmlcode += '</a>';
                    htmlcode += '<a href="' + json.advertiser.logo_click_url + '" target="_blank" style="position:absolute;left:186px;bottom:80px;font-size:13px;color:#a3a3a3;">' + json.advertiser.domain + '</a>';
                    htmlcode += '</div>';
                }
                htmlcode += '</div>';
                for (i in json.impression_pixels) {
                    htmlcode += '<img src="' + json.impression_pixels[i].url + '" width="0px" height="0px" style="display:none" >';
                }
                div.innerHTML = htmlcode;
                div.style.display = 'block';
                div.style.position = 'absolute';
                div.style.width = '100%';
                div.style.height = '100%';
                div.style.left = 0;
                div.style.top = 0;
            }

            var adUnits = {
                "networkId": 1669,
                "publisherId": 108924,
                "placements": [
                    {
                        "slotid": $ad_id,
                        "zoneId": 1575878,
                        "sizes": ['2x2'],
                        "nativeCallback": function (assets) {
                            console.log(assets)
                        },
                        "ext": {
                            "bidder": {
                                "uid": 466544
                            },
                            "floors": {
                                "banner": {
                                    "2x2": {
                                        "floor": 300,
                                        "currency": "KRW"
                                    }
                                }
                            }
                        }
                    }
                ]
            }
            try {
                Criteo.events.push(function () {
                    Criteo.Passback.RequestBids(adUnits, 3000);
                });
            } catch (err) {
            }
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
    }

    $ad_container.appendChild($script);
    $ad_layer2.appendChild($div);
}())