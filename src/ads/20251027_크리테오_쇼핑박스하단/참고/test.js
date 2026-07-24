(function () {
    try {
        var $ad_id = 1785222;
        var $ad_width = 300;
        var $ad_height = 250;
        var $wrapper = document.body;
        var $passback = 'nate/cri@sbtrec2_Middle2';

        // DOM 요소 확인
        console.log('Wrapper:', $wrapper);
        if (!$wrapper) {
            console.error('Wrapper element is missing');
            return;
        }

        var $script = document.createElement('script');
        $script.type = 'text/javascript';
        $script.src = '//static.criteo.net/js/ld/publishertag.js';
        $script.async = true;

        var $div = document.createElement('div');
        $div.id = 'criteo-' + $ad_id;

        $script.onload = function () {
            console.log('Criteo SDK loaded');
            console.log('Criteo object:', window.Criteo);
            console.log('Criteo.Passback:', window.Criteo?.Passback);
            console.log('Criteo.RequestBids:', window.Criteo?.RequestBids);

            window.Criteo = window.Criteo || {};
            window.Criteo.events = window.Criteo.events || [];
            console.log('Criteo.events initialized:', window.Criteo.events);

            // RequestBids 호출
            Criteo.events.push(function () {
                try {
                    console.log('Criteo.events.push executed for RequestBids');
                    var adUnits = {
                        networkId: 1669,
                        publisherId: '108926',
                        placements: [{
                            slotId: 'criteo-' + $ad_id,
                            zoneId: 1785222,
                            sizes: ['300x250'],
                            ext: {
                                bidder: { uid: 466550 },
                                floors: {
                                    banner: {
                                        '300x250': {
                                            floor: 150,
                                            currency: 'KRW'
                                        }
                                    }
                                }
                            }
                        }]
                    };
                    console.log('Calling Passback.RequestBids with adUnits:', adUnits);
                    Criteo.Passback.RequestBids(adUnits, 3000, function (response) {
                        console.log('Passback.RequestBids callback executed, response:', response);
                        console.log('Response structure:', JSON.stringify(response, null, 2));
                        if (response && response.slots) {
                            const slot = response.slots.find(s => s.impid === 'criteo-' + $ad_id);
                            if (slot) {
                                console.log('Found slot:', slot);
                                if (slot.creative) {
                                    const div = document.getElementById('criteo-' + $ad_id);
                                    if (div) {
                                        div.innerHTML = slot.creative;
                                    }
                                }
                            } else {
                                console.log('No matching slot for impid:', 'criteo-' + $ad_id);
                            }
                        } else {
                            console.log('No valid response or slots data');
                        }
                    });
                } catch (err) {
                    console.error('Error in Passback.RequestBids:', err);
                }
            });

            // 대체로 RequestBids 테스트
            Criteo.events.push(function () {
                try {
                    console.log('Criteo.events.push executed for RequestBids (alternative)');
                    var adUnits = {
                        networkId: 1669,
                        publisherSubId: '108926',
                        slots: [{
                            slotId: 'criteo-' + $ad_id,
                            zoneId: 1785222,
                            sizes: ['300x250']
                        }],
                        placements: [{
                            slotId: 'criteo-' + $ad_id,
                            zoneId: 1785222,
                            sizes: ['300x250'],
                            ext: {
                                bidder: { uid: 466550 },
                                floors: {
                                    banner: {
                                        '300x250': {
                                            floor: 150,
                                            currency: 'KRW'
                                        }
                                    }
                                }
                            }
                        }]
                    };
                    console.log('Calling RequestBids with adUnits:', adUnits);
                    Criteo.RequestBids(adUnits, function (response) {
                        console.log('RequestBids callback executed, response:', response);
                        console.log('Response structure:', JSON.stringify(response, null, 2));
                        if (response && response.slots) {
                            const slot = response.slots.find(s => s.impid === 'criteo-' + $ad_id);
                            if (slot) {
                                console.log('Found slot:', slot);
                                if (slot.creative) {
                                    const div = document.getElementById('criteo-' + $ad_id);
                                    if (div) {
                                        div.innerHTML = slot.creative;
                                    }
                                }
                            } else {
                                console.log('No matching slot for impid:', 'criteo-' + $ad_id);
                            }
                        } else {
                            console.log('No valid response or slots data');
                        }
                    }, 3000);
                } catch (err) {
                    console.error('Error in RequestBids:', err);
                }
            });

            // RenderAd 호출
            Criteo.events.push(function () {
                try {
                    console.log('Criteo.events.push executed for RenderAd');
                    Criteo.Passback.RenderAd('criteo-' + $ad_id, function (adunit) {
                        console.log('RenderAd callback executed, adunit:', adunit);
                        var width = $ad_width,
                            height = $ad_height;
                        var slotid = 'criteo-' + $ad_id;
                        var div = document.getElementById(slotid);
                        console.log('Div for slotid:', div);
                        if (div) {
                            var ifr = document.createElement('iframe');
                            ifr.setAttribute('id', slotid + '_iframe');
                            ifr.setAttribute('frameborder', '0');
                            ifr.setAttribute('allowtransparency', 'true');
                            ifr.setAttribute('hspace', '0');
                            ifr.setAttribute('marginwidth', '0');
                            ifr.setAttribute('marginheight', '0');
                            ifr.setAttribute('scrolling', 'no');
                            ifr.setAttribute('vspace', '0');
                            ifr.setAttribute('width', width);
                            ifr.setAttribute('height', height);
                            div.appendChild(ifr);
                            var htmlcode = "<html><head></head><body><script language=javascript src='//cyad1.nate.com/js.kti/" + $passback + "'></script></body></html>";
                            var ifrd = ifr.contentWindow.document;
                            ifrd.open();
                            ifrd.write(htmlcode);
                            ifrd.close();
                        } else {
                            console.log('Div not found for slotid:', slotid);
                        }
                    });
                } catch (err) {
                    console.error('Error in RenderAd:', err);
                }
            });
        };

        $script.onerror = function () {
            console.error('Failed to load Criteo SDK from //static.criteo.net/js/ld/publishertag.js');
        };

        $wrapper.appendChild($script);
        $wrapper.appendChild($div);
    } catch (err) {
        console.error('Global error:', err);
    }
})();