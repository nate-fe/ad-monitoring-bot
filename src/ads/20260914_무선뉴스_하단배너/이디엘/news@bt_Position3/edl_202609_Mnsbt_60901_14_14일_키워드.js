; (function () {
    try {
        var ifrMainBanner = document.getElementById('ifr_main_banner');
        var adHeight = 250;
        var _script = document.createElement('script');
        _script.src = 'https://obsteel.com/widgetJs.php?subid=nt300x250hi3729s';

        ifrMainBanner.appendChild(_script);
        
        try {
            var __parent = parent.parent.document.querySelector('#ifr_ad_bottom');
            if (__parent) {
                __parent.height = adHeight;
                __parent.style.height = adHeight + 'px';
            } 
        } catch(err) {
              window.onload = function() {
                var isNews = location.href.indexOf('news') > -1;
                var isPann = location.href.indexOf('pann') > -1;
                
                if(isNews) {
                  window.parent.postMessage({
                    "method": "fnct",
                    "name": "callCrossOriginAd",
                    "property": {target: 'ifr_ad_bottom', height: adHeight}
                  }, '*');
                }
                if(isPann) {
                  window.parent.postMessage({
                    target: 'ifr_ad_bottom',
                    params: {
                      height: adHeight
                    }
                  }, '*');
                }
              }
        }
    } catch (err) {console.warn(err)}
})()