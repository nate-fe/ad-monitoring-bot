(function () {
    var _lib = document.createElement('script');
    var _center = document.createElement('center');
    var _div = document.createElement('div');
    var _script = document.createElement('script');
    var _body = document.querySelector('body');
    var adWidth = 120;
    var adHeight = 600;
    var _actionCode = `
                window.googletag = window.googletag || {cmd: []};
googletag.cmd.push(function() { 
googletag.defineSlot('/21682743634,22664242840/S003/nate_pc_ap_bottom02_120x600', [120,600], 'S003_nate_pc_ap_bottom02_120x600').addService(googletag.pubads().set('page_url', '//nate.com')); 
googletag.pubads().enableSingleRequest();
googletag.enableServices();
googletag.display('S003_nate_pc_ap_bottom02_120x600');
});
    `;
    _script.innerHTML = _actionCode;
    _lib.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
    _lib.async = true;
    _div.setAttribute('id', 'S003_nate_pc_ap_bottom02_120x600');
    _div.appendChild(_script);
    _center.appendChild(_div);
    _body.appendChild(_lib);
    _body.appendChild(_center);

    var _parent = parent.document.querySelector('.limited_ad_wrap');
    if (_parent) {
        var _parentIfr = parent.document.querySelector('.limited_ad_wrap iframe');
        if (_parentIfr) {
            _parentIfr.style.width = adWidth + 'px';
            _parentIfr.style.height = adHeight + 'px';
            _parentIfr.frameBorder = 0;
        }
    }
}
)();