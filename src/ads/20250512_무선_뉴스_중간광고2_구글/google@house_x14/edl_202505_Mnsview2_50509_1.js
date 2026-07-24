(function () {
    var $ad_view = document.getElementById('ad_innerView2');
    if ($ad_view) {
        var _css = '#ad_innerView2{width:300px;height:auto;text-align:center;margin:0 auto;position:relative;}.ad_inner_view_box2{position:absolute;top:0;left:0;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}ins.adsbygoogle[data-ad-status="unfilled"]{display: none !important;}'
            , _style = document.createElement('style');
        _style.type = 'text/css';
        _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
        $ad_view.appendChild(_style);

        var _iframe = document.createElement('iframe');
        _iframe.src = '//tae.middlepoint.co.kr/cgi-bin/PelicanC.dll?impr?pageid=0HOQ&out=iframe';
        _iframe.width = 300;
        _iframe.height = 250;
        _iframe.style.width = '300px';
        _iframe.style.height = '250px';
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('marginwidth', 0);
        _iframe.setAttribute('marginheight', 0);
        _iframe.setAttribute('border', 0);
        _iframe.setAttribute('frameborder', 0);

        var _adBox = document.createElement('div');
        _adBox.innerHTML = 'AD';
        _adBox.setAttribute('class', 'ad_inner_view_box2');

        $ad_view.appendChild(_iframe);
        $ad_view.appendChild(_adBox);
    }
}
)();


(function () {
    var $ad_view = document.getElementById('ad_innerView2');
    var _css = 'div.news_view div.view_cont #ad_innerView2 {margin:0 auto;} #ad_innerView2{width:300px;height:auto;text-align:center;text-align:center; } #ad_innerView2 .ad_innerView_iframe_wrap2 {min-width:300px; margin:0 auto; display:inline-block; text-align:center; position:relative;} #ad_innerView2 iframe {height:250px;}.ad_inner_view_box2{position:absolute;top:0;left:0;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}#ad_innerView2 ins.adsbygoogle[data-ad-status="unfilled"] {display:block !important}',
        _style = document.createElement('style');
    _style.type = 'text/css';
    _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
    var _div = document.createElement('div');
    var _iframe = document.createElement('iframe');
    _iframe.src = '//tae.middlepoint.co.kr/cgi-bin/PelicanC.dll?impr?pageid=0HOQ&out=iframe';
    _iframe.width = 300;
    _iframe.height = 250;
    _iframe.setAttribute('scrolling', 'no');
    _iframe.setAttribute('marginwidth', 0);
    _iframe.setAttribute('marginheight', 0);
    _iframe.setAttribute('border', 0);
    _iframe.setAttribute('frameborder', 0);
    _div.appendChild(_iframe)
    _div.classList.add('ad_innerView_iframe_wrap2')
    if ($ad_view) {
        $ad_view.appendChild(_style);
        $ad_view.appendChild(_div);
        var _adBox = document.createElement('div');
        _adBox.innerHTML = 'AD';
        _adBox.setAttribute('class', 'ad_inner_view_box2');
        _div.appendChild(_adBox);
    } else {
        var _body = document.body;
        _body.appendChild(_style);
        _body.appendChild(_div);
    }
})();