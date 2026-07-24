(function () {
    var $ad_view = document.getElementById('ad_innerView2');
    if ($ad_view) {
        var _css = '#ad_innerView2{width:300px;height:auto;text-align:center;margin:0 auto;position:relative;}.ad_inner_view_box2{position:absolute;top:0;left:0;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}ins.adsbygoogle[data-ad-status="unfilled"]{display: none !important;}'
            , _style = document.createElement('style');
        _style.type = 'text/css';
        _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
        $ad_view.appendChild(_style);

        var _iframe = document.createElement('iframe');
        _iframe.src = '//ep.elementunit.com/adReq/?k=NDMwNQ==" ';
        _iframe.width = 300;
        _iframe.height = 250;
        _iframe.style.width = '300px';
        _iframe.style.height = '250px';
        _iframe.style.border = 'none';
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('frameborder', 0);

        var _adBox = document.createElement('div');
        _adBox.innerHTML = 'AD';
        _adBox.setAttribute('class', 'ad_inner_view_box2');

        $ad_view.appendChild(_iframe);
        $ad_view.appendChild(_adBox);
    }
}
)();
