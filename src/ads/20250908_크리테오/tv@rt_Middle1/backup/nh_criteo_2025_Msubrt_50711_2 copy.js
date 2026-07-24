(function () {
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
                    $wrapper.style.width = 300 + 'px';
                    $wrapper.style.margin = '0 auto';
                });
            } catch (err) { }
            try {
                Criteo.events.push(function () {
                    Criteo.Passback.RenderAd("criteo-" + $ad_id, function () {
                        var width = $ad_width,
                            height = $ad_height;
                        var slotid = "criteo-" + $ad_id;
                        var div = document.getElementById(slotid);
                        if (div) {
                            var ifr = document.createElement("iframe");
                            ifr.setAttribute("id", slotid + "_iframe"),
                                ifr.setAttribute("frameborder", "0"),
                                ifr.setAttribute("allowtransparency", "true"),
                                ifr.setAttribute("hspace", "0"),
                                ifr.setAttribute("marginwidth", "0"),
                                ifr.setAttribute("marginheight", "0"),
                                ifr.setAttribute("scrolling", "no"),
                                ifr.setAttribute("vspace", "0"),
                                ifr.setAttribute("width", '100%'),
                                ifr.setAttribute("height", height);
                            div.appendChild(ifr);
                            var htmlcode = "<html><head></head><body><script language=javascript src='//cyad1.nate.com/js.kti/" + $passback + "'></script></body></html>";
                            var ifrd = ifr.contentWindow.document;
                            ifrd.open();
                            ifrd.write(htmlcode);
                            ifrd.close();
                            ifr.onload = function () {
                                $wrapper.style.width = '100%';
                                parent.document.getElementById('m_rt_Middle1').style.height = $body.querySelector('iframe').style.height;
                            }
                        }
                    });
                });
            } catch (err) { }
        }

        var $div = document.createElement('div');
        $div.id = 'criteo-' + $ad_id;

        $wrapper.appendChild($script);
        $wrapper.appendChild($div);

    } catch (err) { console.warn(err) }
})();