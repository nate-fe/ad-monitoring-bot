(function () {
    try{
      var script = document.createElement('script');
      script.src = '//ads-partners.coupang.com/g.js';
      script.onload = function() {
        new PartnersCoupang.G( {"id":960023,"template":"carousel","trackingCode":"AF9171094","subId":"natefour","width":"320","height":"200","tsource":""});
      }
      document.getElementById('top_main_banner').appendChild(script);
    }catch(err){consolw.warn(err)}
  })();
  