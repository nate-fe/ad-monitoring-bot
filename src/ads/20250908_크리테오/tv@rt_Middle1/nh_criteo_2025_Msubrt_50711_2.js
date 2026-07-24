try {
    var $ad_id = 109659;
    var $ad_width = 300;
    var $ad_height = 250;
    var $body = document.querySelector('body');
    var $wrapper = document.getElementById('ifr_main_banner');
    var $passback = 'mnate/rtb@news_Middle1';
    var $script = document.createElement('script');
    $body.style.textAlign = 'center';
    $script.type = 'text/javascript';
    $script.src = '//static.criteo.net/js/ld/publishertag.js';
    $script.async = true;
    $script.onload = function () {
        try {
            window.Criteo = window.Criteo || {}; window.Criteo.events = window.Criteo.events || [];
        } catch (err) { }
        try {
            Criteo.events.push(function () {
                var adUnits = {
                    networkId: 2399,
                    publisherId: '108926',
                    placements: [{
                        slotId: 'criteo-' + $ad_id,
                        zoneId: 109659,
                        sizes: ['300x250'],
                        ext: {
                            bidder: {
                                uid: 473812
                            },
                            floors: {
                                banner: {
                                    '300x250': {
                                        floor: 170, // set minimum price
                                        currency: 'KRW'
                                    }
                                }
                            }
                        }
                    }]
                };
                Criteo.Passback.RequestBids(adUnits, 2000);
                $wrapper.style.width = $ad_width + 'px';
                $wrapper.style.height = $ad_height + 'px';
                $wrapper.style.margin = '0 auto';
                parent.document.getElementById('m_rt_Middle1').style.height = $ad_height + 'px';
            });
        } catch (err) { }
    }

    var $div = document.createElement('div');
    $div.id = 'criteo-' + $ad_id;

    $wrapper.appendChild($script);
    $wrapper.appendChild($div);
} catch (e) { }