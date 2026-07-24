(function () {
    var _css = '#admixer_log {display:none;} #admixer_11126_105166 {margin:0 auto;}';
    var _style = document.createElement('style');
    var _adArea = document.getElementById('main_banner');
    var _lib = document.createElement('script');
    var _script = document.createElement('script');
    _style.setAttribute('type', 'text/css');
    _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
    _adArea.appendChild(_style);
    _lib.src = '//cdnet.nasmob.com/axssp/websdk/v1/admixer.min.js';
    _lib.setAttribute('type', 'text/javascript');

    _adArea.appendChild(_lib);
    
    var _div = document.createElement('div');
    _div.setAttribute('id', 'admixer_11126_105166');
    _adArea.appendChild(_div);

    var _actionCode = `
        admixer_m({
        media_key: "11126",
        adunits: [
        {
        adunit_id: "105166",
        target_id : "admixer_11126_105166",
        close_btn: false,
        callback:
        
        { success: () => console.log("퍼블리셔 Callback Success"), fail: (error_code, error_msg) => console.log("퍼블리셔 Callback Fail : ", error_code, error_msg) }
        },
        ],
        coppa: 1,
        log: true
        });
    `;

    _lib.onload = function(){
        _script.innerHTML = _actionCode;
        _adArea.appendChild(_script);
    }
    

    var _parent = parent.document.getElementById('ad_big');
    if (_parent) {
        _parent.style.height = '100px';
    }
})();