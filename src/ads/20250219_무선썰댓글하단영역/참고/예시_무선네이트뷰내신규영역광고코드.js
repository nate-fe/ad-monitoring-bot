(function() {
    var $ad_ids = ['m_post_body01_resized']; // ad area id
    var $ad_client = 'ca-pub-8710503230568572'; // ad-client
    var $ad_slot = '2787979045'; //ad-slot
    var $ad_width = 336;
    var $ad_height = 280;
  
    var _script = document.createElement('script');
    _script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + $ad_client;
    _script.async = true;
    _script.crossorigin = 'anonymous';
    _script.onload = function() {
      (adsbygoogle = window.adsbygoogle || []).push({});
    }
  
    var _ins = document.createElement('ins');
    _ins.className = 'adsbygoogle';
    _ins.style.display = 'inline-block';
    _ins.style.width = $ad_width + 'px';
    _ins.style.height = $ad_height + 'px';
    _ins.setAttribute('data-ad-client', $ad_client);
    _ins.setAttribute('data-ad-slot', $ad_slot);
    _ins.setAttribute('data-ad-format', 'auto');
    // _ins.setAttribute('data-full-width-responsive', true);
  
    if(self !== top) {
      document.body.appendChild(_ins);
      document.body.appendChild(_script);
    } else {
      $ad_ids.forEach(function($ad_id) {
        if(document.getElementById($ad_id)) {
          // document.getElementById($ad_id).style.margin = '0 -20px';
          document.getElementById($ad_id).appendChild(_ins);
          document.getElementById($ad_id).appendChild(_script);
        }
      });    
    }
  })();
  