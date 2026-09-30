(function() {
    try{
      parent.document.getElementById('ad_big').height = 200;
      parent.document.getElementById('ad_big').style.height = '200px';
    }catch(e){
      window.onload = function() {
        window.parent.postMessage({
          method: 'fnct',
          name: 'callCrossOriginAd',
          property: {
            target: window.name,
            height: 200
          }
        }, '*');
      }
    }
    try{
      google_ad_client = 'ca-pub-8710503230568572';
      google_ad_slot = '3352806123';
      google_ad_height = 200;
      google_ad_width = 320;
      google_adtest = 'off';
      google_ad_type= 'image,flash';
      google_color_bg = 'ffffff';
      google_color_border = 'ffffff';
      google_color_link = 'ffffff';
      google_encoding='utf-8';
      google_language='ko';
      google_safe='high';
      google_alternate_ad_url= location.protocol+'//cyad1.nate.com/html.kti/mnate/google@house_x01?ads_no=239905';
      document.write('<script src="'+location.protocol+'//pagead2.googlesyndication.com/pagead/show_ads.js" type="text/javascript"></script>');
    }catch(e){}
  })();