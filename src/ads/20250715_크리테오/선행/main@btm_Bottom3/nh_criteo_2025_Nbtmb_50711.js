(function () {
    var $ad_id = 'criteo-471211'
    var $ad_width = 728;
    var $ad_height = 90;

    var adArea = document.querySelector('.area_ad09');

    try {
        var $script = document.createElement('script');
        $script.type = 'text/javascript';
        $script.src = '//static.criteo.net/js/ld/publishertag.js';
        $script.async = true;

        var $div = document.createElement('div');
        $div.id = $ad_id;

        $script.onload = function () {
            window.Criteo = window.Criteo || {}; window.Criteo.events = window.Criteo.events || [];

            Criteo.events.push(function () {
                var adUnits = {
                    'networkId': 1669,
                    'publisherId': '108926',
                    'placements': [{
                        'slotid': $ad_id,
                        'zoneId': 1830972,
                        'sizes': ['728x90'],
                        'ext': {
                            'bidder': {
                                'uid': 471211
                            },
                            'floors': {
                                'banner': {
                                    '728x90': {
                                        'floor': 230,
                                        'currency': 'KRW'
                                    }
                                }
                            }
                        }
                    }],
                    'pbt_debug':1
                };
                Criteo.Passback.RequestBids(adUnits, 2000);
            });

            Criteo.events.push(function () {
                Criteo.Passback.RenderAd($ad_id, function () {
                    var slotid = $ad_id;
                    var div = document.getElementById(slotid);
                    if (div) {
                        var ifr = document.createElement('iframe');
                        ifr.setAttribute('id', slotid + '_iframe'),
                            ifr.setAttribute('frameborder', '0'),
                            ifr.setAttribute('allowtransparency', 'true'),
                            ifr.setAttribute('hspace', '0'),
                            ifr.setAttribute('marginwidth', '0'),
                            ifr.setAttribute('marginheight', '0'),
                            ifr.setAttribute('scrolling', 'no'),
                            ifr.setAttribute('vspace', '0'),
                            ifr.setAttribute('width', $ad_width),
                            ifr.setAttribute('height', $ad_height);
                        div.appendChild(ifr);
                        var htmlcode = '<html><head></head><body><script language=javascript src="//cyad1.nate.com/js.kti/nate/cri@back_Bottom1"></scr' + 'ipt></body></html>';
                        var ifrd = ifr.contentWindow.document;
                        ifrd.open();
                        ifrd.write(htmlcode);
                        ifrd.close();
                    }
                });
            });
        }

        adArea.appendChild($script);
        adArea.appendChild($div);
    } catch (e) { console.warn(e) }
})();


// 아예 iframe 만들어서 주입시키기.. 안 되네
// (function () {
//     try {
//         var adArea = document.querySelector('.area_ad09');
//         var $ad_width = 728;
//         var $ad_height = 90;
//         var $ad_id = 466556;
//         var $passback = 'nate/cri@back_Bottom1';
//         var _iframe = document.createElement('iframe');
//         _iframe.setAttribute("id", $ad_id + "_iframe"),
//         _iframe.setAttribute("frameborder", "0"),
//         _iframe.setAttribute("allowtransparency", "true"),
//         _iframe.setAttribute("hspace", "0"),
//         _iframe.setAttribute("marginwidth", "0"),
//         _iframe.setAttribute("marginheight", "0"),
//         _iframe.setAttribute("scrolling", "no"),
//         _iframe.setAttribute("vspace", "0"),
//         _iframe.setAttribute("width", $ad_width),
//         _iframe.setAttribute("height", $ad_height);
//         adArea.appendChild(_iframe);
        
