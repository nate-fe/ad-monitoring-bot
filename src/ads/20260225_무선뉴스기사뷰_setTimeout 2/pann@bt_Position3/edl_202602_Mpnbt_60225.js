(function () {
    var _width = 300;
    var _height = 250;
    var _script = document.createElement('script');
    _script.src = 'https://api.ootoo.co.kr/cou/api_reco.php?code=hibbnate300250&adid=&type=js&click_log=&click_type=&load_type=1';

    var _div = document.createElement('div');
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    _div.setAttribute('id', 'ad_area_bt_position3');
    _div.style.display = 'flex';
    _div.style.justifyContent = 'center';

    _div.appendChild(_script);
    _parent.insertBefore(_div, _currentScript);
})();