try {
    var _adWidth = 300;
    var _adHeight = 250;
    var _div = document.createElement('div');
    var _adArea = document.querySelector('#top_main_banner');
    try {
        var _iframe = document.createElement('iframe');
        _iframe.width = _adWidth;
        _iframe.height = _adHeight;
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.setAttribute('name', 'smartigyframe')
        _iframe.src = '//ap.smartigy.biz/adReq/?k=Mzgz&pb=&di=';
        _adArea.appendChild(_iframe);
    } catch (err) {
        console.log(err);
    }
    window.parent.document.querySelector('iframe[name="ad_small"]').height = _adHeight;
} catch (err) {
    console.log(err);
}