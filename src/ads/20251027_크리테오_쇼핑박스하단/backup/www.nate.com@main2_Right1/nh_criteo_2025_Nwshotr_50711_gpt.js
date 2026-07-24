(function () {
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

    var $script = document.createElement('script');
    $script.type = 'text/javascript';
    $script.src = 'https://static.criteo.net/js/ld/publishertag.standalone.js'; // 최신 SDK 사용
    $script.async = true;

    var $div = document.createElement('div');
    $div.id = $ad_id;
    $ad_layer2.appendChild($div);

    $script.onload = function () {
        console.log('Criteo SDK loaded');
        if (!window.Criteo || !window.Criteo.RequestBids) {
            console.error('Criteo SDK or RequestBids method is not available');
            return;
        }

        window.Criteo.events = window.Criteo.events || [];

        function renderCriteo(json) {
            if (!json || !json.products || !json.privacy || !json.privacy.optout_click_url) {
                console.error('Invalid or incomplete Criteo response:', json);
                return;
            }
            var div = document.getElementById($ad_id);
            if (!div) {
                console.error('Ad container not found for ID:', $ad_id);
                return;
            }
            var htmlcode = '';
            var products_count = 1;
            htmlcode += '<div class="criteo-ad-container">';
            htmlcode += '<div style="position:absolute;right:0;top:0;">';
            htmlcode += '<a href="' + json.privacy.optout_click_url + '" target="_blank">';
            htmlcode += '<img src="https://static.criteo.net/flash/icon/privacy_small.svg" onmouseover="this.src=\'https://static.criteo.net/flash/icon/adchoices_en.svg\'" onmouseout="this.src=\'https://static.criteo.net/flash/icon/privacy_small.svg\'" alt="adchoice" />';
            htmlcode += '</a>';
            htmlcode += '</div>';
            htmlcode += '<div style="padding:15px 16px 14px;">';
            for (var i in json.products) {
                if (i >= products_count) break;
                if (!json.products[i]?.click_url || !json.products[i]?.image?.url || !json.products[i]?.title || !json.products[i]?.price) {
                    console.warn('Invalid product data at index:', i);
                    continue;
                }
                htmlcode += '<div class="criteo-ad-product">';
                htmlcode += '<a href="' + json.products[i].click_url + '" target="_blank">';
                htmlcode += '<img class="criteo-ad-image" src="' + json.products[i].image.url + '" alt="상품 광고 이미지" />';
                htmlcode += '<div>';
                htmlcode += '<strong style="display:block;padding-top:10px;font-size:15px;color:#222;">' + json.products[i].title + '</strong>';
                htmlcode += '<span style="display:block;margin:12px 0;font-size:13px;color:#222;">' + json.products[i].price + '</span>';
                htmlcode += '</div>';
                htmlcode += '</a>';
                if (json.advertiser?.logo_click_url && json.advertiser?.domain) {
                    htmlcode += '<a href="' + json.advertiser.logo_click_url + '" target="_blank" style="font-size:11px;color:#a3a3a3;">' + json.advertiser.domain + '</a>';
                }
                htmlcode += '</div>';
            }
            htmlcode += '</div>';
            if (json.impression_pixels) {
                for (var i in json.impression_pixels) {
                    if (json.impression_pixels[i]?.url) {
                        htmlcode += '<img src="' + json.impression_pixels[i].url + '" width="0px" height="0px" style="display:none" >';
                    }
                }
            }
            div.innerHTML = htmlcode;
            div.style.display = 'block';
            div.style.border = '1px solid #e2e2e2';
            div.style.position = 'relative';
        }

        Criteo.events.push(function () {
            try {
                var adUnits = {
                    networkId: 1669, // 실제 값으로 교체
                    publisherId: '108924', // 실제 값으로 교체
                    placements: [{
                        slotId: $ad_id,
                        zoneId: 1575878,
                        sizes: ['2x2'],
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
                        },
                        native: true // Native 광고 명시
                    }]
                };
                console.log('Sending adUnits:', JSON.stringify(adUnits, null, 2));
                Criteo.RequestBids(adUnits, function (response) {
                    console.log('RequestBids response:', JSON.stringify(response, null, 2));
                    if (!response || !response.slots || response.slots.length === 0) {
                        console.warn('No valid ad response received');
                        return;
                    }
                    const slot = response.slots.find(s => s.impid === $ad_id);
                    if (slot && slot.native) {
                        console.log('Native ad data:', slot.native);
                        renderCriteo(slot.native);
                    } else {
                        console.warn('No matching slot or native data for impid:', $ad_id);
                    }
                }, 5000);
            } catch (err) {
                console.error('Error in RequestBids:', err);
                $div.innerHTML = '<div>광고 로드 중 오류가 발생했습니다.</div>';
            }
        });
    };

    $script.onerror = function () {
        console.error('Failed to load Criteo SDK');
        $div.innerHTML = '<div>광고 SDK 로드 실패</div>';
    };

    $ad_container.appendChild($script);
})();