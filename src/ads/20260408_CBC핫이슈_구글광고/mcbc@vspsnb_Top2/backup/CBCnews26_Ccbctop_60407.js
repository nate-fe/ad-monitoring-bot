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
    var img_path = CyadLib.prefixUrl('https://adimg.nate.com/img/2026/04/cbc/cbc_m7_640x200.jpg');
    //이미지 소재 경로 
    var adsEl = '<a href="//cyad1.nate.com/click.kti/cbcnews/mcbc@vspsnb_Top2?ads_no=241305&cmp_no=31248&img_no=422884" target="_blank">\
  <img src="' + img_path + '" width="640" height="200" border="0" alt="광고"></a>';
    document.write(adsEl);
} catch (e) {}
