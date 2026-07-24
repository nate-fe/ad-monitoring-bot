(function () {
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    var ua = navigator.userAgent;
    var _adid = getAgentValue("gadid", ua);
    var _lib = document.createElement('script');
    var _companyUid = '4225a2e3ea2a9eed9fd2b4c12ee7724682afd0d3';

    function getAgentValue(key, u) {
        var su = u.split(";");
        var d;
        for (var i = 0; i < su.length; i++) { 
            d = su[i].split(":");
            if (d[0].toLowerCase() == key) return d[1];
        }
        return "";
    }

    function randomTagNo() {
       var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
       var s = '';
       for (var j = 0; j < 5; j++) {
          s += chars.charAt(Math.floor(Math.random() * chars.length));
       }
       return s;
    }

    if (_adid == "") _adid = "00000000-0000-0000-0000-000000000000";

    _lib.src = 'https://cdn.3dpop.kr/_Common/Js/ad_app_sdk_nate.min.js?companyUid=' + _companyUid + '&adid=' + _adid;
    _lib.setAttribute('data-tagno', randomTagNo())

    _parent.insertBefore(_lib, _currentScript); 
})();