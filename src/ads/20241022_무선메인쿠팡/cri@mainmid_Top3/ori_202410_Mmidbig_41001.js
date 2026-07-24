(function () {
    try{
      var script = document.createElement('script');
      script.src = '//ads-partners.coupang.com/g.js';
      script.onload = function() {
        new PartnersCoupang.G( {"id":814354,"template":"carousel","trackingCode":"AF0776075","subId":"natefour","width":"640","height":"400","tsource":""});
      }
      document.getElementById('top_main_banner').appendChild(script);
    }catch(err){consolw.warn(err)}
  })();
  