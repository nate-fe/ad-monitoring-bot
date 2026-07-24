try {
    var _adHeight = 250;
    var _div = document.createElement('div');
    var _adArea = document.querySelector('#top_main_banner');
    _div.setAttribute('id', 'cozymang_MzgyMA==');
    _div.setAttribute('data-disp_id', 'MzgyMA==');
    _adArea.appendChild(_div);

    (function (c, o, z, y, m, a, n, g) {
        pb = "";
        //passbackurl 
        di = "";
        //adid or idfa 
        kwd = "";
        //search keyword 
        if (c[z] && c[z].n) return; c[z] = function () { (c[z].n = c[z].g || []).push(arguments) }; m = o.createElement(y); m.async = 1; m.charset = "utf-8"; m.src = "//ad.planbplus.co.kr/adReq/plugin.js?k=MzgyMA==" + "&pb=" + encodeURIComponent(pb) + "&di=" + encodeURIComponent(di) + "&kwd=" + encodeURIComponent(kwd); a = o.getElementsByTagName(y)[0]; a.parentNode.insertBefore(m, a);
    })
        (window, document, "cozymang", "script");

    window.parent.document.querySelector('iframe[name="ad_small"]').height = _adHeight;
} catch (err) {
    console.log(err);
}