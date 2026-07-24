(function() {
    var _adWidth = 300;
    var _adHeight = 250;
    var $ad_view = document.getElementById('ad_innerView2');
    if($ad_view) {
      var _style = document.createElement('style');
        _css = '.news_view .view_cont #ad_innerView2 {width:300px; margin:30px auto 50px; position:relative;} .ad_inner_view_box2 {position:absolute; top:0; left:0; width:28px; height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1; text-align:center;} #ad_innerView2 iframe {height:250px;}';
      _style.type = 'text/css';
      _style.appendChild(document.createTextNode(_css))
      $ad_view.appendChild(_style);
      var _iframe = document.createElement('iframe');
      _iframe.setAttribute('width', _adWidth);
      _iframe.setAttribute('height', _adHeight);
      _iframe.setAttribute('src', '//awesomeclick.co.kr/adSb/?k=MTcy&pb=&di=&kwd=');
      _iframe.setAttribute('marginwidth', '0');
      _iframe.setAttribute('marginheight', '0');
      _iframe.setAttribute('hspace', '0');
      _iframe.setAttribute('vspace', '0');
      _iframe.setAttribute('frameborder', '0');
      _iframe.setAttribute('scrolling', 'no');
      _iframe.style.width = _adWidth + 'px';
      _iframe.style.height = _adHeight + 'px';

      var _adBox = document.createElement('div');
      _adBox.innerHTML = 'AD';
      _adBox.setAttribute('class', 'ad_inner_view_box2');

      $ad_view.appendChild(_iframe);
      $ad_view.appendChild(_adBox);
    }
  })();