(function() {
    var $ad_width = 320;
    var $ad_height = 100;
    var $zone_id = '1824600';
    var $ad_id = 'criteo-' + $zone_id
    try{
      google_ad_client = 'ca-pub-8710503230568572';
      google_ad_slot = '4003584956';
      google_ad_height = '100';
      google_ad_width = '320';
      google_adtest = 'off';
      google_ad_type= 'image,flash';
      google_color_bg = 'ffffff';
      google_color_border = 'ffffff';
      google_color_link = 'ffffff';
      google_encoding='euc-kr';
      google_language='ko';
      google_safe='high';
      google_alternate_ad_url=location.protocol+'//cyad1.nate.com/html.kti/mnate/google@house_x03';
      
      document.write('<script src="//pagead2.googlesyndication.com/pagead/show_ads.js" type="text/javascript"><\/script>');
    }catch(err){}
    try {
      var $ad_frame = parent.document.getElementById($ad_id);
      $ad_frame.style.height = $ad_height + 'px';
    } catch(err) {
      window.onload = function() {
        window.parent.postMessage({
          "method": "fnct",
          "name": "callCrossOriginAd",
          "property": {target: $ad_id, height: $ad_height}
        }, '*');
      }
    }
  })();