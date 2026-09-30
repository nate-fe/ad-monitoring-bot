(function() {
    var _adWidth = 300;
    var _adHeight = 250;
    // 4초 이후에도 광고가 미노출될 경우
    var TIMEOUT = 4000;
    var googleAlternateAdUrl = location.protocol + '//cyad1.nate.com/html.kti/nate/google@house_x07';

    setTimeout(function() {
        // 이미 패스백이 떠 있으면 중복 방지
        if (document.querySelector('iframe[src*="cyad1.nate.com"]')) return;
    
        var host = document.querySelector('div[id^="aswift_"][id$="_host"]');
        var url = googleAlternateAdUrl;

        var empty =
          !host ||
          (host.children.length === 0 &&
          !(host.shadowRoot && host.shadowRoot.children.length > 0));
    
        if (!empty) return;
    
        var target = host ? host.parentNode : document.body;
    
        var ifr = document.createElement('iframe');
        ifr.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'r=' + (+new Date());
        ifr.width  = _adWidth;
        ifr.height = _adHeight;
        ifr.setAttribute('frameBorder', '0');
        ifr.setAttribute('scrolling', 'no');
        ifr.setAttribute('marginwidth', '0');
        ifr.setAttribute('marginheight', '0');
        ifr.style.cssText = 'display:block;border:0;width:' + _adWidth + 'px;height:' + _adHeight + 'px;';
    
        target.innerHTML = '';
        target.appendChild(ifr);
      }, TIMEOUT);
    try{
      var _script = document.createElement('script');
      _script.src = '//pagead2.googlesyndication.com/pagead/show_ads.js';
      _script.type = 'text/javascript';
      document.head.appendChild(_script);
      google_ad_client = 'ca-pub-8710503230568572';
      google_ad_slot = '7783204402';
      google_ad_height = _adHeight;
      google_ad_width = _adWidth;
      google_adtest = 'off';
      google_ad_type= 'image,flash';
      google_color_bg = 'ffffff';
      google_color_border = 'ffffff';
      google_color_link = 'ffffff';
      google_encoding='euc-kr';
      google_language='ko';
      google_safe='high';
      google_page_url = location.protocol + '//news.nate.com';
      google_alternate_ad_url=googleAlternateAdUrl;
    }catch(err){}
})();
