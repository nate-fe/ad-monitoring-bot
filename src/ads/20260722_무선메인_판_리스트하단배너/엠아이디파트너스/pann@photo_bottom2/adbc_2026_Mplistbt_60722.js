try {
    var _adWidth = 300;
    var _adHeight = 250;
    var _currentScript = document.currentScript;
    var _adArea = _currentScript.parentNode;
    try {
        var _iframe = document.createElement('iframe');
        _iframe.width = _adWidth;
        _iframe.height = _adHeight;
        _iframe.style.border = 'none';
        _iframe.setAttribute('frameborder', 0);
        _iframe.setAttribute('scrolling', 'no');
        _iframe.src = '//vbcc.io/unit/?x=MTU=';
        _adArea.appendChild(_iframe);
    } catch (err) {
        console.log(err);
    }
} catch (err) {
    console.log(err);
}