(function () {
    var $ad_ids = ['pc_main_banner_01']; // 광고영역 id
    var $ad_client = 'ca-pub-8710503230568572'; // ad-client
    var $ad_slot = '8587720190'; //ad-slot
    var $ad_width = '728px'; // width
    var $ad_height = '90px'; // height

    var _script = document.createElement('script');
    _script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + $ad_client;
    _script.async = true;
    _script.crossorigin = 'anonymous';
    _script.onload = function () {
        (adsbygoogle = window.adsbygoogle || []).push({});
    }

    var _ins = document.createElement('ins');
    _ins.className = 'adsbygoogle';
    _ins.style.display = 'inline-block';
    _ins.style.width = $ad_width;
    _ins.style.height = $ad_height;
    _ins.setAttribute('data-ad-client', $ad_client);
    _ins.setAttribute('data-ad-slot', $ad_slot);

    if (self !== top) {
        document.body.appendChild(_ins);
        document.body.appendChild(_script);
    } else {
        $ad_ids.forEach(function ($ad_id) {
            if (document.getElementById($ad_id)) {
                document.body.appendChild(_ins);
                document.body.appendChild(_script);
            }
        });
    }
})();