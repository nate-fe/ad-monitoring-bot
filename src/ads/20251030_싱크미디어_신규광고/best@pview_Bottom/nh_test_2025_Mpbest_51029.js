(function () {
    var _iframe = document.createElement('iframe');
    var _companyUid = '0dfda80d0473293f6371c7147fac9e2597f9bdb5';
    var _body = document.querySelector('body');
    _iframe.src = 'https://ad.3dpop.kr/web_ad/?company_uid=' + _companyUid;
    _iframe.setAttribute('width', '320');
    _iframe.setAttribute('height', '100');
    _iframe.setAttribute('scrolling', 'no');
    _iframe.setAttribute('topmargin', 0);
    _iframe.setAttribute('leftmargin', 0);
    _iframe.setAttribute('marginwidth', 0);
    _iframe.setAttribute('marginheight', 0);
    _iframe.setAttribute('frameborder', 0);
    _body.appendChild(_iframe);
})()