(function () {
    var $ad_view = document.getElementById('ad_innerView');
    var _width = 300;
    var _height = 250;
    if ($ad_view) {
        var _css = '.news_view .view_cont #ad_innerView{width:300px;height:auto;text-align:center;margin-left:auto;margin-right:auto;position:relative;}.ad_inner_view_box{position:absolute;top:0;left:0;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}ins.adsbygoogle[data-ad-status="unfilled"]{display: none !important;}'
            , _style = document.createElement('style');
        _style.type = 'text/css';
        _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
        $ad_view.appendChild(_style);
        var _iframe = document.createElement('iframe');
        _iframe.src = '//ad.planbplus.co.kr/adSb/?k=Mzk0NA==&pb=&di=&kwd=';
        _iframe.style.height = _height + 'px'
        _iframe.setAttribute('width', _width);
        _iframe.setAttribute('height', _height);
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('name', 'cozymangframe');

        var _adBox = document.createElement('div');
        _adBox.innerHTML = 'AD';
        _adBox.setAttribute('class', 'ad_inner_view_box');

        $ad_view.appendChild(_iframe);
        $ad_view.appendChild(_adBox);
    }
}
)();
