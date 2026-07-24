// try {
//     google_ad_client = 'ca-pub-8710503230568572';
//     google_ad_slot = '1394435440';
//     google_ad_height = '600';
//     google_ad_width = '120';
//     google_adtest = 'off';
//     google_ad_type = 'image,flash';
//     google_color_bg = 'ffffff';
//     google_color_border = 'ffffff';
//     google_color_link = 'ffffff';
//     google_encoding = 'euc-kr';
//     google_language = 'ko';
//     google_safe = 'high';
//     google_page_url = location.protocol + '//news.nate.com';
//     document.write('<script src="https://pagead2.googlesyndication.com/pagead/show_ads.js"><\/script>');
// } catch (e) { console.log(e) }

// try {
//     var mAds = '<script src="https://compass.adop.cc/assets/js/adop/adopJ.js?v=14" ><\/script>\
//       <ins class="adsbyadop" _adop_zon="14d55064-6a7a-4eb4-bbd1-257641484ba4" _adop_type="re" style="display:inline-block;width:120px;height:600px;" _page_url=""></ins>';
//     document.write(mAds);
// } catch (e) { }


try {
    document.addEventListener('DOMContentLoaded', function () {
        var _script = document.createElement('script');
        _script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'; // HTTPS 명시
        _script.async = true; // 비동기 로드 추가
        console.log('bb...');
        console.log(document.body); // 이제 null이 아님
        document.body.appendChild(_script);
        _script.onload = function () {
            var _ins = document.createElement('ins');
            _ins.classList.add('adsbygoogle');
            _ins.style = 'display:inline-block;width:120px;height:600px';
            _ins.setAttribute('data-ad-client', 'ca-pub-8710503230568572');
            _ins.setAttribute('data-ad-slot', '1394435440');
            _ins.setAttribute('data-ad-format', 'auto');
            _ins.setAttribute('data-adtest', 'on');
            _ins.setAttribute('data-full-width-responsive', 'true');
            console.log(_ins);
            document.body.appendChild(_ins);
            (adsbygoogle = window.adsbygoogle || []).push({}); // 광고 요청
        };
    });
} catch (e) {
    console.log('AdSense Error:', e);
}