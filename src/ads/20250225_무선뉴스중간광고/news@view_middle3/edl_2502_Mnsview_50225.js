(function() {
    var $ad_view = document.getElementById('ad_innerView');
    if($ad_view) {
        var _css = 'div.news_view div.view_cont #ad_innerView {margin:0;} #ad_innerView{text-align:center; height:auto;text-align:center; } #ad_innerView .ad_innerView_iframe_wrap {min-width:300px; margin:0 auto; display:inline-block; text-align:center; position:relative;} #ad_innerView iframe {height:250px;}.ad_inner_view_box1{position:absolute;top:0;left:0;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}ins.adsbygoogle[data-ad-status="unfilled"]{display: none !important;}',
          _style = document.createElement('style');
          _style.type = 'text/css';
          _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
          $ad_view.appendChild(_style);
        var _div = document.createElement('div');
        var _iframe = document.createElement('iframe');
        _iframe.src = '//tae.middlepoint.co.kr/cgi-bin/PelicanC.dll?impr?pageid=0HB2&out=iframe';
        _iframe.width = 300;
        _iframe.height = 250;
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('marginwidth', 0);
        _iframe.setAttribute('marginheight', 0);
        _iframe.setAttribute('border', 0);
        _iframe.setAttribute('frameborder', 0);
        _div.appendChild(_iframe)
        _div.classList.add('ad_innerView_iframe_wrap')
        $ad_view.appendChild(_div);
        
        var _adBox = document.createElement('div');
        _adBox.innerHTML = 'AD';
        _adBox.setAttribute('class', 'ad_inner_view_box1');
        _div.appendChild(_adBox);
    }
  })();