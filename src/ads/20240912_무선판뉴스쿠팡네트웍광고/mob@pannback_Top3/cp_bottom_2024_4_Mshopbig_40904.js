(function () {
    try {        
      parent.document.getElementById('ad_big').height = 200;
      parent.document.getElementById('ad_big').style.height = '200px';
    } catch(err) {console.log(err)}
    try{
      var script = document.createElement('script');
      script.src = '//ads-partners.coupang.com/g.js';
      script.onload = function() {
        new PartnersCoupang.G( {"id":802968,"template":"carousel","trackingCode":"AF9171094","subId":"natefoursub1","width":"320","height":"200","tsource":""}
        );
      }
      document.getElementById('main_banner').appendChild(script);
    }catch(err){consolw.warn(err)}
  })();
  