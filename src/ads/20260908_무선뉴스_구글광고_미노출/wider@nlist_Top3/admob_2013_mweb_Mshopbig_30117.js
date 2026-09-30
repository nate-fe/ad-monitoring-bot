(function() {
    var _adWidth = 320;
    var _adHeight = 200;
    // 3초 이후에도 광고가 미노출될 경우
    var TIMEOUT = 3000;
    var googleAlternateAdUrl = location.protocol+'//cyad1.nate.com/html.kti/mnate/google@house_x01?ads_no=239905'
    var _style = document.createElement('style');
    _style.textContent = 'ins.adsbygoogle, ins.adsbygoogle > div, ins.adsbygoogle iframe {width:100% !important;} ';
    document.head.appendChild(_style);

    setTimeout(function() {
        var host = document.querySelector('div[id^="aswift_"][id$="_host"]');

        var empty = !host || (host.innerHTML.replace(/\s/g, '') === '' && !host.shadowRoot);

        if (!empty) return;

        var target = host ? host.parentNode : document.body;
        var url = googleAlternateAdUrl;

        var f = document.createElement('iframe');
        f.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'r=' + (+new Date());
        f.width = _adWidth;
        f.height = _adHeight;
        f.setAttribute('frameBorder', '0');
        f.setAttribute('scrolling', 'no');
        f.setAttribute('marginwidth', '0');
        f.setAttribute('marginheight', '0');
        f.style.cssText = 'display:block;border:0;width:' + _adWidth + 'px;height:' + _adHeight + 'px;';

        target.innerHTML = '';
        target.appendChild(f);
    }, TIMEOUT);
    try{
      parent.document.getElementById('ad_big').height = _adHeight;
      parent.document.getElementById('ad_big').style.height = _adHeight + 'px';
    }catch(e){
      window.onload = function() {
        window.parent.postMessage({
          method: 'fnct',
          name: 'callCrossOriginAd',
          property: {
            target: window.name,
            height: _adHeight
          }
        }, '*');
      }
    }
    try{
      var _script = document.createElement('script');
      _script.src = '//pagead2.googlesyndication.com/pagead/show_ads.js';
      _script.type = 'text/javascript';
      document.head.appendChild(_script);
      google_ad_client = 'ca-pub-8710503230568572';
      google_ad_slot = '3352806123';
      google_ad_height = _adHeight;
      google_ad_width = _adWidth;
      google_adtest = 'off';
      google_ad_type= 'image,flash';
      google_color_bg = 'ffffff';
      google_color_border = 'ffffff';
      google_color_link = 'ffffff';
      google_encoding='utf-8';
      google_language='ko';
      google_safe='high';
      google_alternate_ad_url= googleAlternateAdUrl;
    }catch(e){}
  })();