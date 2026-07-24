window.onload = function(){
    (function () {
        try {
            var $ad_client = 'ca-pub-8710503230568572';
            var $ad_slot = '4003584956';
            var $ad_width = 320;
            var $ad_height = 100;

            var $script = document.createElement('script');
            $script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + $ad_client;
            $script.async = true;
            $script.crossorigin = 'anonymous';
            $script.onload = function () {
                (adsbygoogle = window.adsbygoogle || []).push({});
            }

            var $ins = document.createElement('ins');
            $ins.className = 'adsbygoogle';
            $ins.style.display = 'inline-block';
            $ins.style.width = $ad_width + 'px';
            $ins.style.height = $ad_height + 'px';
            $ins.setAttribute('data-ad-client', $ad_client);
            $ins.setAttribute('data-ad-slot', $ad_slot);

            document.body.appendChild($script);
            document.body.appendChild($ins);

        } catch (err) { console.warn(err) }
    })();
}