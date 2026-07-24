(function () {
    try {
        var _head = document.querySelector('head');

        // 1. gpt.js 로더 스크립트
        var _script = document.createElement('script');
        _script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
        _script.async = true;
        _head.appendChild(_script);

        // 2. 설정 로직을 텍스트로 담은 인라인 스크립트
        var _inline = document.createElement('script');
        _inline.innerHTML = [
            "window.googletag = window.googletag || { cmd: [] };",
            "googletag.cmd.push(function () {",
            "    googletag.pubads().set('page_url', '//nate.com');",
            "    googletag.setConfig({ singleRequest: true });",
            "    var anchorSlot = googletag.defineOutOfPageSlot('/21682743634,22664242840/nate/nate_pc_main_anchor_1x1', googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR);",
            "    if (anchorSlot) {",
            "        anchorSlot.setTargeting({ad_type: 'anchor'}).addService(googletag.pubads());",
            "        googletag.enableServices();",
            "        googletag.display(anchorSlot);",
            "    }",
            "});"
        ].join('\n');
        _head.appendChild(_inline);
    } catch (err) {
        console.log(err);
    }
})();