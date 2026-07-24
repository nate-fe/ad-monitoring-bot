try {
    parent.document.getElementById('ad_big').width = 320;
    parent.document.getElementById('ad_big').height = 100;
    parent.document.getElementById('ad_big').style.width = '320px';
    parent.document.getElementById('ad_big').style.height = '100px';
  } catch(e) {
    window.onload = function() {
      var isNews = location.href.indexOf('news') > -1;
      var isPann = location.href.indexOf('pann') > -1;
      if(isNews) {
        window.parent.postMessage({
          "method": "fnct",
          "name": "callCrossOriginAd",
          "property": {target: window.name, width: 320, height: 100}
        }, '*');
      }
      if(isPann) {
        window.parent.postMessage({
          target: 'ad_big',
          params: {
            height: 100
          }
        }, '*');
      }
    }
  }
  
  try{
    google_ad_client = 'ca-pub-8710503230568572';
    google_ad_slot = '8092481443';
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
  }catch(e){}