try {
    var _adWidth = 300;
    var _adHeight = 250;
    var _div = document.createElement('div');
    var _adArea = document.querySelector('#top_main_banner');
    try {
        var _iframe = document.createElement('iframe');
        _iframe.width = _adWidth;
        _iframe.height = _adHeight;
        _iframe.style.border = 'none';
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.src = '//ep.elementunit.com/adReq/?k=NDMwNA==';
        _adArea.appendChild(_iframe);
    } catch (err) {
        console.log(err);
    }
    var myFrame = window.frameElement; 
    if (myFrame && myFrame.name === "ad_small") {
        myFrame.height = _adHeight;
    }
} catch (err) {
    console.log(err);
}