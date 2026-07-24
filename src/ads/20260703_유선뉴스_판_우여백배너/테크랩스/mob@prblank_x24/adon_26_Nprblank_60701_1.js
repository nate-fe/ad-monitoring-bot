(function() {
    var _adWidth = 160;
    var _adHeight = 600;
    var _script = document.createElement('script');
    var _body = document.querySelectorAll('body')[0];

    _script.src = 'https://compass.adop.cc/assets/js/adop/adopJ.js?v=14';
    _body.appendChild(_script);
    _script.onload = function(){
        var _ins = document.createElement('ins');
        _ins.classList.add('adsbyadop');
        _ins.setAttribute('_adop_zon', 'baba2e1b-7df2-40be-89f9-e0c6f6a4c0af');
        _ins.setAttribute('_adop_type', 're');
        _ins.setAttribute('_page_url', '');
        _ins.style.display = 'inline-block';
        _ins.style.width = _adWidth + 'px';
        _ins.style.height = _adHeight + 'px';
        _body.appendChild(_ins);
    }
  })();