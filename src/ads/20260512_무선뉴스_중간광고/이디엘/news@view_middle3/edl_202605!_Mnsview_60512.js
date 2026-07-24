(function() {
    var _adWidth = 300;
    var _adHeight = 250;
    var $ad_view = document.getElementById('ad_innerView');
    if($ad_view) {
      var _style = document.createElement('style');
      _css = '.news_view .view_cont #ad_innerView {width:300px; margin:30px auto 50px;} #ad_innerView iframe {height:250px;}';
      _style.type = 'text/css';
      _style.appendChild(document.createTextNode(_css))
      $ad_view.appendChild(_style);
      var _iframe = document.createElement('iframe');
      _iframe.setAttribute('width', _adWidth);
      _iframe.setAttribute('height', _adHeight);
      _iframe.setAttribute('src', '//ad.ad4989.co.kr/cgi-bin/PelicanC.dll?impr?pageid=0HB2&out=iframe');
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