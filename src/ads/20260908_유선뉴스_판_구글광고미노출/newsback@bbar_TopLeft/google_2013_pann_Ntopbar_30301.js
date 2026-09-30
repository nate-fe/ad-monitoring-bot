;(function(){    
    var _adWidth = 970;
    var _adHeight = 90;
    // 4초 이후에도 광고가 미노출될 경우
    var TIMEOUT = 4000;
    var googleAlternateAdUrl = location.protocol+'//cyad1.nate.com/html.kti/nate/google@house_x06'

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
    var browserDetect = {
        isIE: function(userAgent) {
            userAgent = userAgent || navigator.userAgent;
            return /trident|msie/i.test( userAgent );
        },
        ieVersion : function(userAgent) {
            userAgent = userAgent || navigator.userAgent;
            var uaRules = [
                /trident\/7\.0.*rv\:([0-9\.]+).*\).*gecko$/i
                ,/msie\s([0-9\.]+);.*trident\/[4-7].0/i
            ];
            var ver = 0;
            for(var i=0;i<uaRules.length;i++){
                var uaMatch = uaRules[i].exec(userAgent);
                if( uaMatch && uaMatch.length ) {
                    ver = parseInt(uaMatch[1]);
                    break;
                }
            }
            return ver;
        }
    };
    if( browserDetect.isIE() && browserDetect.ieVersion() < 11 ){
        //house
        document.write('<script src="//cyad1.nate.com/js.kti/%#publisher%#/%#section%#@%#location%#?exception_ads=%#ads_no%#" type="text/javascript" ><\/script>');
    }else {
        var _script = document.createElement('script');
        _script.src = '//pagead2.googlesyndication.com/pagead/show_ads.js';
        _script.type = 'text/javascript';
        document.head.appendChild(_script);
        // google
        google_ad_client = "ca-pub-8710503230568572";
        google_ad_slot = "4509422150";
        google_ad_width = _adWidth;
        google_ad_height = _adHeight;
        google_page_url = location.protocol + '//news.nate.com';
        google_alternate_ad_url= googleAlternateAdUrl;
    }

    try{
      parent.parent.document.querySelector('#adDiv iframe').style.height = _adHeight + 'px'
    }catch(e){
      window.onload = function() {
        window.top.postMessage({
          "method": "fnct",
          "name": "callCrossOriginAd",
          "property": {target: 'ad02IFrame', height: _adHeight}
        }, '*');
      }
    }
})();