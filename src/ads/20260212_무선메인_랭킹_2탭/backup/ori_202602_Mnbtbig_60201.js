(function () {
    var ad_height = 250;
    var ad_id = '#ad_small';
    try{
      var ifm_wrap = parent.document.querySelectorAll(ad_id);
      ifm_wrap.forEach(v => {
        var ifm = v.querySelector('iframe');
        if(ifm) {
          ifm.height = ad_height;
        }
      });
    }catch(err){consolw.warn(err)}
    try{
      var script = document.createElement('script');
      script.src = '//ads-partners.coupang.com/g.js';
      script.onload = function() {
        new PartnersCoupang.G( {"id":960023,"template":"carousel","trackingCode":"AF9171094","subId":"natefive","width":"320","height":"250","tsource":""});
      }
      document.getElementById('top_main_banner').appendChild(script);
    }catch(err){consolw.warn(err)}
  })();
  