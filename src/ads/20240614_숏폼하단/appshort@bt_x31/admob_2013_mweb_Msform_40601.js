(function () {
    try {
        var $css = 'ins[data-ad-status="filled"] > iframe,ins[data-ad-status="unfilled"] > div {display: none !important;} ins[data-ad-status="unfilled"] #passbackIframe {display: block !important;}';
        var $style = document.createElement('style');
        $style.type = 'text/css';
        $style.styleSheet ? $style.styleSheet.cssText = $css : $style.appendChild(document.createTextNode($css));

        document.head.appendChild($style);

        var $ad_width = 0;
        var $ad_height = 0;
        var $passback = document.createElement('iframe');
        $passback.src = '//cyad1.nate.com/html.kti/mnate/google@house_x10';
        $passback.width = '100%';
        $passback.height = 250;
        $passback.id = 'passbackIframe';
        $passback.setAttribute('frameborder', 0);
        $passback.setAttribute('scrolling', 'no');
        $passback.setAttribute('marginwidth', 0);
        $passback.setAttribute('marginheight', 0);
        $passback.setAttribute('vspace', 0);
        $passback.setAttribute('hspace', 0);
        $passback.setAttribute('allowtransparency', true);

        var $script = document.createElement('script');
        $script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8710503230568572';
        $script.async = true;
        $script.crossorigin = 'anonymous';
        $script.onload = function () {
            (adsbygoogle = window.adsbygoogle || []).push({});

            $ins.appendChild($passback);

            var config = { attributes: true, childList: true, subtree: true };
            var callback = (mutationList, observer) => {
                for (var mutation of mutationList) {
                    if (mutation.type === "attributes") {
                        if (mutation.attributeName === 'data-ad-status') {
                            if (mutation.attributeName === 'data-ad-status') {
                                if ($ins.getAttribute('data-ad-status') === 'unfilled') {
                                    $passback.setAttribute('style', 'width:300px; margin:0 auto;')
                                    $ad_width = 300;
                                    $ad_height = 250;
                                } else if ($ins.getAttribute('data-ad-status') === 'filled') {
                                    $ad_width = '100%';
                                    $ad_height = 300;
                                }
                            }
                            window.parent.document.querySelector('iframe[name=' + window.name + ']').width = $ad_width;
                            window.parent.document.querySelector('iframe[name=' + window.name + ']').height = $ad_height;
                        }
                    }
                }
            };

            var observer = new MutationObserver(callback);
            observer.observe($ins, config);
            // observer.disconnect(); 
        }

        var $ins = document.createElement('ins');
        $ins.setAttribute('class', 'adsbygoogle');
        $ins.setAttribute('style', 'display:block; margin:0 auto;');
        $ins.setAttribute('data-ad-format', 'fluid');
        $ins.setAttribute('data-ad-layout-key', '-6b+e7+1k-3k+53');
        $ins.setAttribute('data-ad-client', 'ca-pub-8710503230568572');
        $ins.setAttribute('data-ad-slot', '4675516993');

        document.getElementById('top_main_banner').appendChild($ins);
        document.getElementById('top_main_banner').appendChild($script);
    } catch (err) { console.warn(err) }
})();
