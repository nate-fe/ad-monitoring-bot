(function () {
    try {
        var mainBanner = document.getElementById('main_banner');
        var _script = document.createElement('script');
        _script.src = 'https://api.mjbiz.co.kr/kw/reqd?trackingCode=AF0700373&subId=adbnatekw';
        setTimeout(function(){
            mainBanner.appendChild(_script);
        }, 300);
    } catch (err) { console.warn(err) }
})();