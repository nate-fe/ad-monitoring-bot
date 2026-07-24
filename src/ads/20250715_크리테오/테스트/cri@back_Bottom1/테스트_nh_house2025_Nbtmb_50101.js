//prefixUrl setting 2018-05-30 02:21
try { if (!CyadLib) var CyadLib = {}; CyadLib.hasOwnProperty("prefixUrl") || (CyadLib.prefixUrl = function (t) { var r = location.protocol; return /^http[s]?:/.test(r) && (t = t.replace(/http:/g, r).replace(/https:/g, r)), /^\/\/\w+?/.test(t) && (t = r + t), /^http[s]?\/\//.test(t) && (t = t.replace(/http\/\//g, r + "//").replace(/https\/\//g, r + "//")), t }) } catch (t) { }
var areaAds = {
    clickUrl: CyadLib.prefixUrl('https://cyad1.nate.com/click.kti/%#publisher%#/%#section%#@%#location%#?ads_no=%#ads_no%#&cmp_no=%#cmp_no%#&img_no=%#img_no%#') // 클릭경로 //click path
    , imgUrl: CyadLib.prefixUrl('https://adimg.nate.com/img/2025/06/house0701/house0701_0630_728x90.jpg') // img path
};
(function (ready) {
    if (ready === undefined) return;
    if (document.readyState !== 'complete') {
        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", function f() {
                document.removeEventListener("DOMContentLoaded", f, false);
                ready();
            }, false);
        } else if (document.attachEvent) {
            document.attachEvent("onreadystatechange", function f() {
                if (document.readyState === "complete") {
                    document.detachEvent("onreadystatechange", f);
                    ready();
                }
            });
        }
    } else ready();
})(function () {
    try {
        var el = document.querySelector('body');
        var _aTag = document.createElement('a');
        var _imgTag = document.createElement('img');
        _aTag.setAttribute('href', areaAds.clickUrl);
        _aTag.setAttribute('target', '_blank');
        _imgTag.setAttribute('src', areaAds.imgUrl);
        _imgTag.setAttribute('width', '728');
        _imgTag.setAttribute('height', '90');
        _imgTag.setAttribute('border', '0');
        _imgTag.setAttribute('alt', '광고');
        _imgTag.setAttribute('loading', 'lazy');
        _aTag.appendChild(_imgTag);
        el.appendChild(_aTag);
    } catch (e) { }
});