//         var htmlcode = `
//         <html>
//         <head>
//         <script type='text/javascript' src='//static.criteo.net/js/ld/publishertag.js' async></script>
//         </head>
//         <body>
//         <script>
//         window.Criteo = window.Criteo || {};
//         window.Criteo.events = window.Criteo.events || [];
//         </script>
//         <script>
//             (function () {
//             try {
//                 Criteo.events.push(function () {
//                     var adUnits = {
//                         'networkId': 1669,
//                         'publisherId': '108926',
//                         'placements': [{
//                             'slotid': 'criteo-${$ad_id}',
//                             'zoneId': 1830756,
//                             'sizes': ['2x2'],
//                             'ext': {
//                                 'bidder': {
//                                     'uid': ${$ad_id}
//                                 },
//                                 'floors': {
//                                     'native': {
//                                         '2x2': {
//                                             'floor': 230,
//                                             'currency': 'KRW'
//                                         }
//                                     }
//                                 }
//                             },
//                             'nativeCallback': function (assets) {
//                                 // Custom function to render the native ad.
//                             }
//                         }]
//                     };
//                     Criteo.Passback.RequestBids(adUnits, 2000);
//                 });
//             } catch (err) { }
//         })();
//         </script>
//         <div id="criteo-${$ad_id}"></div>
//         <script type='text/javascript'>
//             Criteo.events.push(function () {
//                 Criteo.Passback.RenderAd("criteo-${$ad_id}", function () {
//                 });
//             });
//         </script>
//         </body>
//         </html>
//         `;
//         var ifrd = _iframe.contentWindow.document;
//         ifrd.open();
//         ifrd.write(htmlcode);
//         ifrd.close();
        
        

//     } catch (err) { console.warn(err) }
// })();



// 7/22 미노출
//   (function () {
//     var $ad_id = 'criteo-466556'
//     var $ad_width = 728;
//     var $ad_height = 90;

//     var adArea = document.querySelector('.area_ad09');

//     try {
//         var $script = document.createElement('script');
//         $script.type = 'text/javascript';
//         $script.src = '//static.criteo.net/js/ld/publishertag.js';
//         $script.async = true;

//         var $div = document.createElement('div');
//         $div.id = $ad_id;

//         $script.onload = function () {
//             window.Criteo = window.Criteo || {};
//             window.Criteo.events = window.Criteo.events || [];

//             Criteo.events.push(function () {
//                 var adUnits = {
//                     'networkId': 1669,
//                     'publisherId': '108926',
//                     'placements': [{
//                         'slotid': $ad_id,
//                         'zoneId': 1830756,
//                         'sizes': ['2x2'],
//                         'ext': {
//                             'bidder': {
//                                 'uid': 466556
//                             },
//                             'floors': {
//                                 'native': {
//                                     '2x2': {
//                                         'floor': 230,
//                                         'currency': 'KRW'
//                                     }
//                                 }
//                             }
//                         },
//                         'nativeCallback': function (assets) {
//                             // Custom function to render the native ad.
//                         }
//                     }]
//                 };
//                 Criteo.Passback.RequestBids(adUnits, 2000);
//             });

//             Criteo.events.push(function () {
//                 Criteo.Passback.RenderAd($ad_id, function () {
//                     var slotid = $ad_id;
//                     var div = document.getElementById(slotid);
//                     if (div) {
//                         var ifr = document.createElement("iframe");
//                         ifr.setAttribute("id", slotid + "_iframe"),
//                             ifr.setAttribute("frameborder", "0"),
//                             ifr.setAttribute("allowtransparency", "true"),
//                             ifr.setAttribute("hspace", "0"),
//                             ifr.setAttribute("marginwidth", "0"),
//                             ifr.setAttribute("marginheight", "0"),
//                             ifr.setAttribute("scrolling", "no"),
//                             ifr.setAttribute("vspace", "0"),
//                             ifr.setAttribute("width", $ad_width),
//                             ifr.setAttribute("height", $ad_height);
//                         div.appendChild(ifr);
//                         var htmlcode = '<html><head></head><body><script language=javascript src="//cyad1.nate.com/js.kti/nate/cri@back_Bottom1"></scr' + 'ipt></body></html>';
//                         var ifrd = ifr.contentWindow.document;
//                         ifrd.open();
//                         ifrd.write(htmlcode);
//                         ifrd.close();
//                     }
//                 });
//             });
//         }

//         adArea.appendChild($script);
//         adArea.appendChild($div);
//     } catch (e) { console.warn(e) }
// })();


