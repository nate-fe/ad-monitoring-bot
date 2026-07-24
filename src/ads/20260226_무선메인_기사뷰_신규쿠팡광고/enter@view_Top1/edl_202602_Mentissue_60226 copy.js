(function () {
    var _script = document.createElement('script');
    _script.src = 'https://api.ootoo.co.kr/cou/api_reco.php?code=testtest00&adid=&type=js&click_log=&click_type=&load_type=1';

    var _div = document.createElement('div');
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    var _hr = document.createElement('hr');
    _div.setAttribute('id', 'ad_area_viewTop');
    _div.style.display = 'flex';
    _div.style.justifyContent = 'center';

    _hr.setAttribute('class', 'componentDivision');

    _div.appendChild(_script);
    
    _parent.insertBefore(_hr, _currentScript);
    _parent.insertBefore(_div, _hr);
})();