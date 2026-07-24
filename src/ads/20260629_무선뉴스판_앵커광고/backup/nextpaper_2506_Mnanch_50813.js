(function () {
    try {
        var _head = document.querySelector('head');
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _script.async = true;
        _script.onload = function () {
            window.googletag = window.googletag || { cmd: [] };
            googletag.cmd.push(function () {
                var anchorSlot = googletag.defineOutOfPageSlot('/21682743634,22664242840/S003/nate_mo_ap_anchor_1x1', googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR);
                if (anchorSlot) anchorSlot.setTargeting('ad_type', 'anchor').addService(googletag.pubads());

                googletag.pubads().enableSingleRequest();
                googletag.pubads().set('page_url', '//nate.com');
                googletag.enableServices();
                googletag.display(anchorSlot);
            });
        }
        _head.appendChild(_script);
    } catch (err) {
        console.log(err);
    }
})();
