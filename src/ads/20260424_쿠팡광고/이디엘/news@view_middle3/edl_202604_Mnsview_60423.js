(function() {
    var $ad_view = document.getElementById('ad_innerView');
    if($ad_view) {
      var _script = document.createElement('script');
      _script.src = 'https://api.adapi.co.kr/cou/api_reco.php?code=nate014968m&adid=&type=js_ov&click_log=&click_type=&load_type=1';
      $ad_view.appendChild(_script);
      _script.onload = function(){
        var _style = document.createElement('style');
        _css = '.news_view .view_cont #ad_innerView {width:300px; margin:30px auto 50px;} #ad_innerView iframe {height:250px;}';
        _style.type = 'text/css';
        _style.appendChild(document.createTextNode(_css))
        $ad_view.appendChild(_style);
      }
    }
  })();