(function () {
    try { if (!CyadLib) var CyadLib = {}; CyadLib.hasOwnProperty("prefixUrl") || (CyadLib.prefixUrl = function (t) { var r = location.protocol; return /^http[s]?:/.test(r) && (t = t.replace(/http:/g, r).replace(/https:/g, r)), /^\/\/\w+?/.test(t) && (t = r + t), /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, r + "//").replace(/https\/\//g, r + "//")), t }) } catch (t) { }

    var $wrapper = document.getElementById('ifr_main_banner');
    var $ad_id = 'criteo-1575878';
    var $height = 190;

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
                // console.log(json)
                var div = document.getElementById($ad_id);
                var htmlcode = '';
                var products_count = 1;
                var _css = '#weekly-criteo-area a, #weekly-criteo-area a:hover {text-decoration:none;} #weekly-criteo-area {text-align:left; background-color:#fff; height:192px; box-sizing:border-box; padding:26px 16px; border:1px solid #e2e2e2;}#weekly-criteo-area .criteo-item-img-wrap {height:100%; display:flex; align-items:center; overflow:hidden; position:relative;} #weekly-criteo-area .criteo-item-img-wrap a {display:block;}#weekly-criteo-area .criteo-item-link {width:100%; overflow:hidden;}#weekly-criteo-area .criteo-item-img {float:left;width:100px;height:100px;margin-right:10px;font-size:0;text-align:center;overflow:hidden;}#weekly-criteo-area .criteo-item-text {float:left;width:calc(100% - 110px);}#weekly-criteo-area .criteo-item-text-title {display:block;display:-webkit-box;overflow:hidden;text-overflow:ellipsis;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-wrap:break-word;line-height:1.2em;max-height:2.4em;font-size:14px;color:#333; text-align:left;}#weekly-criteo-area .criteo-item-text-price {display:block;text-align:left; margin-top:3px;font-size:14px;color:#ae0000;}#weekly-criteo-area .criteo-item-btn-wrap {position:absolute;left:110px;bottom:19px;}#weekly-criteo-area .criteo-item-text-domain {font-size:13px;color:#a3a3a3; text-align:left;}#weekly-criteo-area .criteo-item-btn {font-size:12px; color:#118eff; display:block; text-align:left; margin-top:5px;}',
                    _style = document.createElement('style');
                _style.type = 'text/css';
                _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));

                htmlcode += '<div style="position:absolute; right:5px; top:5px;">';
                htmlcode += '<a href="' + json.privacy.optout_click_url + '" target="_blank">';
                htmlcode += '<img src="https://static.criteo.net/flash/icon/privacy_small.svg" onmouseover="this.src=\'https://static.criteo.net/flash/icon/adchoices_en.svg\'" onmouseout="this.src=\'https://static.criteo.net/flash/icon/privacy_small.svg\'" alt="adchoice" />';
                htmlcode += '</a>';
                htmlcode += '</div>';
                htmlcode += '<div id="weekly-criteo-area">';
                for (var i in json.products) {
                    if (i >= products_count) break;
                    htmlcode += '<div class="criteo-item-img-wrap">';
                    htmlcode += '<a href="' + json.products[i].click_url + '" target="_blank" class="criteo-item-link">';
                    htmlcode += '<div class="criteo-item-img">';
                    htmlcode += '<img src="' + json.products[i].image.url + '" style="max-width:100%;max-height:100%;vertical-align:middle;" alt="' + json.products[i].title + '" />';
                    htmlcode += '</div>';
                    htmlcode += '<div class="criteo-item-text">';
                    htmlcode += '<strong class="criteo-item-text-title">' + json.products[i].title + '</strong>';
                    htmlcode += '<span class="criteo-item-text-price">' + json.products[i].price + '</span>';
                    htmlcode += '</div>';
                    htmlcode += '</a>';
                    htmlcode += '<div class="criteo-item-btn-wrap"><a href="' + json.advertiser.logo_click_url + '" target="_blank" class="criteo-item-text-domain">' + json.advertiser.domain + '</a>';
                    htmlcode += '<a href="' + json.products[i].image.url + '" target="_blank" class="criteo-item-btn">' + json.products[i].call_to_action + '</a></div>';
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
                div.appendChild(_style);
            }

            var adUnits = {
                "networkId": 1669,
                "publisherId": 108924,
                "placements": [
                    {
                        "slotid": $ad_id,
                        "zoneId": 1575878,
                        "sizes": ['2x2'],
                        "nativeCallback": renderCriteo,
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
                    $wrapper.style.height = $height + 'px';
                    parent.document.getElementById('m_rt_Middle1').style.height = $height + 'px';
                });
            } catch (err) {
            }
            try {
                Criteo.Passback.RenderAd($ad_id, function (adunit) { });
            } catch (e) { }
        }
    }

    $wrapper.appendChild($script);
    $wrapper.appendChild($div);
}())