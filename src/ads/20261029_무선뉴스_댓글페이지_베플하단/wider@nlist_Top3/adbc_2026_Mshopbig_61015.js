(function () {
    try {
        var _width = 320;
        var _height = 200;
        var _iframe = document.createElement('iframe');
        var _adArea = document.getElementById('main_banner');
        _iframe.src = '//daiyenfooels.com/unit/?x=Njc=';
        _iframe.width = _width + 'px';
        _iframe.height = _height + 'px';
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('referrerpolicy', 'unsafe-url');
        _iframe.style.border = 'none';
        _adArea.style.margin = '0';
        _adArea.style.textAlign = 'center';
        _adArea.appendChild(_iframe);

        var _parent = parent.document.querySelector('#ad_big');
        if (_parent) {
            _parent.style.height = _height + 'px';
        }

    } catch (err) { 
	window.onload = function() {
	  var isNews = location.href.indexOf('news') > -1;
	  var isPann = location.href.indexOf('pann') > -1;
	  if(isNews) {
		window.parent.postMessage({
		  "method": "fnct",
		  "name": "callCrossOriginAd",
		  "property": {target: window.name, width: _width, height: _height}
		}, '*');
	  }
	  if(isPann) {
		window.parent.postMessage({
		  target: 'ad_big',
		  params: {
			height: _height
		  }
		}, '*');
	  }
	}}
})();