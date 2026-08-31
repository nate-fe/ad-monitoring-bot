(function() {
    var $ad_view = document.getElementById('ad_innerView2');
    if($ad_view) {
      var _css = '#ad_innerView2{height:auto;text-align:center;}.ad_inner_view_box2{position:absolute;top:0;left:0;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}ins.adsbygoogle[data-ad-status="unfilled"]{display: none !important;}',
          _style = document.createElement('style');
        _style.type = 'text/css';
        _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
        $ad_view.appendChild(_style);
        
        var $page_script = document.createElement('script');
        $page_script.crossorigin = 'anonymous';
        $page_script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8710503230568572';
        $ad_view.appendChild($page_script);
    
        var _data = $ad_view.querySelector('script');
        var _ins = document.createElement('ins');
        _ins.setAttribute('class', 'adsbygoogle');
        _ins.setAttribute('data-ad-layout', 'in-article');
        _ins.setAttribute('data-ad-client', 'ca-pub-8710503230568572');
        _ins.setAttribute('data-ad-format', 'fluid');
        _ins.setAttribute('data-ad-slot', '4149426708');
        _ins.style.position = 'relative';
        _ins.style.display = 'inline-block';
        _ins.style.minWidth = '300px';
    
        $ad_view.appendChild(_ins);
    
        var $action_code = '(adsbygoogle = window.adsbygoogle || []).push({});';
        var $action_script = document.createElement('script');
        $action_script.innerHTML = $action_code;
    
        $page_script.onload = function() {
            $ad_view.appendChild($action_script);      
        }
    
        var _adBox = document.createElement('div');
        _adBox.innerHTML = 'AD';
        _adBox.setAttribute('class', 'ad_inner_view_box2');
        _ins.appendChild(_adBox);
    }
})();