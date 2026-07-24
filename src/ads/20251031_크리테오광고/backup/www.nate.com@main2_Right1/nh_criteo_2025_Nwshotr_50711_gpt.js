(function () {
    // DOM 요소 확인
    var $ad_container = document.getElementById('adContainer');
    var $ad_layer2 = document.getElementById('ad_layer2');
    var $ad_id = 'criteo-1575878';

    if (!$ad_container || !$ad_layer2) {
        console.error('Required DOM elements are missing, creating fallback containers');
        $ad_container = document.createElement('div');
        $ad_container.id = 'adContainer';
        document.body.appendChild($ad_container);
        $ad_layer2 = document.createElement('div');
        $ad_layer2.id = 'ad_layer2';
        $ad_container.appendChild($ad_layer2);
    }

    // Criteo SDK 로드
    var $script = document.createElement('script');
    $script.type = 'text/javascript';
    $script.src = 'https://static.criteo.net/js/ld/publishertag.standalone.js'; // 최신 SDK
    $script.async = true;

    var $div = document.createElement('div');
    $div.id = $ad_id;
    $ad_layer2.appendChild($div);

    $script.onload = function () {
        console.log('Criteo SDK loaded');
        if (!window.Criteo || !window.Criteo.RequestBids) {
            console.error('Criteo SDK or RequestBids method is not available');
            $div.innerHTML = '<div>Criteo SDK 로드 실패</div>';
            return;
        }

        window.Criteo.events = window.Criteo.events || [];

        // Native 광고 렌더링 함수
        function renderCriteo(json) {
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

        // adUnits 설정 (Native 광고 전용)
        var adUnits = {
            networkId: 1669,
            publisherId: '108924',
            placements: [{
                slotId: $ad_id,
                zoneId: 1575878,
                sizes: ['2x2'],
                nativeCallback: function (assets) {
                    console.log(assets);
                },
                ext: {
                    bidder: {
                        uid: 466544
                    },
                    floors: {
                        banner: {
                            '2x2': {
                                floor: 300, // set minimum price
                                currency: 'KRW'
                            }
                        }
                    }
                }
            }]
        };

        Criteo.events.push(function () {
            try {
                Criteo.RequestBids(adUnits, function (response) {
                    console.log('Raw response from bidder.criteo.com:', JSON.stringify(response, null, 2));
                    if (response[0].nativePayload) {
                        var _assets = response[0].nativePayload;
                        renderCriteo(_assets)
                        console.log(_assets)
                    }
                }, 3000);
            } catch (err) {
                console.error('Error in RequestBids:', err);
                $div.innerHTML = '<div>광고 로드 중 오류가 발생했습니다.</div>';
            }
        });
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
    };

    $script.onerror = function () {
        console.error('Failed to load Criteo SDK');
        $div.innerHTML = '<div>광고 SDK 로드 실패</div>';
    };

    $ad_container.appendChild($script);
    $ad_layer2.appendChild($div);
})();