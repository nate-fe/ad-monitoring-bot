(function () {
        try{if(!CyadLib)var CyadLib={};CyadLib.hasOwnProperty("prefixUrl")||(CyadLib.prefixUrl=function(t){var r=location.protocol;return/^http[s]?:/.test(r)&&(t=t.replace(/http:/g,r).replace(/https:/g,r)),/^\/\/\w+?/.test(t)&&(t=r+t),/^http[s]?\/\//.test(t)&&(t=t.replace(/http\/\//g,r+"//").replace(/https\/\//g,r+"//")),t})}catch(t){}

        var ad_height   = '150'; //광고 높이 값
        var bgcolor     = '#c9f5ff';
        var img_path    = CyadLib.prefixUrl('https://adimg.nate.com/img/2026/02/nutri03/nutri03_0226_640x300_c9f5ff.jpg');	//이미지 소재 경로
        var click_path  = CyadLib.prefixUrl('http://cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#'); //랜딩
        var alt_text    = '광고';

        var _aTag = document.createElement('a');
        _aTag.setAttribute('href', click_path);
        _aTag.setAttribute('target', '_blank');
        _aTag.style.display = 'block';
        _aTag.style.height = ad_height + 'px';
        _aTag.style.background = bgcolor;

        var _imgTag = document.createElement('img');
        _imgTag.setAttribute('src', img_path);
        _imgTag.setAttribute('alt', alt_text);
        _imgTag.setAttribute('width', '320');
        _imgTag.setAttribute('height', ad_height);
        _imgTag.setAttribute('border', '0');

        _aTag.appendChild(_imgTag);

        var _currentScript = document.currentScript;
        var _adArea = _currentScript.closest('.adloader');
        _adArea.style.backgroundColor = bgcolor;
        _adArea.appendChild(_aTag);
        _adArea.style.height = ad_height + 'px';
    })()