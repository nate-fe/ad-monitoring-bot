(function () {
    var _adHeight = 200;
    var _adArea = document.getElementById('main_banner');
    var _script = document.createElement('script');
    _script.src = 'https://api.mjbiz.co.kr/kw/reqd?trackingCode=AF0700373&subId=adbnews1kw';

    setTimeout(function(){
        _adArea.appendChild(_script);
    }, 300);

    var _parent = parent.document.querySelector('#ad_big2');
    if (_parent) {
        var _parentIfr = parent.document.querySelector('#ad_big2');
        if (_parentIfr) {
            _parentIfr.style.height = _adHeight + 'px';
            _parentIfr.frameBorder = 0;
        }
    }
})();