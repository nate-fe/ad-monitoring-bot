(function() {
    var _adWidth = 300;
    var _adHeight = 250;
    var $ad_view = document.getElementById('ad_innerView2');
    if($ad_view) {
      var _style = document.createElement('style');
        _css = '.news_view .view_cont #ad_innerView2 {width:300px; margin:30px auto 50px;} #ad_innerView2 iframe {height:250px;}';
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
      $ad_view.appendChild(_iframe);
    }
  })();