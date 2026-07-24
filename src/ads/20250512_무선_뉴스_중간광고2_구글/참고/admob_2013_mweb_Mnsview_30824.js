(function () {
    var $ad_view = document.getElementById('ad_innerView');
    if ($ad_view) {
        var _css = 'div.news_view div.view_cont #ad_innerView {margin:0 auto;} #ad_innerView{width:320px;height:auto;text-align:center;position:relative;}.ad_inner_view_box{position:absolute;top:0;left:10px;width:28px;height:18px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);font-size:12px;font-weight:500;color:#fff !important;line-height:18px !important;z-index:1;}#ad_innerView ins.adsbygoogle[data-ad-status="unfilled"] {display:block !important}',
            _style = document.createElement('style');
        _style.type = 'text/css';
        _style.styleSheet ? _style.styleSheet.cssText = _css : _style.appendChild(document.createTextNode(_css));
        $ad_view.appendChild(_style);

        var $page_script = document.createElement('script');
        $page_script.crossorigin = 'anonymous';
        $page_script.src = '//pagead2.googlesyndication.com/pagead/show_ads.js';
        $ad_view.appendChild($page_script);

        var _data = $ad_view.querySelector('script');
        var _code = _data.dataset.press_code || '';
        var _press = { kx: 5706127053, kh: 2344917804, cb: 4755458723, na: 4643778089, ns: 1961774427, do: 3228137526, mh: 5503765314, no: 8097320821, sg: 9218830809, at: 1340340782, yt: 2700141029, ch: 3774932438, jo: 7293992150, ck: 3354747144, hn: 2270279078, hi: 2887843288, ni: 7948598271, di: 6536827142, ak: 1383189928, mt: 6345255453, mk: 7466765439, se: 7050449570, ae: 3817781571, aj: 2919632877, sb: 8878536564, ed: 5345080692, ee: 2585123787, ey: 1065008614, cz: 7779672347, fn: 7204957270, fr: 1625327539, hk: 5891875605, hr: 8326467252, ss: 6124095304, dn: 3116456888, mw: 1569487210, bt: 1242184151, oh: 1377915522, hm: 3676775800, kb: 6623908316, ny: 8440935752, ht: 3806173289, kv: 9370874043, jt: 9179302350, nt: 7665527240, ob: 6169995632, sv: 4090627207, yn: 6454982381, dg: 1202655708, dd: 1725399883, iu: 6625275293, in: 1011084019, av: 6979131536, it: 4352968192, nn: 1726804858, dr: 8099236544, th: 7193348988, my: 6249886685, ez: 3623723349, bb: 9997560005, es: 8492906642, tn: 9220746527, sz: 7001777295, tt: 4375613954, kz: 3062532289, sd: 8123287276, sp: 6810205600, sw: 2870960593, sc: 9231273240, so: 6618633913, sr: 7726619882, st: 7740143896, sh: 3776848153, sk: 4922408864, su: 6030394836, ab: 2091149823, xs: 9025305409, fb: 3212659802, is: 8035657367, jn: 1470249016, ts: 1708006445, tv: 3904840660, iz: 9767541434, aa: 4142598097, pt: 6577189745, yy: 3951026403, mi: 8774023969, ma: 1324863063, js: 3202133089, cc: 6949806405, kr: 8582452276, ki: 6758234714, bn: 6886227220, en: 5381573866, pd: 4786128753, kp: 2159965416, gd: 2752644740, wh: 1439563076, lh: 6375091333, me: 7043506873, as: 9126481406, il: 6141225410, hw: 5538853517 };
        var _slot = _press[_code] || 2106906784;

        google_ad_client = 'ca-pub-8710503230568572';
        google_ad_slot = _slot;
        google_ad_height = '250';
        google_ad_width = '320';
        google_adtest = 'off';
        google_ad_type = 'image,flash';
        google_color_bg = 'ffffff';
        google_color_border = 'ffffff';
        google_color_link = 'ffffff';
        google_encoding = 'euc-kr';
        google_language = 'ko';
        google_safe = 'high';
        google_alternate_ad_url = location.protocol + '//cyad1.nate.com/html.kti/mnate/google@house_x13';


        var _adBox = document.createElement('div');
        _adBox.innerHTML = 'AD';
        _adBox.setAttribute('class', 'ad_inner_view_box');
        $ad_view.appendChild(_adBox);
    }
})();