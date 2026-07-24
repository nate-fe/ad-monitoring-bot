(function () {
    var _lib = document.createElement('script');
    var _center = document.createElement('center');
    var _div = document.createElement('div');
    var _script = document.createElement('script');
    var _body = document.querySelector('body');
    var _actionCode = `
                window.googletag = window.googletag || {cmd: []}; 
                googletag.cmd.push(function() { 
                var N = 1130; 
                var w = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0); 
                if (w < N) { return; } 
                googletag.defineSlot('/21682743634,22664242840/S003/nate_pc_ap_bottom01_120x600', [120,600], 'S003_nate_pc_ap_bottom01_120x600').addService(googletag.pubads().set('page_url', '//nate.com')); 
                googletag.pubads().enableSingleRequest(); 
                googletag.enableServices(); 
                googletag.display('S003_nate_pc_ap_bottom01_120x600'); 
                });
            `;
    _script.innerHTML = _actionCode;
    _lib.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
    _lib.async = true;
    _div.setAttribute('id', 'S003_nate_pc_ap_bottom01_120x600');
    _div.appendChild(_script);
    _center.appendChild(_div);
    _body.appendChild(_lib);
    _body.appendChild(_center);
}
)();