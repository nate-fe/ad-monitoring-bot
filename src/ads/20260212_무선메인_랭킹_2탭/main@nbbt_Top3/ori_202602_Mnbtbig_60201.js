(function () {
    var ad_height = 250;
    try{
      var script = document.createElement('script');
      script.src = '//ads-partners.coupang.com/g.js';
      script.onload = function() {
        new PartnersCoupang.G( {"id":960023,"template":"carousel","trackingCode":"AF9171094","subId":"natefive","width":"320","height":"250","tsource":""});
      }
      var myFrame = window.frameElement; 
      if (myFrame && myFrame.name === "ad_small") {
          myFrame.height = ad_height;
      }
      document.getElementById('top_main_banner').appendChild(script);
    }catch(err){consolw.warn(err)}
  })();
  