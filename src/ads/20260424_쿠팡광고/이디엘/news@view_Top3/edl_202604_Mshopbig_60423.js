(function() {
    var _adHeight = 250;
    var $ad_view = document.getElementById('main_banner');
    if($ad_view) {
      var _script = document.createElement('script');
      _script.src = 'https://api.adapi.co.kr/cou/api_reco.php?code=nate034968m&adid=&type=js_ov&click_log=&click_type=&load_type=1';
      $ad_view.appendChild(_script);
      _script.onload = function(){
        if ($ad_view.querySelector('iframe')) {
          $ad_view.querySelector('iframe').style.margin = '0 auto';
        }
      }
      var _adBig = window.parent.document.getElementById('ad_big');
      if (_adBig) {
        _adBig.style.height = _adHeight + 'px';
        _adBig.style.textAlign = 'center';
      }
    }
  })();