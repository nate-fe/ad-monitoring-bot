try {
    var pel = document.querySelector('#ifr_main_banner');
    if (pel) {
        pel.removeAttribute('style');
        pel.setAttribute('id', 'tv_ad_area');
    }

    var head = document.querySelector('head');
    var styleText = '#ifr_main_banner{height: 610px; display: block; margin: 0 auto; text-align: center;}';
    var style = document.createElement('style');
    style.setAttribute("type", "text/css");
    var textNode = document.createTextNode(styleText);
    style.appendChild(textNode);
    head.appendChild(style);

} catch (e) { }
try {
    document.MAX_ct0 = 'INSERT_CLICK_URL';
    var zoneid = '109659';
    var m3_u = (location.protocol === 'https:' ? 'https://cas.criteo.com/delivery/ajs.php?' : 'http://cas.criteo.com/delivery/ajs.php?');
    var m3_r = Math.floor(Math.random() * 99999999999);
    var adsParams = 'zoneid=' + zoneid + '&cb=' + m3_r;
    if (document.MAX_used !== ',') adsParams += '&exclude=' + document.MAX_used;
    adsParams += document.charset ? '&charset=' + document.charset : (document.characterSet ? '&charset=' + document.characterSet : '');
    adsParams += '&loc=' + escape(window.location);
    if (document.referrer) adsParams += '&referer=' + escape(document.referrer);
    if (document.context) adsParams += '&context=' + escape(document.context);
    if ((typeof (document.MAX_ct0) !== 'undefined') && (document.MAX_ct0.substring(0, 4) === 'http')) {
        adsParams += '&ct0=' + escape(document.MAX_ct0);
    }
    if (document.mmm_fo) adsParams += '&mmm_fo=1';
    var adsTag = '<div id="ifr_main_banner"><script src=\"' + m3_u + adsParams + '\" type="text/javascript"><\/script></div>';
    document.write(adsTag);
} catch (e) { }