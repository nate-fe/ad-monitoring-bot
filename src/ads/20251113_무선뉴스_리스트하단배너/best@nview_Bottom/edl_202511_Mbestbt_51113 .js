; (function () {
    var _adHeight = 250;
    // top level iframe

    var _parent = parent.document.querySelector('#ad_big2');
    if (_parent) {
        var _parentIfr = parent.document.querySelector('#ad_big2');
        if (_parentIfr) {
            _parentIfr.style.height = _adHeight + 'px';
            _parentIfr.frameBorder = 0;
        }
    }

    ; (function () {
        document.write('<script src="https://api.ootoo.co.kr/cou/api_reco.php?code=300x250bbnatehi&adid=&type=js&click_log=&click_type="></' + 'script')
    })()
})()