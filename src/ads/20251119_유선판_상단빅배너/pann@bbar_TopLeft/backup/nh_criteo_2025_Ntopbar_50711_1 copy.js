(function () {
    try {
        forceAdHeight();
        var $ad_frame = parent.document.querySelector('#ad_sponsorIfr');
        var $ad_width = '970';
        var $ad_height = '120';
        var $ad_wrap = document.getElementById('adWrap');
        var $ad_id = 'criteo-1751240'
        $ad_frame.setAttribute('height', $ad_height);
        $ad_frame.style.height = $ad_height + 'px';
        $ad_frame.style.minHeight = $ad_height + 'px';
        console.log('this')
        var $script = document.createElement('script');
        $script.type = 'text/javascript';
        $script.src = '//static.criteo.net/js/ld/publishertag.js';
        $script.async = true;

        var $div = document.createElement('div');
        $div.id = $ad_id;
        console.log($ad_frame);


        $script.onload = function () {
            forceAdHeight();
            window.Criteo = window.Criteo || {}; window.Criteo.events = window.Criteo.events || [];
            console.log('criteo')
            Criteo.events.push(function () {
                var adUnits = {
                    networkId: 1669,
                    publisherId: '108925',
                    placements: [{
                        slotId: $ad_id,
                        zoneId: 1751240,
                        sizes: ['970x120'],
                        ext: {
                            bidder: {
                                uid: 466545
                            },
                            floors: {
                                banner: {
                                    '970x120': {
                                        floor: 400, // set minimum price
                                        currency: 'KRW'
                                    }
                                }
                            }
                        }
                    }]
                };
                console.log(adUnits)
                Criteo.Passback.RequestBids(adUnits, function () {
                    console.log('criteo................')
                }, 3000);
            });

            Criteo.events.push(function () {
                Criteo.Passback.RenderAd($ad_id, function () {
                    var slotid = $ad_id;
                    var div = document.getElementById(slotid);
                    console.log('pannback')
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
                            ifr.setAttribute("width", $ad_width),
                            ifr.setAttribute("height", $ad_height);
                        div.appendChild(ifr);
                        var htmlcode = '<html><head></head><body><script language=javascript src="//cyad1.nate.com/js.kti/nate/pannback@bbar_TopLeft"></scr' + "ipt></body></html>";
                        var ifrd = ifr.contentWindow.document;
                        ifrd.open();
                        // ifrd.write(htmlcode);
                        ifrd.close();
                    }
                });
            });
        }

        console.log($ad_height)
        $ad_wrap.appendChild($script);
        $ad_wrap.appendChild($div);
    } catch (e) { }

    function forceAdHeight() {
        try {
            var $ad_frame = parent.document.querySelector('#ad_sponsorIfr');
            if ($ad_frame) {
                $ad_frame.setAttribute('height', '120');
                $ad_frame.style.height = '120px';
                $ad_frame.style.minHeight = '120px';
                console.log($ad_frame);
            }
        } catch (e) { }
    }
})();
