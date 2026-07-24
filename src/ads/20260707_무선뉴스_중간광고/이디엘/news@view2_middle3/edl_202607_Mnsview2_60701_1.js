(function() {
    var $ad_view = document.getElementById('ad_innerView2');
    if($ad_view) {
      var _script = document.createElement('script');
      _script.src = 'https://api.adapi.co.kr/cou/api_reco.php?code=nate024968m&adid=&type=js_ov&click_log=&click_type=&load_type=1';
      $ad_view.appendChild(_script);
      _script.onload = function(){
        var _style = document.createElement('style');
        _css = '.news_view .view_cont #ad_innerView2 {width:300px; margin:30px auto 50px; position:relative;} .ad_inner_view_box2 {position:absolute; top:0; left:0; width:28px; height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1; text-align:center;} #ad_innerView2 iframe {height:250px;}';
        _style.type = 'text/css';
        _style.appendChild(document.createTextNode(_css))
        var _adBox = document.createElement('div');
        _adBox.innerHTML = 'AD';
        _adBox.setAttribute('class', 'ad_inner_view_box2');
        $ad_view.appendChild(_style);
        $ad_view.appendChild(_adBox);
      }
    }
  })();