(function() {
    try{
        var _css = 'div.news_view div.view_cont #ad_innerView {margin:0 auto;} #ad_innerView{width:300px;height:auto;text-align:center;position:relative;}.ad_inner_view_box{position:absolute;top:0;left:0px;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}#ad_innerView ins.adsbygoogle[data-ad-status="unfilled"] {display:block !important}'
          , _style = document.createElement('style');
        _style.type = 'text/css';
        _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
        var _adWidth = 300;
        var _adHeight = 250;
        var _adInnerView = document.getElementById('ad_innerView');
        var _companyUid = '26d5e5e8ace8681f41c420b8824d686a9e5c9f40';
        var _iframe = document.createElement('iframe');
        _adInnerView.appendChild(_style);
        if (_adInnerView) {
            _iframe.src = 'https://ad.3dpop.kr/web_ad/?company_uid=' + _companyUid + '&position=center&isCloseBtn=N';
            _iframe.width = _adWidth;
            _iframe.height = _adHeight;
            _iframe.style.width = _adWidth + 'px';
            _iframe.style.height = _adHeight + 'px';
            _iframe.setAttribute('frameborder', 0);
            _iframe.setAttribute('scrolling', 'no');
            _iframe.setAttribute('topmargin', '0');
            _iframe.setAttribute('leftmargin', '0');
            _iframe.setAttribute('marginwidth', '0');
            _iframe.setAttribute('marginheight', '0');
            _iframe.setAttribute('frameborder', '0');
            _adInnerView.appendChild(_iframe);

            var _adBox = document.createElement('div');
            _adBox.innerHTML = 'AD';
            _adBox.setAttribute('class', 'ad_inner_view_box');
            _adInnerView.appendChild(_adBox);
        }
    }catch(err){console.warn(err)}  
  })();