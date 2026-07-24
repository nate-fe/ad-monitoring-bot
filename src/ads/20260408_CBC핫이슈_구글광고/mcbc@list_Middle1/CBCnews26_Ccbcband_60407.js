try {
    if (!CyadLib)
        var CyadLib = {};
    CyadLib.hasOwnProperty("prefixUrl") || (CyadLib.prefixUrl = function(t) {
        var r = location.protocol;
        return /^http[s]?:/.test(r) && (t = t.replace(/http:/g, r).replace(/https:/g, r)),
        /^\/\/\w+?/.test(t) && (t = r + t),
        /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, r + "//").replace(/https\/\//g, r + "//")),
        t
    }
    )
} catch (t) {}

try {    
    var _div = document.createElement('div');
    var _adArea = 'cbcListHorBanner';
    _div.setAttribute('id', _adArea);
    var img_path = CyadLib.prefixUrl('https://adimg.nate.com/img/2026/04/cbc/cbc_m5_640x200.jpg');
    //이미지 소재 경로 
    var _aTag = document.createElement('a');    
    _aTag.setAttribute('href', '//cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#');
    _aTag.setAttribute('target', '_blank');
    var _imgTag = document.createElement('img');
    _imgTag.setAttribute('src', img_path);
    _imgTag.setAttribute('border', '0');
    _imgTag.setAttribute('alt', '광고');
    _imgTag.style.width = '100%';
    _aTag.appendChild(_imgTag);
    _div.appendChild(_aTag);
    var _currentScript = document.currentScript;
    var _adArea = _currentScript.parentNode;
    _adArea.insertBefore(_div, _currentScript);
} catch (e) {}
