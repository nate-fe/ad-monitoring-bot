(function () {
    var _currentScript = document.currentScript;
    var _parent = _currentScript.parentNode;
    var ua = navigator.userAgent;
    // AOS: gadid, iOS: idfa 순으로 탐색 (필요시 'adid' 등 키 추가 가능)
    var _adid = getFirstAgentValue(["gadid", "idfa", "adid"], ua);
    var _lib = document.createElement('script');
    var _companyUid = '4225a2e3ea2a9eed9fd2b4c12ee7724682afd0d3';

    function getAgentValue(key, u) {
        var su = u.split(";");
        var d;
        for (var i = 0; i < su.length; i++) {
            d = su[i].split(":");
            if (d[0].trim().toLowerCase() == key.toLowerCase()) {
                return (d[1] || "").trim();
            }
        }
        return "";
    }

    // 여러 키를 순서대로 시도해서 처음으로 값이 잡히는 것을 반환
    function getFirstAgentValue(keys, u) {
        for (var i = 0; i < keys.length; i++) {
            var v = getAgentValue(keys[i], u);
            if (v != "") return v;
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
    _lib.setAttribute('data-tagno', randomTagNo());
    _parent.insertBefore(_lib, _currentScript);

    var _info = document.createElement('span');
    _info.innerText = ua;
    _info.style.backgroundColor = '#333'
    _info.style.color = '#fff';
    _info.style.position = 'absolute';
    _info.style.left = '0';
    _info.style.top = '0';
    _info.style.width = '100%';
    _info.style.display = 'block';
    _info.style.fontSize = '11px';
    _info.style.lineHeight = '13px';
    _parent.appendChild(_info);
})();