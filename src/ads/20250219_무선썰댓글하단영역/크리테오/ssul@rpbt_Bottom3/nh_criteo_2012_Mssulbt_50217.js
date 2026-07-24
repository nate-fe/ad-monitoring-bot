function ssulCommentAd () {
    var $ad_width = 320;
    var $ad_height = 200;
    try {
        var $zone_id = '1824600';
        var $ad_id = 'criteo-' + $zone_id

        var $script = document.createElement('script');
        $script.type = 'text/javascript';
        $script.src = '//static.criteo.net/js/ld/publishertag.js';
        $script.async = true;
        $script.onload = function () {
            window.Criteo = window.Criteo || {};
            window.Criteo.events = window.Criteo.events || [];

            Criteo.events.push(function () {
                var adUnits = {
                    placements: [
                        {
                            slotId: $ad_id,
                            zoneId: $zone_id,
                        },
                    ],
                };
                Criteo.Passback.RequestBids(adUnits, 2000);
            });

            Criteo.events.push(function () {
                Criteo.Passback.RenderAd($ad_id, function () {
                    var slotid = $ad_id;
                    var div = document.getElementById(slotid);
                    if (div) {
                        var ifr = document.createElement('iframe');
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
                        div.style.height = $ad_height + 'px';
                        setTimeout(function(){
                            var htmlcode = "<html><head></head><body><script language=javascript src=\"//cyad1.nate.com/js.kti/mnate/cri@ssul_Bottom3\"></scr" + "ipt></body></html>";
                            var ifrd = ifr.contentWindow.document;
                            ifrd.open();
                            ifrd.write(htmlcode);
                            ifrd.close();
                        }, 1000);

                    }
                });
            });
        }

        var $div = document.createElement('div');
        $div.id = $ad_id;
        $div.style.height = $ad_height + 'px';

        setTimeout(function(){
            document.getElementById('banner_comment').appendChild($script);
            document.getElementById('banner_comment').appendChild($div);
        }, 100)
    } catch (err) { }
}