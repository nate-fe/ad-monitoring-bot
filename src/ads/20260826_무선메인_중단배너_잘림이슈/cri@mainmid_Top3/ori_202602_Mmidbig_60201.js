(function () {
    try{
      var adHeight = 200;
      var script = document.createElement('script');
      script.src = '//ads-partners.coupang.com/g.js';
      script.onload = function() {
        new PartnersCoupang.G( {"id":960023,"template":"carousel","trackingCode":"AF9171094","subId":"natefour","width":"320","height":"200","tsource":""});
      }
      var myFrame = window.frameElement; 
      if (myFrame && myFrame.name === "ad_mid") {
          myFrame.height = adHeight;
      }
      // 부모의 부모 iframe (name="ad_mid")
      var _adMid = parent.frameElement;
      if (_adMid && _adMid.name === 'ad_mid') {
          _adMid.style.height = adHeight + 'px';
          _adMid.setAttribute('height', adHeight);
      }
      document.getElementById('top_main_banner').appendChild(script);
    }catch(err){consolw.warn(err)}
  })();
  