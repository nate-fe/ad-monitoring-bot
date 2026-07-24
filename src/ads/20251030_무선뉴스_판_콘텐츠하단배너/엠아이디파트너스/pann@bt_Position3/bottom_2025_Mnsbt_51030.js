; (function () {
    document.open();
    document.write('<script src="https://api.ootoo.co.kr/cou/api_reco.php?code=ab300vv250nate&adid=&type=js&click_log=&click_type="></script>')
    document.close();
    requestAnimationFrame(() => {
        var _ifrMainBanner = document.getElementById('ifr_main_banner');
        var _adBottom = parent.document.getElementById('ifr_ad_bottom');
        setTimeout(function () {
            var _adHeight = _ifrMainBanner.getBoundingClientRect().height;
            console.log(_adHeight)
            _adBottom.style.height = _adHeight + 'px';
            _adBottom.setAttribute('height', _adHeight);
        }, 300);
    });
})()