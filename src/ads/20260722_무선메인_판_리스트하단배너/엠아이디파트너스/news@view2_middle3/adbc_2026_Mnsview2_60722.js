(function() {
    try{
        var _css = '#ad_innerView2{width:300px;height:auto;text-align:center;margin:0 auto;position:relative;}.ad_inner_view_box2{position:absolute;top:0;left:0;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}ins.adsbygoogle[data-ad-status="unfilled"]{display: none !important;}'
            , _style = document.createElement('style');
        _style.type = 'text/css';
        _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
        var _adWidth = 300;
        var _adHeight = 250;
        var _adInnerView = document.getElementById('ad_innerView2');
        var _iframe = document.createElement('iframe');
        _adInnerView.appendChild(_style);
        if (_adInnerView) {
            _iframe.src = '//vbcc.io/unit/?x=MTc=';
            _iframe.width = _adWidth;
            _iframe.height = _adHeight;
            _iframe.style.width = _adWidth + 'px';
            _iframe.style.height = _adHeight + 'px';
            _iframe.style.border = 'none';
            _iframe.setAttribute('frameborder', 0);
            _iframe.setAttribute('scrolling', 'no');
            _adInnerView.appendChild(_iframe);

            var _adBox = document.createElement('div');
            _adBox.innerHTML = 'AD';
            _adBox.setAttribute('class', 'ad_inner_view_box2');
            _adInnerView.appendChild(_adBox);
        }
    }catch(err){console.warn(err)}  
  })();