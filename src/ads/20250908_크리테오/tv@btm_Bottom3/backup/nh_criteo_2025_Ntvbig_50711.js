!(function () {
  var ad = '<script async="async" type="text/javascript" src="//static.criteo.net/js/ld/publishertag.js"></script>\n' +
    '<div id="criteo_slot_1526561"></div>\n' +
    '<script>\n' +
    '  !function(){\n' +
    '    var criteoZoneId = 1526561;\n' +
    '    var criteoSlotId = "criteo_slot_1526561";\n' +
    '    var passback = function () {\n' +
    '      var width = "728", height = "90";\n' +
    '      var div = document.getElementById(criteoSlotId);\n' +
    '      if (div) { var ifr = document.createElement("iframe"); ifr.setAttribute("id", criteoSlotId+"_iframe"), ifr.setAttribute("frameborder","0"), ifr.setAttribute("allowtransparency","true"), ifr.setAttribute("hspace","0"), ifr.setAttribute("marginwidth","0"), ifr.setAttribute("marginheight","0"), ifr.setAttribute("scrolling","no"), ifr.setAttribute("vspace","0"), ifr.setAttribute("width", width), ifr.setAttribute("height", height);\n' +
    '        div.appendChild(ifr);\n' +
    '        var htmlcode = "<html><head></head><body><script language=javascript src=\\"https://cyad1.nate.com/js.kti/nate/cri@tvback_Bottom3\\"><\\/script></body></html>";\n' +
    '        var ifrd = ifr.contentWindow.document; ifrd.open(); ifrd.write(htmlcode); ifrd.close(); }\n' +
    '    }\n' +
    '    var CriteoAdUnits = { "placements": [{ "slotid": criteoSlotId, "zoneid": criteoZoneId }]};\n' +
    '    window.Criteo = window.Criteo || {}; window.Criteo.events = window.Criteo.events || [];\n' +
    '    var processCdbBid = function() {\n' +
    '      var bids = Criteo.GetBidsForAdUnit(criteoSlotId);\n' +
    '      if (bids.length > 0) {\n' +
    '        var bidFound = bids[0]; Criteo.RenderAd({ bidId: bidFound.id, containerId: bidFound.impressionId });\n' +
    '      } else { passback(); }\n' +
    '    };\n' +
    '    Criteo.events.push(function() { Criteo.RequestBids(CriteoAdUnits, processCdbBid, 2000);});\n' +
    '  }();\n' +
    '</script>';
  document.write(ad);
})();